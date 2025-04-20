/**
 * @module counter
 * LeanCloud storage counter.
 */

import {Capacitor} from "@capacitor/core";
import {Object, Query} from "leancloud-storage";

/*
Data model:

Download
{
    "platform": "android",
    "action": "install",
    "count": 0
}
*/

class CounterModule {
    static createPlatformSpecificInstance() {
        if (Capacitor.getPlatform() === "web") {
            return new CounterModuleWeb();
        } else {
            return new CounterModuleMobile();
        }
    }

    increase() {
    }
}

class CounterModuleWeb extends CounterModule {
    constructor() {
        super();
        this.counterWrapper = document.getElementById("counter-wrapper");
        this.counter = document.getElementById("counter");
        this.init();
    }

    async init() {
        const count = await this.query();
        if (count.ok) {
            this.counterWrapper.style.display = "flex";
            this.counter.innerText = count.total;
        } else {
            this.counterWrapper.style.display = "none";
        }
    }

    /**
     * Increase download counter on specified platform and action.
     * @param {string} platform App platform.
     * @param {string} action action, can be "install" or "update".
     */
    async increase(platform, action) {
        const query = new Query("Download");
        query.equalTo("platform", platform);
        query.equalTo("action", action);
        await query.find().then(results => {
            if (results.length === 0) {
                const download = new Object("Download");
                download.set("platform", platform);
                download.set("action", action);
                download.set("count", 1);
                download.save().then(() => {
                    console.log("Hey, you are the first one to download!");
                }).catch(error => {
                    console.error("Error on first download", error);
                });
            } else {
                const download = results[0];
                download.increment("count", 1);
                download.save().then(() => {
                    console.log("Thanks for downloading!");
                }).catch(error => {
                    console.error("Error increasing download counter", error);
                });
            }
        }).catch(error => {
            console.error("Error querying counter", error);
        });
        this.counter.innerHTML = (parseInt(this.counter.innerHTML) + 1).toString();
    }

    /**
     * Query download count.
     * @return {Promise} The promise that resolves with the download.
     * {
     *     "android": {
     *         "install": 0,
     *         "update": 0,
     *         "total": 0
     *     },
     *     "ios": {
     *         "install": 0,
     *         "update": 0,
     *         "total": 0
     *     }
     *     "total": 0
     * }
     */
    async query() {
        const download = {
            "ok": false,    // error status
            "android": {
                "install": 0,
                "update": 0,
                "total": 0
            },
            "ios": {
                "install": 0,
                "update": 0,
                "total": 0
            },
            "total": 0
        };

        const query = new Query("Download");
        const results = await query.find().then(results => {
            return results;
        }).catch(error => {
            console.error("Error querying counter", error);
            return undefined;
        });
        if (results === undefined) {
            return download;
        }

        results.forEach(result => {
            const platform = result.get("platform");
            const action = result.get("action");
            download[platform][action] = result.get("count");
        });

        download.android.total = download.android.install + download.android.update;
        download.ios.total = download.ios.install + download.ios.update;
        download.total = download.android.total + download.ios.total;
        download.ok = true;

        return download;
    }
}

/**
 * Do nothing on mobile.
 */
class CounterModuleMobile extends CounterModule {
    constructor() {
        super();
        document.getElementById("counter-wrapper").style.display = "none";
    }

    increase() {
        // do nothing
    }
}


export {CounterModuleWeb as CounterModule};