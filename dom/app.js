import { DomNode } from './node.js';
import { LocalStorageWrapper } from '../db/localStorage.js';
import { ShadowElement } from './element.js';

export let DomApp = class extends DomNode {
    /**
     * Main class to create your javascript application
     * @param {Document} document
     * @param {HTMLElement} parent
     * @param {String} className
     * @param {LocalStorage} localStorage
     * @param {CustomElementRegistry} customElements
     * @param {Console} console The console is not added automatically to the DOM, do that when extending this class if needed
     * @param {CSSStyleSheet} sheet
     */
    constructor(document, parent, className, localStorage, customElements, console, sheet) {
        super();
        this._document = document || window.document;
        this._localStorage = new LocalStorageWrapper(localStorage || window.localStorage);
        this._customElements = customElements || window.customElements;
        this._customElements.define('jscore-shadow', ShadowElement);
        this._console = console || window.console;
        this._parent = parent || this._document.body;
        this._className = className;
        this._sheet = sheet;
    }

    /**
     * @returns {LocalStorage}
     */
    getLocalStorage() {
        return this._localStorage;
    }

    /**
     * @returns {Console}
     */
    getConsole() {
        return this._console;
    }

    createDomNode() {
        return this.el('div').addClass(this._className).addSheet(this._sheet);
    }

    /**
     * Call this method to start your application
     */
    render() {
        this._domManager.render(this._document, this._parent);
        this.getConsole().log('App has been rendered');
    }
};
