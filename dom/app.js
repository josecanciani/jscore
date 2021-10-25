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
        this._setDocument(document || window.document);
        this.parent = parent || this.document.body;
        this.className = className;
        this.localStorage = new LocalStorageWrapper(localStorage || window.localStorage);
        this.customElements = customElements || window.customElements;
        this.customElements.define('jscore-shadow', ShadowElement);
        this.console = console || new Console();
    }

    createDomNode() {
        return this.el('div').addClass(this.className);
    }

    /**
     * The console will not be added by default
     * @param  {...DomNode} childs
     */
    render(...childs) {
        super.render(this.parent, ...childs);
        this.afterRender();
        this.console.log('App has been rendered');
    }
};
