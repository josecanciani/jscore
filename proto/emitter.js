
export let Emitter = class {
    constructor() {
        // what this object is listening from others
        this._emitterThisListeners = {};
        // what other oobjects are listing from us
        this._emitterListeners = {};
    }

    /**
     *
     * @param {Emitter} target
     * @param {String} event
     * @param {function} callback
     */
    addListener(target, event, callback) {
        if (this._emitterThisListeners[event] && this._emitterThisListeners[event].target == target) {
            let error = new Error('duplicateListener: ' + event);
            setTimeout(() => { throw error; }, 10);
        }
        if (!target._emitterListeners[event]) {
            target._emitterListeners[event] = [];
        }
        this._emitterThisListeners[event] = {
            index: target._emitterListeners[event].push(callback) - 1,
            target: target
        };
    }

    removeListener(target, event) {
        delete target._emitterListeners[event][this._emitterThisListeners[event]];
        delete this._emitterThisListeners[event];
    }

    /**
     * This method will call all listeners and capture any exception they may throw. Unless specified, exceptions
     * are thrown later on setTimeout, to avoid breaking code flow.
     * @returns null|{EmitterError} Call EmitterError.stopPropagation() to avoid throwing the exception
     */
    dispatchEvent(eventName, ...eventData) {
        if (!this._emitterListeners || !this._emitterListeners[eventName]) {
            return;
        }
        let errors = [];
        this._emitterListeners[eventName].forEach(callback => {
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
            setTimeout(
                () => {
                    if (error.shouldPropagate()) {
                        error.errors.forEach((childError) => {
                            setTimeout(
                                () => {
                                    throw childError;
                                },
                                10
                            )
                        });
                    }
                },
                10
            );
            return error;
        }
        return null;
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
}
