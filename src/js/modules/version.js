/**
 * @module version
 * Checks for updates and displays the current version.
 */

import { Capacitor } from "@capacitor/core";
import { Api } from "../api";

class VersionModule {
    constructor() {
        this.api = new Api();

        this.connectedContainer = document.getElementById("network-connected");
        this.disconnectedContainer = document.getElementById("network-disconnected");
        this.version = document.getElementById("version").innerText;

        this.initCallbacks();
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
        const meta = await this.getMeta();
        if (meta === undefined) {
            return;
        }
        const platform = Capacitor.getPlatform();
        if (platform === "web") {
            this.setCallbacksWeb(meta);
        } else if (platform === "android" || platform === "ios") {
            this.setCallbacksMobile(meta);
        }
    }

    initCallbacks() {
        this.api.addConnectivityListener(connected => {
            this.setConnected(connected);
        });
    }


    setCallbacksWeb(meta) {
        function setCallback(name, value) {
            if (value === "") {
                return;
            }
            const element = document.getElementById(name);
            if (element === null) {
                return;
            }
            element.onclick = () => {
                window.open(value, "_blank");
            };
            element.style.display = "inline-block";
        }
        setCallback("web-download-android", meta.android.link);
        setCallback("web-download-android-mirror", meta.android.mirror);
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

    setCallbacksMobile(meta) {
        function setCallback(name, value) {
            if (value === "") {
                return;
            }
            const element = document.getElementById(name);
            if (element === null) {
                return;
            }
            element.onclick = () => {
                window.open(value, "_blank");
            };
            element.style.display = "inline-block";
        }

        console.log(this.version, meta.version);

        if (this.isHigherVersion(meta.version)) {
            document.getElementById("android-latest-version").style.display = "none";
            document.getElementById("android-update-available").style.display = "block";
            setCallback("android-download-android", meta.android.link);
            setCallback("android-download-android-mirror", meta.android.mirror);
        }
    }
};

export { VersionModule };