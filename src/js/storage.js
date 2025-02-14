/**
 * @module storage
 * Handles local storage.
 */

class Storage {
    static save(key, value) {
        localStorage.setItem(key, value);
    }

    static loadInt(key, defaultValue) {
        return parseInt(localStorage.getItem(key)) || defaultValue;
    }

    static loadBool(key, defaultValue) {
        const value = localStorage.getItem(key);
        if (value === "true") {
            return true;
        }
        if (value === "false") {
            return false;
        }
        return defaultValue;
    }
};

export { Storage };