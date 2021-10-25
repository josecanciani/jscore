/**
 * A simple wrapper so complex objects can be stored and retrieved transparently
 * @param {LocalStorage} localStorage
 * @extends {LocalStorage}
*/
export let LocalStorageWrapper = class {
    constructor(localStorage) {
        this.localStorage = localStorage;
    }

    setItem(name, value) {
        this.localStorage.setItem(name, JSON.stringify(value));
    }

    getItem(name) {
        const value = this.localStorage.getItem(name);
        try {
            return value === null ? null : JSON.parse(value);
        } catch (err) {
            setTimeout(
                () => {
                    throw new Error('cannotParseLocalStorage: ' + name + ' => ' + String(value));
                },
                10
            );
            return null;
        }
    }

    removeItem(name) {
        return this.localStorage.removeItem(name);
    }

    /**
     * All keys in the database
     * @returns {Array}
     */
    getAllKeys() {
        return Object.keys(this.localStorage);
    }
};
