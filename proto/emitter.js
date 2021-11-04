export let EmitterError = class extends Error {
    constructor(errors) {
        super();
        this.name = 'dispatchEventExceptions';
        this.description = 'Some listeners throw unexpected exceptions. Check this.errors property.';
        this.errors = errors;
    }

    stopPropagation() {
        this._stopPropagation = true;
    }

    shouldPropagate() {
        return !this._stopPropagation;
    }
};

let Manager = class {
    constructor() {
        // what this object is listening from others
        this._emitterThisListeners = {};
        // what other oobjects are listing from us
        this._emitterListeners = {};
    }

    /**
     * @param {Emitter} target
     * @param {String} event
     * @param {function} callback
     */
    addListener(target, event, callback) {
        if (this._emitterThisListeners[event] && this._emitterThisListeners[event].target === target) {
            let error = new Error('duplicateListener: ' + event);
            setTimeout(() => { throw error; }, 10);
        }
        if (!target._emitterManager._emitterListeners[event]) {
            target._emitterManager._emitterListeners[event] = [];
        }
        this._emitterThisListeners[event] = {
            index: target._emitterManager._emitterListeners[event].push(callback) - 1,
            target: target
        };
    }

    /**
     * @param {Emitter} target
     * @param {String} event
     */
    removeListener(target, event) {
        target._emitterManager._emitterListeners[event][this._emitterThisListeners[event].index] = null;
        if (!target._emitterManager._emitterListeners[event].filter((e) => e !== null).length) {
            // cleanup when there's no one left, so we can alert when uninint later
            delete target._emitterManager._emitterListeners[event];
        }
        delete this._emitterThisListeners[event];
    }

    /**
     * @param {String} event
     * @returns null|{EmitterError} Call EmitterError.stopPropagation() to avoid throwing the exception
     */
    dispatchEvent(event, ...eventData) {
        if (!this._emitterListeners || !this._emitterListeners[event]) {
            return;
        }
        let errors = [];
        this._emitterListeners[event].forEach(callback => {
            try {
                if (callback) {
                    callback(...eventData);
                }
            } catch (err) {
                errors.push(err);
            }
        });
        if (errors.length) {
            let error = new EmitterError(errors);
            setTimeout(() => this._propagateErrors(error), 10);
            return error;
        }
        return null;
    }

    /**
     * @param {EmitterError} error
     */
    _propagateErrors(error) {
        if (error.shouldPropagate()) {
            error.errors.forEach((childError) => {
                setTimeout(
                    () => {
                        throw childError;
                    },
                    10
                );
            });
        }
    }

    uninit() {
        if (Object.keys(this._emitterListeners).length) {
            let error = new Error('tryingToUninitObjectWithActiveListeners');
            setTimeout(() => { throw error; }, 10);
        }
        for (let event in this._emitterThisListeners) {
            delete this._emitterThisListeners[event].target._emitterListeners[this._emitterThisListeners[event].index];
        }
    }
};

export let Emitter = class {
    constructor() {
        this._emitterManager = new Manager(this);
    }

    /**
     * Add a listener in the target object that Will call callback when dispatching the event
     * @param {Emitter} target
     * @param {String} event
     * @param {function} callback
     */
    addListener(target, event, callback) {
        this._emitterManager.addListener(target, event, callback);
    }

    /**
     * @param {Emitter} target
     * @param {String} event
     */
    removeListener(target, event) {
        this._emitterManager.removeListener(target, event);
    }

    /**
     * This method will call all listeners and capture any exception they may throw. Unless specified, exceptions
     * are thrown later on setTimeout, to avoid breaking code flow.
     * @returns null|{EmitterError} Call EmitterError.stopPropagation() to avoid throwing the exception
     */
    dispatchEvent(event, ...eventData) {
        this._emitterManager.dispatchEvent(event, ...eventData);
    }

    uninit() {
        this._emitterManager.uninit();
    }
};
