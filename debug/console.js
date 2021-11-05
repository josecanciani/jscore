import { DomNode } from '../dom/node.js';
import { SimpleNode } from '../dom/simpleNode.js';

/**
 * Default Message TTL, meassure in number of new messages before removing it from the view
 */
let DEFAULT_TTL = 100;

let buildSpanNode = (parent, text, child, isError) => {
    return new SimpleNode(parent.el('span').addClass('log').addClass(isError ? 'error' : null).addText(text).addChild(child));
};

let Message = class extends DomNode {
    constructor(id, type, content, ttl) {
        super();
        this.id = id;
        this.type = type;
        this.content = content;
        this.ttl = ttl;
    }

    getTtl() {
        return this.ttl;
    }

    createDomNode() {
        return this.el('div')
            .addClass('message')
            .addClass(this.type)
            .addChild(this.el('span').addClass('number').addText(this.id + ': '))
            .addChild(this.el('span').addClass('text'));
    }

    beforeRender() {
        this.append(this.getDomNode(), this.setChildParent(
            this._messageToDomNode(this.content),
            'span.text'
        ));
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
            return buildSpanNode(this, (message.message || 'Unknown Error') + (parsedExtraData ? ' Exception details: ' + parsedExtraData : ''), null, true);
        }
        if (typeof message === 'object') {
            return buildSpanNode(this, JSON.stringify(message));
        }
        return buildSpanNode(this, String(message));
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
};

export let ErrorType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
};

export let Console = class extends DomNode {
    constructor(sheet) {
        super();
        this.sheet = sheet;
        this.count = 0;
        this.buffer = [];
        this.extraContent = [];
    }

    createDomNode() {
        return this.el('div')
            .addClass('console')
            .addChild(this.el('h1').addText('Console'))
            .addChild(this.extraContent.length ? this.el('div').addClass('extraContent') : null)
            .addChild(this.el('div').addClass('messages'))
            .addSheet(this.sheet);
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.extraContent.map((content) => this.setChildParent(content, 'div.extraContent')));
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

    /**
     *
     * @param {*} message Text, Exception or dom/Node
     * @param {String} type One of ErrorType.*
     * @param {Number} ttl Clean message after this number of new messages arrived (default to DEFAULT_TTL, use 0 for never)
     */
    log(message, type, ttl) {
        this.count++;
        this.buffer.push(new Message(this.count, type || ErrorType.INFO, message, typeof ttl === 'undefined' ? DEFAULT_TTL : ttl));
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
