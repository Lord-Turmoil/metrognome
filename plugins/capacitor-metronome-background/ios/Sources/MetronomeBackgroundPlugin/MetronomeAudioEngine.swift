import AVFoundation
import Foundation
import os.lock

/// Native iOS metronome audio engine. Mirrors the Android foreground service:
/// pre-cached PCM click buffers (tick/tok/tak) generated for the active waveform,
/// and a real-time AVAudioSourceNode render block that schedules and mixes
/// click voices on the audio clock for sample-accurate timing.
final class MetronomeAudioEngine {
    struct Config {
        var bpm: Int
        var beats: Int
        var stressFirst: Bool
        var subdivision: [Int]
        var waveform: String

        static func defaults() -> Config {
            return Config(bpm: 60, beats: 4, stressFirst: true,
                          subdivision: [1], waveform: "square")
        }
    }

    private struct Voice {
        let data: [Float]
        var pos: Int
        var offset: Int
    }

    // Match the Web Speaker exactly: same frequencies and 40 ms click duration.
    private static let tickHz: Double = 1600.0
    private static let tokHz: Double = 800.0
    private static let takHz: Double = 600.0
    private static let clickDurationMs: Double = 40.0

    private let sampleRate: Double = 48000.0
    private let engine = AVAudioEngine()
    private var sourceNode: AVAudioSourceNode!

    // Mutated only by main/plugin thread (under `lock`).
    private var lock = os_unfair_lock_s()
    private var pending: Config? = nil
    private var pendingStructural: Bool = false
    private var running: Bool = false

    // Mutated only by the render thread.
    private var current: Config = Config.defaults()
    private var beatIdx: Int = 0
    private var noteIdx: Int = 0
    private var nextClickFrame: Double = 0
    private var framesRendered: Int64 = 0
    private var samplesPerNote: Double = 48000.0
    private var voices: [Voice] = []
    private var cachedWaveform: String = ""
    private var tickClick: [Float] = []
    private var tokClick: [Float] = []
    private var takClick: [Float] = []

