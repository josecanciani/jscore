import { Emitter } from '../proto/emitter.js';
import { Builder, Modifier, ShadowElement } from './element.js';

export let DomNode = class extends Emitter {
    constructor() {
        super();
        this._childrenHWM = 0;
        this._children = {};
        this._cssSheets = [];
    }

    /**
     * @param {Document} document
     */
    _attachChild(document, parentNode, id) {
        this.document = document;
        this._parentNode = parentNode;
        this._childId = id;
    }

    _detachChild(childId) {
        delete this._children[childId];
    }

    _getChildId() {
        return this._childId;
    }

    /**
     *
     * @param {CSSStyleSheet} cssSheet
     */
    addCssSheet(cssSheet) {
        this._cssSheets.push(cssSheet);
        return this;
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
     * @return {Builder}
     */
    createDomNode() {
        throw new Error('notImplemented');
    }

    getDomNode() {
        if (this._domNode instanceof ShadowElement) {
            return this._domNode.getDomNode();
        } else {
            return this._domNode;
        }
    }

    /**
     * @returns {Node[]} All children nodes
     */
    getAllChildren() {
        let children = [];
        for (let childId in this._children) {
            children.push(this._children[childId]);
        }
        return children;
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
     * Render element after another, aka parent.insertBefore()
     * @param {Node} parent
     * @param {...DomNode} children
     */
    append(parent, ...children) {
        this._appendChildren(parent, null, ...children);
    }

    /**
     * Render element after another, aka parent.insertBefore()
     * @param {Node} parent
     * @param  {...DomNode} childs
     */
    appendBefore(parent, beforeChild, ...children) {
        this._appendChildren(parent, beforeChild, ...children);
    }

    /**
     * Use this method to append childs before the node is added to the DOM
     */
    beforeRender() {
    }

    /**
     * Use this method to do things after the element added to the DOM
     */
    afterRender() {
        this._children.forEach((child) => child.afterRender());
    }

    uninit() {
        super.uninit();
        this._children.forEach((child) => child.uninit());
        if (this._domNode) {
            this._parent.removeChild(this._domNode);
        }
        this._parentNode._detachChild(this._getChildId());
        delete this._children;
        delete this._domNode;
        delete this._parent;
        delete this._parentNode;

    }

    /**
     * Do not call this directly, use beforeRender/afterRender and append/appendBefore
     * @param {Node} parent
     * @param {Node} beforeChild
     * @param  {...DomNode} children
     */
    _render(parent, beforeChild, ...children) {
        this._parent = parent;
        let domNodeBuilder = this.createDomNode();
        this._cssSheets.forEach((sheet) => domNodeBuilder.addSheet(sheet));
        this._domNode = domNodeBuilder.build();
        this._children = [];
        this._appendChildren(this.getDomNode(), null, ...children);
        this.beforeRender();
        if (beforeChild) {
            this._parent.insertBefore(this._domNode, beforeChild);
        } else {
            this._parent.appendChild(this._domNode);
        }
    }

    _appendChildren(parent, beforeChild, ...children) {
        children.forEach((child) => {
            this._childrenHWM++;
            let childId = String(this._childrenHWM);
            this._children[childId] = child;
            child._attachChild(this.document, this, childId);
            child._render(parent, beforeChild);
        });
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
        this._child = child;
        this._selectorQuery = selectorQuery;
    }

    /**
     * Search dom node using document.querySelector
     * @param {String} path
     * @returns {HTMLElement}
     */
    $query(path) {
        return this._child.querySelector(path);
    }

    /**
     * Shortcut for $($query(path))
     * @param {String} path
     * @returns {Modifier}
     */
    $$(path) {
        return this._child.$$(path);
    }

    /**
     * @param {HTMLElement} parent
     * @param {...DomNode} children
     */
    _render(parent, beforeChild, ...children) {
        let parentDomNode = parent instanceof ShadowElement ? parent.getDomNode() : parent;
        let wrappedParent = parentDomNode.querySelector(this._selectorQuery);
        if (!wrappedParent) {
            throw new Error('parentNotFound: ' + this._selectorQuery);
        }
        this._child._render(wrappedParent, beforeChild, ...children);
    }

    beforeRender() {
        this._child.beforeRender();
    }

    afterRender() {
        this._child.afterRender();
    }

    _attachChild(document, parentNode, childId) {
        this._child._attachChild(document, parentNode, childId);
    }

    _getChildId() {
        return this._child._getChildId();
    }

    uninit() {
        this._child.uninit();
        delete this._child;
    }
};
