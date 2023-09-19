/**
 * @callback processLineCallback
 * @param {string} line
 * @param {number} lineNumber
 */

/**
 * @callback processLineEndCallback
 * @param {number} lineCount
 */


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

    async doGet() {
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
        return response;
    }

    async get() {
        const response = await this.doGet();
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

    /**
     * Process request output line by line
     * @param {processLineCallback} callback - The callback that handles each line
     * @param {processLineEndCallback} endCallback - The callback that is called at the end (even if no line was processed)
     */
    async processLine(callback, endCallback) {
        const utf8Decoder = new TextDecoder("utf-8");
        const response = await this.doGet();
        const reader = response.body.getReader();
        let { value: chunk, done: readerDone } = await reader.read();
        chunk = chunk ? utf8Decoder.decode(chunk, { stream: true }) : "";

        const re = /\r\n|\n|\r/gm;
        let startIndex = 0;
        let linesFound = 0;

        for (;;) {
            const result = re.exec(chunk);
            if (!result) {
                if (readerDone) {
                    break;
                }
                let remainder = chunk.substr(startIndex);
                ({ value: chunk, done: readerDone } = await reader.read());
                chunk = remainder + (chunk ? utf8Decoder.decode(chunk, { stream: true }) : "");
                startIndex = re.lastIndex = 0;
                continue;
            }
            linesFound++;
            await callback(chunk.substring(startIndex, result.index), linesFound);
            startIndex = re.lastIndex;
        }
        if (startIndex < chunk.length) {
            // last line didn't end in a newline char
            linesFound++
            await callback(chunk.substr(startIndex), linesFound);
        }
        await endCallback(linesFound)
    }

    getResponseHeader(name) {
        return this.responseHeaders.get(name);
    }
};