    init() {
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        sourceNode = AVAudioSourceNode(format: format) { [weak self] _, _, frameCount, abl -> OSStatus in
            guard let self = self else { return noErr }
            return self.render(frameCount: Int(frameCount), abl: abl)
        }
        engine.attach(sourceNode)
        engine.connect(sourceNode, to: engine.mainMixerNode, format: format)

        ensureClickCache(waveform: current.waveform)
        samplesPerNote = computeSamplesPerNote(bpm: current.bpm,
                                                subdivisionLength: current.subdivision.count)
        voices.reserveCapacity(8)
        observeInterruptions()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Public control surface

    func start(config: Config) throws {
        try configureSession()
        applyConfig(config, structural: true)
        running = true
        if !engine.isRunning {
            try engine.start()
        }
    }

    func update(config: Config) {
        os_unfair_lock_lock(&lock)
        let prev = pending ?? current
        let structural = pendingStructural
            || config.beats != prev.beats
            || config.subdivision.count != prev.subdivision.count
        pending = config
        pendingStructural = structural
        os_unfair_lock_unlock(&lock)
    }

    func stop() {
        running = false
        if engine.isRunning {
            engine.stop()
        }
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }

    // MARK: - Session and interruptions

    private func configureSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default, options: [])
        try session.setActive(true, options: [])
    }

    private func observeInterruptions() {
        NotificationCenter.default.addObserver(
            self, selector: #selector(handleInterruption(_:)),
            name: AVAudioSession.interruptionNotification, object: nil)
    }

    @objc private func handleInterruption(_ note: Notification) {
        guard let info = note.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        switch type {
        case .began:
            engine.pause()
        case .ended:
            guard running else { return }
            if let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                if options.contains(.shouldResume) {
                    try? AVAudioSession.sharedInstance().setActive(true, options: [])
                    try? engine.start()
                }
            }
        @unknown default:
            break
        }
    }

    // MARK: - Configuration application

    private func applyConfig(_ config: Config, structural: Bool) {
        os_unfair_lock_lock(&lock)
        pending = config
        pendingStructural = structural
        os_unfair_lock_unlock(&lock)
    }

    // MARK: - Render (audio thread)

    private func render(frameCount: Int, abl: UnsafeMutablePointer<AudioBufferList>) -> OSStatus {
        let buffers = UnsafeMutableAudioBufferListPointer(abl)
        guard let outPtr = buffers[0].mData?.assumingMemoryBound(to: Float.self) else {
            return noErr
        }
        for i in 0..<frameCount { outPtr[i] = 0 }

        // Best-effort, lock-free poll for new config.
        if os_unfair_lock_trylock(&lock) {
            if let next = pending {
                let structural = pendingStructural
                pending = nil
                pendingStructural = false
                os_unfair_lock_unlock(&lock)
                applyPendingOnRenderThread(next, structural: structural)
            } else {
                os_unfair_lock_unlock(&lock)
            }
        }

        let blockStart = framesRendered
        let blockEnd = framesRendered + Int64(frameCount)
        let subLen = max(1, current.subdivision.count)
        let beatsCount = max(1, current.beats)

        // Schedule new clicks falling in this block.
        while nextClickFrame < Double(blockEnd) {
            let startFrame = max(Double(blockStart), nextClickFrame)
            let offset = Int(Int64(startFrame) - blockStart)
            if noteIdx < current.subdivision.count, current.subdivision[noteIdx] == 1 {
                voices.append(Voice(data: pickClick(), pos: 0, offset: offset))
            }
            noteIdx += 1
            if noteIdx >= subLen {
                noteIdx = 0
                beatIdx += 1
                if beatIdx >= beatsCount { beatIdx = 0 }
            }
            nextClickFrame += samplesPerNote
        }

        // Mix active voices into out buffer.
        var i = 0
        while i < voices.count {
            var voice = voices[i]
            let srcRemaining = voice.data.count - voice.pos
            let dstRoom = frameCount - voice.offset
            let n = min(srcRemaining, dstRoom)
            if n > 0 {
                for k in 0..<n {
                    var mixed = outPtr[voice.offset + k] + voice.data[voice.pos + k]
                    if mixed > 1.0 { mixed = 1.0 } else if mixed < -1.0 { mixed = -1.0 }
                    outPtr[voice.offset + k] = mixed
                }
                voice.pos += n
            }
            voice.offset = 0
            if voice.pos >= voice.data.count {
                voices.remove(at: i)
            } else {
                voices[i] = voice
                i += 1
            }
        }

        framesRendered += Int64(frameCount)
        return noErr
    }

    private func applyPendingOnRenderThread(_ next: Config, structural: Bool) {
        current = next
        ensureClickCache(waveform: next.waveform)
        samplesPerNote = computeSamplesPerNote(bpm: next.bpm,
                                                subdivisionLength: max(1, next.subdivision.count))
        if structural {
            beatIdx = 0
            noteIdx = 0
            nextClickFrame = Double(framesRendered) + sampleRate * 0.005
            voices.removeAll(keepingCapacity: true)
        } else {
            if beatIdx >= max(1, next.beats) { beatIdx = 0 }
            if noteIdx >= max(1, next.subdivision.count) { noteIdx = 0 }
        }
    }

    private func pickClick() -> [Float] {
        if beatIdx == 0 && noteIdx == 0 {
            return current.stressFirst ? tickClick : tokClick
        }
        return noteIdx == 0 ? tokClick : takClick
    }

    private func computeSamplesPerNote(bpm: Int, subdivisionLength: Int) -> Double {
        let denom = max(1, bpm) * max(1, subdivisionLength)
        return (60.0 * sampleRate) / Double(denom)
    }

    // MARK: - Click synthesis

    private func ensureClickCache(waveform: String) {
        let normalized = MetronomeAudioEngine.normalizeWaveform(waveform)
        if normalized == cachedWaveform && !tickClick.isEmpty { return }
        tickClick = generateClick(waveform: normalized,
                                  freqHz: MetronomeAudioEngine.tickHz,
                                  durationMs: MetronomeAudioEngine.clickDurationMs,
                                  amplitude: 0.95)
        tokClick = generateClick(waveform: normalized,
                                 freqHz: MetronomeAudioEngine.tokHz,
                                 durationMs: MetronomeAudioEngine.clickDurationMs,
                                 amplitude: 0.85)
        takClick = generateClick(waveform: normalized,
                                 freqHz: MetronomeAudioEngine.takHz,
                                 durationMs: MetronomeAudioEngine.clickDurationMs,
                                 amplitude: 0.70)
        cachedWaveform = normalized
    }

    static func normalizeWaveform(_ waveform: String) -> String {
        switch waveform {
        case "sine", "square", "sawtooth", "triangle":
            return waveform
        default:
            return "square"
        }
    }

    private func generateClick(waveform: String, freqHz: Double,
                               durationMs: Double, amplitude: Double) -> [Float] {
        let frames = Int((sampleRate * durationMs / 1000.0).rounded())
        var buf = [Float](repeating: 0, count: frames)
        let phaseStep = freqHz / sampleRate
        // ~1 ms linear attack/release to suppress digital pop, matching the
        // Android implementation. No exponential decay - timbre stays close
        // to a Web Audio oscillator.
        let ramp = max(1, Int(sampleRate / 1000.0))
        for i in 0..<frames {
            let phase = (phaseStep * Double(i)).truncatingRemainder(dividingBy: 1.0)
            let sample = waveformSample(waveform: waveform, phase: phase)
            var envelope = 1.0
            if i < ramp {
                envelope = Double(i) / Double(ramp)
            } else if i > frames - ramp {
                envelope = Double(frames - i) / Double(ramp)
            }
            var v = sample * envelope * amplitude
            if v > 1.0 { v = 1.0 } else if v < -1.0 { v = -1.0 }
            buf[i] = Float(v)
        }
        return buf
    }

    private func waveformSample(waveform: String, phase: Double) -> Double {
        switch waveform {
        case "square":
            return phase < 0.5 ? 1.0 : -1.0
        case "sawtooth":
            return 2.0 * phase - 1.0
        case "triangle":
            return phase < 0.5 ? 4.0 * phase - 1.0 : 3.0 - 4.0 * phase
        case "sine":
            return sin(2.0 * .pi * phase)
        default:
            return phase < 0.5 ? 1.0 : -1.0
        }
    }
}
