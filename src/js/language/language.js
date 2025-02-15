/**
 * @module language
 * i18n support.
 */

import { Storage } from "../storage";
import { EN_DICT } from "./en";
import { ZH_DICT } from "./zh";

class LanguageManager {
    constructor() {
        this.dictionary = {
            "en": EN_DICT,
            "zh": ZH_DICT
        }
        this.language = "en";
        this.languageChangeListeners = [];

        this.initCallbacks();

        this.load();    // this will transitively invoke update()
    }

    /**
     * Set the language.
     * @param {string} language The language to set.
     */
    setLanguage(language) {
        if (language in this.dictionary) {
            this.language = language;
            this.notifyAll();
        }
    }

    /**
     * Get the text of the key.
     * @param {string} key The key of the text.
     * @returns {string} The text.
     */
    getText(key) {
        return this.dictionary[this.language][key];
    }

    addLanguageChangeListener(listener) {
        this.languageChangeListeners.push(listener);
    }

    notifyAll() {
        this.languageChangeListeners.forEach((listener) => {
            listener(this.language);
        });
    }

    /**
     * Update all the text in the page.
     */
    update() {
        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            element.textContent = this.getText(key);
        });
    }

    initCallbacks() {
        (function (_this) {
            document.getElementById("language").onclick = () => {
                _this.setLanguage(_this.language === "en" ? "zh" : "en");
            };
        })(this);
        this.addLanguageChangeListener(() => this.update());
        this.addLanguageChangeListener(() => this.save());
    }

    load() {
        // use setLanguage to avoid invalid language
        this.setLanguage(Storage.loadString("language", "en"));
    }

    save() {
        Storage.save("language", this.language);
    }
}

export { LanguageManager };