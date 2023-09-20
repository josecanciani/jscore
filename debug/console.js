import { Component } from '../dom/component.js';
import { SimpleNode } from '../dom/simpleNode.js';
import sheet from './console.css' assert { type: 'css' };

/**
 * Default Message TTL, meassure in number of new messages before removing it from the view
 */
const DEFAULT_TTL = 100;

const buildSpanMessageComponent = (parent, text, child, isError) => {
    return new SimpleNode(parent.el('span').addCssClass('log').addCssClass(isError ? 'error' : null).addText(text).addChild(child));
};

export const ErrorType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
};

export const Message = class extends Component {
    /**
     * @param {string|Error|Component} content
     * @param {string} type One of ErrorType.*
     * @param {number} ttl Clean message after this number of new messages arrived (default to DEFAULT_TTL, use 0 for never)
     */
    constructor(content, type, ttl) {
        super();
        this.content = this._toComponent(content);
        this.type = type || (content instanceof Error ? ErrorType.ERROR : ErrorType.INFO);
        this.ttl = typeof ttl === 'undefined' ? DEFAULT_TTL : ttl;
    }

    getTtl() {
        return this.ttl;
    }

    createDomNode() {
        return this.el('div')
            .addCssClass('message')
            .addCssClass(this.type)
            .addChild(this.el('span').addCssClass('number').addText(this.id + ': '))
            .addChild(this.el('span').addCssClass('text'));
    }

    beforeRender() {
        this.append(this.$query('span.text'), this.content);
    }

    /**
     * Converts common elements to a Component to show in the console
     * @returns {Component}
     */
    _toComponent(message) {
        if (message instanceof Component) {
            return message;
        }
        if (message instanceof Error) {
            const extraData = message.extraData || '';
            const parsedExtraData = extraData.toUpperCase().includes('<!DOCTYPE HTML') ? this._htmlToText(extraData) : extraData;
            return buildSpanMessageComponent(this, (message.message || 'Unknown Error') + (parsedExtraData ? ' Exception details: ' + parsedExtraData : ''), null, true);
        }
        if (typeof message === 'object') {
            return buildSpanMessageComponent(this, JSON.stringify(message));
        }
        return buildSpanMessageComponent(this, String(message));
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
        return this._domManager.build(this.el('div').html(body)).innerText;
    }

    /** @private this module only */
    _setId(id) {
        this.id = id;
    }
};

export const Console = class extends Component {
    constructor() {
        super();
        this.sheet = sheet;
        this.count = 0;
        this.buffer = [];
        this.extraContent = [];
    }

    createDomNode() {
        return this.el('div')
            .addCssClass('console')
            .addChild(this.el('h1').addText('Console'))
            .addChild(this.extraContent.length ? this.el('div').addCssClass('extraContent') : null)
            .addChild(this.el('div').addCssClass('messages'))
            .addCssSheet(this.sheet);
    }

    beforeRender() {
        this.append(this.$query('div.extraContent'), ...this.extraContent);
    }

    afterRender() {
        super.afterRender();
        this._appendLogs();
    }

    /**
     * Allow adding custom widgets to this console
     * @param {Component} Component
     */
    addExtraContent(component) {
        this.extraContent.push(component);
    }

    /**
     * Add a Message to the Console
     * @param {string|Message|Error|Component} message
     * @param {string} type One of ErrorType.* (optional if message is Message)
     * @param {number} ttl Clean message after this number of new messages arrived (default to DEFAULT_TTL, use 0 for never)
     */
    log(message, type, ttl) {
        this.count++;
        const logMessage = message instanceof Message ? message : new Message(message, type, ttl);
        logMessage._setId(this.count);
        this.buffer.push();
        if (this.getDomNode() && !this._timeout) {
            this._timeout = setTimeout(() => this._appendLogs(), 100);
        }
    }

    uninit() {
        if (this._timeout) {
            clearTimeout(this._timeout);
            delete this._timeout;
        }
        super.uninit();
    }

    _clean() {
        let messagesToAppend = this.buffer.length;
        let currentMessages = this.getAllChildren().filter((child) => child instanceof Message);
        let totalCount = messagesToAppend + currentMessages.length;
        for (let i = 0; i < currentMessages.length; ++i) {
            let message = currentMessages[i];
            if (message.getTtl() < totalCount) {
                message.uninit();
                totalCount--;
            }
        }
    }

    _appendLogs() {
        delete this._timeout;
        this._clean();
        const container = this.getDomNode().querySelector('div.messages');
        this.buffer.forEach((message) => {
            this.appendBefore(container, container.firstChild, message);
        })
        this.buffer = [];
    }
};
