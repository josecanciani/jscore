import { Emitter } from '../proto/emitter.js';
import { Builder, Modifier, ShadowElement } from './element.js';

export let DomNode = class extends Emitter {
    /**
     * @param {Document} document
     */
    _setDocument(document) {
        this.document = document;
    }

    /**
     * A handy HTMLElement builder
     * @param {String} type html element type (div, span, etc)
     * @param {CSSStyleSheet} sheet a css style sheet to apply to this node
     * @returns {Builder}
     */
    el(type) {
        return new Builder(this.document, type);
    }

    /**
     * A handy HTMLElement wrapper for performing common actions
     * @param {HTMLElement} el
     * @returns {Modifier}
     */
    $(el) {
        return new Modifier(el);
    }

    /**
     * Search dom node using document.querySelector
     * @param {String} path
     * @returns {HTMLElement}
     */
    $query(path) {
        return this.getDomNode().querySelector(path);
    }

    /**
     * Shortcut for $($query(path))
     * @param {String} path
     * @returns {Modifier}
     */
    $$(path) {
        return this.$(this.$query(path));
    }


    /**
     * @return {HTMLElement}
     */
    createDomNode() {
        throw new Error('notImplemented');
    }

    getDomNode() {
        if (this.domNode instanceof ShadowElement) {
            return this.domNode.getDomNode();
        } else {
            return this.domNode;
        }
    }

    /**
     * This method allows you to define a different parent html element for a child node
     * @param {DomNode} child
     * @param {String} selectorQuery
     * @returns
     */
    changeChildPosition(child, selectorQuery) {
        return new ChildPositioner(child, selectorQuery);
    }

    /**
     * Render element under parent dom node, aka parent.appendChild()
     * @param {Node} parent
     * @param  {...DomNode} childs
     */
    render(parent, ...childs) {
        this._doRender(parent, null, ...childs);
    }

    /**
     * Render element after another, aka parent.insertBefore()
     * @param {Node} parent
     * @param  {...DomNode} childs
     */
    renderBefore(beforeChild, parent, ...childs) {
        this._doRender(parent, beforeChild, ...childs);
    }

    /**
     * Do not call this directly, use render* methods instead
     * @param {Node} parent
     * @param {Node} beforeChild
     * @param  {...DomNode} childs
     */
    _doRender(parent, beforeChild, ...childs) {
        this.parent = parent;
        this.domNode = this.createDomNode();
        this.childs = childs;
        this.childs.forEach((child) => {
            child._setDocument(this.document);
            child.render(this.getDomNode());
        });
        if (beforeChild) {
            this.parent.insertBefore(this.domNode, beforeChild);
        } else {
            this.parent.appendChild(this.domNode);
        }
    }

    afterRender() {
        this.childs.forEach((child) => child.afterRender());
    }

    uninit() {
        super.uninit();
        this.childs.forEach((child) => child.uninit());
        this.parent.removeChild(this.domNode);
        delete this.childs;
        delete this.domNode;
        delete this.parent;
    }
};

let ChildPositioner = class extends DomNode {
    /**
     * Wrap a child to select a different html parent element
     * @param {DomNode} child
     * @param {String} selectorQuery
     */
    constructor(child, selectorQuery) {
        super();
        this.child = child;
        this.selectorQuery = selectorQuery;
    }

    /**
     * Search dom node using document.querySelector
     * @param {String} path
     * @returns {HTMLElement}
     */
    $query(path) {
        return this.child.querySelector(path);
    }

    /**
     * Shortcut for $($query(path))
     * @param {String} path
     * @returns {Modifier}
     */
    $$(path) {
        return this.child.$$(path);
    }

    /**
     * @param {HTMLElement} parent
     * @param {...DomNode} childs
     */
    render(parent, ...childs) {
        let parentDomNode = parent instanceof ShadowElement ? parent.getDomNode() : parent;
        let wrappedParent = parentDomNode.querySelector(this.selectorQuery);
        if (!wrappedParent) {
            throw new Error('parentNotFound: ' + this.selectorQuery);
        }
        this.child.render(wrappedParent, ...childs);
    }

    afterRender() {
        this.child.afterRender();
    }

    _setDocument(document) {
        this.child._setDocument(document);
    }

    uninit() {
        this.child.uninit();
        delete this.child;
        super.uninit();
    }
};
