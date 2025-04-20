/**
 * @module version
 * Checks for updates and displays the current version.
 */

import { Capacitor } from "@capacitor/core";

import { Api } from "../api";
import { LanguageManager } from "../language/language";

class VersionModule {
    /**
     * @param {LanguageManager} language 
     */
    constructor(language) {
        this.api = new Api();
        this.language = language;

        this.connectedContainer = document.getElementById("network-connected");
        this.disconnectedContainer = document.getElementById("network-disconnected");
        this.version = document.getElementById("version").innerText;

        this.downloadListeners = [];

        this.initCallbacks();

        this.update();
    }

    addDownloadListener(listener) {
        this.downloadListeners.push(listener);
    }

    /**
     * @param {string} platform App platform.
     * @param {string} action install or update.
     */
    notifyAll(platform, action) {
        this.downloadListeners.forEach(listener => {
            listener(platform, action);
        });
    }

    /**
     * Set the current network connection status.
     * @param {boolean} connected Whether there is network connection or not.
     */
    setConnected(connected) {
        this.connectedContainer.style.display = connected ? "block" : "none";
        this.disconnectedContainer.style.display = connected ? "none" : "block";
    }

    async getMeta() {
        const response = await this.api.getMeta();
        if (!Api.isOk(response)) {
            console.log("Error getting meta information", response.error);
            return Promise.resolve(undefined);
        }
        return Promise.resolve(response.data);
    }

    async update() {
        console.log("Checking for updates");
        const meta = await this.getMeta();
        if (meta === undefined) {
            console.log("Error getting meta information");
            return;
        }
        console.log(`Current version: ${this.version}`);
        console.log(`Latest version: ${meta.version}`);
        const platform = Capacitor.getPlatform();
        if (platform === "web") {
            this.setCallbacksWeb(meta);
        } else if (platform === "android" || platform === "ios") {
            this.setCallbacksMobile(meta);
        }
        this.setChangelog(meta.changelog);
    }

    initCallbacks() {
        this.api.addConnectivityListener(connected => {
            this.setConnected(connected);
        });
        document.getElementById("version").onclick = () => {
            this.update();
        }
    }

    showChangelog() {
        document.getElementById("changelog").style.display = "block";
    }

    setCallbacksWeb(meta) {
        function setCallback(_this, name, value) {
            if (value === "") {
                return;
            }
            const element = document.getElementById(name);
            if (element === null) {
                return;
            }
            (function (__this) {
                element.onclick = () => {
                    if (name.includes("android")) {
                        __this.notifyAll("android", "install");
                    } else if (name.includes("ios")) {
                        __this.notifyAll("ios", "install");
                    }
                    window.open(value, "_blank");
                };
            })(_this);
            element.style.display = "inline-block";
        }
        setCallback(this, "web-download-android", meta.android.link);
        setCallback(this, "web-download-android-mirror", meta.android.mirror);
        this.showChangelog();
    }

    isHigherVersion(version) {
        const current = this.version.split(".");
        const latest = version.split(".");
        for (let i = 0; i < current.length; i++) {
            if (parseInt(current[i]) < parseInt(latest[i])) {
                return true;
            }
        }
        return false;
    }

    setChangelog(changelog) {
        const ul = document.getElementById("changelog").getElementsByTagName("ul")[0];
        ul.innerHTML = "";
        for (let i = 0; i < changelog.length; i++) {
            const entry = changelog[i];
            const li = document.createElement("li");
            li.classList.add("i18n");
            li.setAttribute("data-i18n", `changelog-${i}`);
            ul.appendChild(li);
            this.language.addText(`changelog-${i}`, {
                "en": entry[0],
                "zh": entry[1]
            });
        }
        this.language.update();
    }

    setCallbacksMobile(meta) {
        function setCallback(_this, name, value) {
            if (value === "") {
                return;
            }
            const element = document.getElementById(name);
            if (element === null) {
                return;
            }
            (function (__this) {
                element.onclick = () => {
                    __this.notifyAll("android", "update");
                    window.open(value, "_blank");
                };
            })(_this);
            element.style.display = "inline-block";
        }

        if (this.isHigherVersion(meta.version)) {
            document.getElementById("android-latest-version").style.display = "none";
            document.getElementById("android-update-available").style.display = "block";
            setCallback(this, "android-download-android", meta.android.link);
            setCallback(this, "android-download-android-mirror", meta.android.mirror);
            this.showChangelog();
        }
    }
}

export { VersionModule };