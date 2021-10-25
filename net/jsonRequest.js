export let JsonRequestError = class extends Error {
    setResponseText(responseText) {
        this.responseText = responseText;
    }

    getResponseText() {
        return this.responseText;
    }
}

export let JsonRequest = class {
    constructor(url, headers) {
        this.url = url;
        this.headers = headers;
    }

    async get() {
        let response;
        try {
            response = await fetch(this.url, {headers: this.headers || {}});
        } catch (e) {
            throw new JsonRequestError('JsonRequestError: fetch error: ' + String(e));
        }
        this.responseHeaders = response.headers;
        if (!response.ok) {
            let error = new JsonRequestError('JsonRequestError: there was an error processing your request');
            error.setResponseText(await response.text());
            throw error;
        }
        if (response.status !== 200) {
            throw new JsonRequestError('JsonRequestError: got http code ' + response.status);
        }
        return await response.json();
    }

    async getArray(retryCallback) {
        try {
            let array = await this.get();
            if (!Array.isArray(array)) {
                this._timeout = setTimeout(retryCallback, 10000);
                throw new JsonRequestError('JsonRequestError: expected Array, got ' + typeof(array));
            }
            return array;
        } catch (err) {
            this._timeout = setTimeout(retryCallback, 10000);
            throw err;
        }
    }

    getResponseHeader(name) {
        return this.responseHeaders.get(name);
    }
};
