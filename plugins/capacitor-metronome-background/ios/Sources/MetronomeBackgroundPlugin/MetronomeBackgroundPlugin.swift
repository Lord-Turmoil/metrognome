import Capacitor
import Foundation

@objc(MetronomeBackgroundPlugin)
public class MetronomeBackgroundPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MetronomeBackgroundPlugin"
    public let jsName = "MetronomeBackground"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startPlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updatePlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopPlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addBeatListener", returnType: CAPPluginReturnCallback),
        CAPPluginMethod(name: "removeBeatListener", returnType: CAPPluginReturnPromise),
    ]

    private let engine = MetronomeAudioEngine()
    private var savedBeatCall: CAPPluginCall?

    override public func load() {
        super.load()
        engine.onBeat = { [weak self] beatIndex in
            DispatchQueue.main.async {
                self?.savedBeatCall?.resolve(["beatIndex": beatIndex])
            }
        }
    }

    @objc func addBeatListener(_ call: CAPPluginCall) {
        if let previous = savedBeatCall {
            bridge?.releaseCall(previous)
        }
        call.keepAlive = true
        savedBeatCall = call
    }

    @objc func removeBeatListener(_ call: CAPPluginCall) {
        if let previous = savedBeatCall {
            bridge?.releaseCall(previous)
            savedBeatCall = nil
        }
        call.resolve()
    }

    @objc func initialize(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    @objc func startPlayback(_ call: CAPPluginCall) {
        runWithConfig(call, operationLabel: "start") { try engine.start(config: $0) }
    }

    @objc func updatePlayback(_ call: CAPPluginCall) {
        runWithConfig(call, operationLabel: "update") { engine.update(config: $0) }
    }

    @objc func stopPlayback(_ call: CAPPluginCall) {
        engine.stop()
        call.resolve()
    }

    // MARK: - Helpers

    private struct ConfigError: Error { let message: String }

    private func runWithConfig(
        _ call: CAPPluginCall,
        operationLabel: String,
        action: (MetronomeAudioEngine.Config) throws -> Void
    ) {
        do {
            let config = try parseConfig(call: call)
            try action(config)
            call.resolve()
        } catch let error as ConfigError {
            call.reject(error.message)
        } catch {
            call.reject("Failed to \(operationLabel) native metronome playback: \(error.localizedDescription)")
        }
    }

    private func parseConfig(call: CAPPluginCall) throws -> MetronomeAudioEngine.Config {
        let bpm = call.getInt("bpm") ?? 60
        let beats = call.getInt("beats") ?? 4
        let stressFirst = call.getBool("stressFirst") ?? true
        let waveform = MetronomeAudioEngine.normalizeWaveform(call.getString("waveform") ?? "square")

        guard (1...400).contains(bpm) else {
            throw ConfigError(message: "bpm must be within 1..400")
        }
        guard (1...32).contains(beats) else {
            throw ConfigError(message: "beats must be within 1..32")
        }

        var subdivision: [Int] = [1]
        if let raw = call.getArray("subdivision"), !raw.isEmpty {
            var parsed: [Int] = []
            parsed.reserveCapacity(raw.count)
            for item in raw {
                if let n = item as? Int {
                    parsed.append(n == 0 ? 0 : 1)
                } else if let n = item as? NSNumber {
                    parsed.append(n.intValue == 0 ? 0 : 1)
                } else {
                    parsed.append(1)
                }
            }
            if !parsed.isEmpty { subdivision = parsed }
        }

        return MetronomeAudioEngine.Config(
            bpm: bpm,
            beats: beats,
            stressFirst: stressFirst,
            subdivision: subdivision,
            waveform: waveform
        )
    }
}
