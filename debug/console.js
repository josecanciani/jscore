import { DomNode } from '../dom/node.js';
import { SimpleNode } from '../dom/simpleNode.js';
import sheet from './console.css' assert { type: 'css' };

export let ErrorType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
};

export let Console = class extends DomNode {
    constructor() {
        super();
        this.count = 0;
        this.buffer = [];
        this.logsToClean = [];
        this.extraContent = [];
    }

    createDomNode() {
        return this.el('div')
            .addClass('console')
            .addChild(this.el('h1').addText('Console'))
            .addChild(this.extraContent.length ? this.el('div').addClass('extraContent') : null)
            .addChild(this.el('div').addClass('messages'))
            .addSheet(sheet);
    }

    render(parent) {
        super.render(parent, ...this.extraContent.map((content) => this.changeChildPosition(content, 'div.extraContent')));
    }

    afterRender() {
        super.afterRender();
        this._appendLogs();
    }

    /**
     * Allow adding custom widgets to this console
     * @param {DomNode} node
     */
    addExtraContent(node) {
        this.extraContent.push(node);
    }

    log(message, type) {
        this.count++;
        this.buffer.push({
            id: this.count,
            type: type || ErrorType.INFO,
            content: message
        });
        if (this.buffer.length === 100) {
            const removed = this.buffer.shift();
            if (removed.renderedNode) {
                this.logsToClean.push(removed);
            }
        }
        if (this.getDomNode() && !this._timeout) {
            this._timeout = setTimeout(() => this._appendLogs(), 100);
        }
    }

    uninit() {
        if (this._timeout) {
            clearTimeout(this._timeout);
            delete this._timeout;
        }
        this._clean(true);
        super.uninit();
    }

    _clean(deepClean) {
        const logsToKeep = [];
        this.logsToClean.forEach((log) => {
            if (deepClean || log.type === ErrorType.INFO) {
                log.uninit();
            } else {
                logsToKeep.push(log);
            }
        });
        this.logsToClean = logsToKeep;
    }

    _appendLogs() {
        delete this._timeout;
        this._clean(false);
        const messages = this.getDomNode().querySelector('div.messages');
        for (let i = 0; i < this.buffer.length; ++i) {
            this.messagesInScreen++;
            if (
                (this.lastAppened && (this.buffer[i].id - this.lastAppened) > 1) ||
                (!this.lastAppened && this.buffer[i].id > 1)
            ) {
                const separator = {id: '', content: this.el('span').addText('[ ... ]')};
                this.logsToClean.push(separator);
                this._appendLog(messages, separator);
            }
            this._appendLog(messages, this.buffer[i]);
            this.lastAppened = this.buffer[i].id;
        }
        this.buffer = [];
    }

    /**
     *
     * @param {HTMLElement} messages
     *
     */
    _appendLog(messages, log) {
        log.renderedNode = new SimpleNode(
            this.el('div')
                .addClass('message')
                .addClass(log.type)
                .addChild(this.el('span').addClass('number').addText(log.id + ': '))
                .addChild(this.el('span').addClass('text'))
        );
        log.renderedNode.renderBefore(
            messages.firstChild,
            messages,
            this.changeChildPosition(this._messageToDomNode(log.content), 'span.text')
        );
    }

    /**
     * Converts common elements to a DOM node to show in the console
     * @returns {HTMLElement}
     */
    _messageToDomNode(message) {
        if (message instanceof DomNode) {
            return message;
        }
        if (message instanceof Error) {
            const extraData = message.extraData || '';
            const parsedExtraData = extraData.toUpperCase().includes('<!DOCTYPE HTML') ? this._htmlToText(extraData) : extraData;
            return this._buildSpanNode((message.message || 'Unknown Error') + (parsedExtraData ? ' Exception details: ' + parsedExtraData : ''), null, true);
        }
        if (message instanceof HTMLElement) {
            return this._buildSpanNode(null, message);
        }
        if (typeof message === 'object') {
            return this._buildSpanNode(JSON.stringify(message));
        }
        return this._buildSpanNode(String(message));
    }

    _buildSpanNode(text, child, isError) {
        return new SimpleNode(this.el('span').addClass('log').addClass(isError ? 'error' : null).addText(text).addChild(child));
    }

    /**
     * Simple html to text converter
     * @param {String} html
     * @returns {String} Text version of the html input
     */
    _htmlToText(html) {
        // check if we have a body to parse
        const regex = /(?<=\<body\>).*(?=\<\/body\>)/s;
        let m = regex.exec(html);
        let body = m !== null ? m[0] : html;
        return this.el('div').html(body).build().innerText;
    }
};
