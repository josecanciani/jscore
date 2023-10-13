/**
 * A simple wrapper so complex objects can be stored and retrieved transparently
 * @param {LocalStorage} localStorage
 * @extends {LocalStorage}
*/
export let LocalStorageWrapper = class {
    constructor(localStorage, prefix) {
        this.localStorage = localStorage;
        this.prefix = 'jscore_' + (prefix || '');
    }

    setItem(keyName, value) {
        this.localStorage.setItem(this.prefix + keyName, JSON.stringify(value));
    }

    getItem(keyName) {
        const value = this.localStorage.getItem(this.prefix + keyName);
        try {
            return value === null ? null : JSON.parse(value);
        } catch (err) {
            setTimeout(
                () => {
                    throw new Error('cannotParseLocalStorage: ' + keyName + ' => ' + String(value));
                },
                10
            );
            return null;
        }
    }

    removeItem(keyName) {
        return this.localStorage.removeItem(this.prefix + keyName);
    }

    /**
     * All keys in the database
     * @returns {Array}
     */
    getAllKeys() {
        return Object.keys(this.localStorage).filter((keyName) => keyName.startsWith(this.prefix)).map((keyName) => keyName.substring(this.prefix.length));
    }
};
