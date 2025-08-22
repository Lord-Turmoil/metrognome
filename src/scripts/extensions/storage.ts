class Storage {
    static save(key: string, value: string | number | boolean): void {
        localStorage.setItem(key, value.toString());
    }

    static loadString(key: string, defaultValue: string): string {
        return localStorage.getItem(key) || defaultValue;
    }

    static loadInt(key: string, defaultValue: number): number {
        const value = localStorage.getItem(key);
        const number = value !== null ? parseInt(value, 10) : defaultValue;
        return isNaN(number) ? defaultValue : number;
    }

    static loadBool(key: string, defaultValue: boolean): boolean {
        const value = localStorage.getItem(key);
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
        return defaultValue;
    }
}

export default Storage;
