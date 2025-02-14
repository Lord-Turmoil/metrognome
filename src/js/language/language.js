/**
 * @module language
 * i18n support.
 */

import { EN_DICT } from "./en";
import { ZH_DICT } from "./zh";

class LanguageManager {
    constructor() {
        this.dictionary = {
            "en": EN_DICT,
            "zh": ZH_DICT
        }
        this.language = "zh";

        this.update();
        this.initCallbacks();
    }

    /**
     * Set the language.
     * @param {string} language The language to set.
     */
    setLanguage(language) {
        if (language in this.dictionary) {
            this.language = language;
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
                _this.update();
            };
        })(this);
    }
}

export { LanguageManager };