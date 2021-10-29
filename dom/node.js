import { Emitter } from '../proto/emitter.js';
import { Builder, Modifier, ShadowElement } from './element.js';

let ChildManager = class {
    /**
     * This class has all the logic to deal with the life-cycle of the children of a node
     * @param {DomNode} node
     */
    constructor(node) {
        this._node = node;
        this._childrenHWM = 0;
        this._children = {};
        // _id and _parent will be set when node is attached to a parent
        this._id = null;
        this._parent = null;
    }

    /**
     * This method will create the relation between parent and child node, and assign the document for the child to work with
     * @param {DomNode} child
     */
    attach(child) {
        this._childrenHWM++;
        let childId = String(this._childrenHWM);
        this._children[childId] = child;
        child._childManager._id = childId;
        child._childManager._parent = this._node;
    }

    /**
     * Once a child has been uninit(), it must call to this method to clean it's reference
     * @param {String} childId
     */
    detach(childId) {
        delete this._children[childId];
    }

    /**
     * @returns {DomNode[]} All children nodes
     */
    getAllChildren() {
        let children = [];
        for (let childId in this._children) {
            children.push(this._children[childId]);
        }
        return children;
    }

    uninit() {
        this._children.forEach((child) => child.uninit());
        delete this._children;
        delete this._parent;
    }
};

let DomManager = class {
    /**
     * This class has all the logic to deal with the life-cycle of the children of a node
     * @param {DomNode} node
     */
    constructor(node) {
        this._node = node;
        this._cssSheets = [];
        // _document, _parent and _domNode will be available on render
        this._document = null;
        this._parent = null;
        this._domNode = null;
    }

    /**
     * @param {String} querySelector this will instruct to search the parent dom node in the given tree
     */
    setParentQuerySelector(querySelector) {
        this._parentQuerySelector = querySelector;
    }

    /**
     * @param {CSSStyleSheet} cssSheet
     */
    addCssSheet(cssSheet) {
        this._cssSheets.push(cssSheet);
    }

    /**
     * @param {Document} document
     * @param {HtmlElement} parent
     * @param {HtmlElement} beforeChild
     * @param  {...DomNode} children
     */
    render(document, parent, beforeChild, ...children) {
        this._document = document;
        this._parent = this._resolveParent(parent);
        let builder = this._node.createDomNode();
        this._cssSheets.forEach((sheet) => builder.addSheet(sheet));
        this._domNode = this.build(builder);
        this.appendChildren(this.getDomNode(), null, ...children);
        this._node.beforeRender();
        if (beforeChild) {
            this._parent.insertBefore(this._domNode, beforeChild);
        } else {
            this._parent.appendChild(this._domNode);
        }
        this._node.afterRender();
    }

    /**
     * @param {Builder} builder
     */
    build(builder) {
        return builder.build(this._document);
    }

    appendChildren(parent, beforeChild, ...children) {
        children.forEach((child) => {
            this._node._childManager.attach(child);
            child._domManager.render(this._document, parent, beforeChild);
        });
    }

    /**
     * @returns {HTMLElement}
     */
    getDomNode() {
        if (this._domNode instanceof ShadowElement) {
            return this._domNode.getDomNode();
        } else {
            return this._domNode;
        }
    }

    /**
     * @param {HTMLElement} parent
     */
    _resolveParent(parent) {
        if (!this._parentQuerySelector) {
            return parent;
        }
        let parentDomNode = parent instanceof ShadowElement ? parent.getDomNode() : parent;
        let wrappedParent = parentDomNode.querySelector(this._parentQuerySelector);
        if (!wrappedParent) {
            throw new Error('parentNotFound: ' + this._parentQuerySelector);
        }
        return wrappedParent;
    }

    uninit() {
        if (this._parent) {
            this._parent.removeChild(this._domNode);
        }
        delete this._parent;
        delete this._document;
        delete this._domNode;
        delete this._node;
    }
};

export let DomNode = class extends Emitter {
    constructor() {
        super();
        this._childManager = new ChildManager(this);
        this._domManager = new DomManager(this);
    }

    /**
     * Implement this method to create the basic dom node using this.el() method
     * @return {Builder}
     */
    createDomNode() {
        throw new Error('notImplemented');
    }

    /**
     * Use this method to append childs before the node is added to the DOM
     * You can use this.append(this.getDomNode(), ...children)
     */
    beforeRender() {
    }

    /**
     * Use this method to do things after the element added to the DOM
     */
    afterRender() {
        // this is here and not in _domManager so that dev can choose whether to call children's afterRender before or after this node
        this._childManager.getAllChildren().forEach((child) => child.afterRender());
    }

    /**
     * Once this node starts rendering, use this method to get the parent dom node (can be used beforeRender() too)
     * Don't access _domNode directly, as you may end with a shadow element instead
     * @returns {HTMLElement}
     */
    getDomNode() {
        return this._domManager.getDomNode();
    }

    /**
     * @returns {DomNode[]} All children nodes
     */
    getAllChildren() {
        return this._childManager.getAllChildren();
    }

    /**
     * @param {CSSStyleSheet} cssSheet
     * @returns {DomNode} chainable
     */
    addCssSheet(cssSheet) {
        this._domManager.addCssSheet(cssSheet);
        return this;
    }

    /**
     * A handy HTMLElement builder
     * @param {String} type html element type (div, span, etc)
     * @param {CSSStyleSheet} sheet a css style sheet to apply to this node
     * @returns {Builder}
     */
    el(type) {
        return new Builder(type);
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
     * This method allows you to define a different parent html element for a child node
     * @param {DomNode} child
     * @param {String} selectorQuery
     * @returns {DomNode} child chainable
     */
    setChildParent(child, selectorQuery) {
        child._domManager.setParentQuerySelector(selectorQuery);
        return child;
    }

    /**
     * Render element after another, aka parent.insertBefore()
     * @param {Node} parent
     * @param {...DomNode} children
     */
    append(parent, ...children) {
        this._domManager.appendChildren(parent, null, ...children);
    }

    /**
     * Render element after another, aka parent.insertBefore()
     * @param {Node} parent
     * @param  {...DomNode} childs
     */
    appendBefore(parent, beforeChild, ...children) {
        this._domManager.appendChildren(parent, beforeChild, ...children);
    }

    uninit() {
        super.uninit();
        this._childManager.uninit();
        this._domManager.uninit();
        delete this._childManager;
        delete this._domManager;
    }
};
