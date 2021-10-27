import { Console } from '../debug/console.js';
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
     */
    constructor(document, parent, className, localStorage, customElements, console) {
        super();
        this.document = document || window.document;
        this.localStorage = new LocalStorageWrapper(localStorage || window.localStorage);
        this.customElements = customElements || window.customElements;
        this.customElements.define('jscore-shadow', ShadowElement);
        this.console = console || new Console();
        this._parent = parent || this.document.body;
        this._className = className;
    }

    createDomNode() {
        return this.el('div').addClass(this._className);
    }

    /**
     * Call this method to start your application
     */
    render() {
        super._render(this._parent);
        this.console.log('App has been rendered');
    }
};
