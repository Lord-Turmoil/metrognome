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
        // CAPBridgedPlugin requires every JS-callable method to be enumerated
        // here, including the inherited listener machinery from CAPPlugin.
        CAPPluginMethod(name: "addListener", returnType: CAPPluginReturnCallback),
        CAPPluginMethod(name: "removeAllListeners", returnType: CAPPluginReturnNone),
    ]

    private let engine = MetronomeAudioEngine()

    override public func load() {
        super.load()
        engine.onBeat = { [weak self] beatIndex in
            DispatchQueue.main.async {
                self?.notifyListeners("beat", data: ["beatIndex": beatIndex])
            }
        }
    }

    @objc func initialize(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    @objc func startPlayback(_ call: CAPPluginCall) {
        do {
            let config = try parseConfig(call: call)
            try engine.start(config: config)
            call.resolve()
        } catch let error as ConfigError {
            call.reject(error.message)
        } catch {
            call.reject("Failed to start native metronome playback: \(error.localizedDescription)")
        }
    }

    @objc func updatePlayback(_ call: CAPPluginCall) {
        do {
            let config = try parseConfig(call: call)
            engine.update(config: config)
            call.resolve()
        } catch let error as ConfigError {
            call.reject(error.message)
        } catch {
            call.reject("Failed to update native metronome playback: \(error.localizedDescription)")
        }
    }

    @objc func stopPlayback(_ call: CAPPluginCall) {
        engine.stop()
        call.resolve()
    }

    // MARK: - Helpers

    private struct ConfigError: Error { let message: String }

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
