import { Emitter } from '../proto/emitter.js';
import { Builder, Modifier, ShadowElement } from './element.js';

const ChildManager = class {
    /**
     * This class has all the logic to deal with the life-cycle of the children of a node
     * @param {Component} component
     */
    constructor(component) {
        this._component = component;
        this._childrenHWM = 0;
        this._children = {};
        // _id and _parent will be set when node is attached to a parent
        this._id = null;
        this._parent = null;
    }

    /**
     * This method will create the relation between parent and child node, and assign the document for the child to work with
     * @param {Component} child
     */
    attach(child) {
        this._childrenHWM++;
        let childId = String(this._childrenHWM);
        this._children[childId] = child;
        child._childManager._id = childId;
        child._childManager._parent = this._component;
    }

    /**
     * Once a child has been uninit(), it must call to this method to clean it's reference
     * @param {String} childId
     */
    detach(childId) {
        delete this._children[childId];
    }

    /**
     * @returns {Component[]} All children nodes
     */
    getAllChildren() {
        let children = [];
        for (let childId in this._children) {
            children.push(this._children[childId]);
        }
        return children;
    }

    reset() {
        this.getAllChildren().forEach((child) => child.uninit());
        this._children = {};
    }

    uninit() {
        this.reset();
        delete this._children;
        delete this._parent;
    }
};

const DomManager = class {
    /**
     * This class has all the logic to deal with the life-cycle of the children of a node
     * @param {Component} component
     */
    constructor(component) {
        this._component = component;
        this._cssSheets = [];
        // _document, _parent and _domNode will be available on render
        this._document = null;
        this._parent = null;
        this._domNode = null;
    }

    /**
     * @param {CSSStyleSheet} cssSheet
     */
    addCssSheet(cssSheet) {
        if (this._domNode) {
            throw new Error('cannotAddCssSheetToAlreadyRenderedElement');
        }
        this._cssSheets.push(cssSheet);
    }

    /**
     * @param {Document} document
     * @param {HtmlElement} parent
     * @param {HtmlElement} beforeChild
     * @param {...DomNode} children
     */
    render(document, parent, beforeChild, ...children) {
        this._document = document;
        this._parent = parent;
        let builder = this._component.createDomNode();
        this._cssSheets.forEach((sheet) => builder.addCssSheet(sheet));
        this._domNode = this.build(builder);
        if (!this._domNode) {
            throw new Error('invalid domnode');
        }
        this.appendChildren(this.getDomNode(), null, ...children);
        this._component.beforeRender();
        if (beforeChild) {
            this._parent.insertBefore(this._domNode, beforeChild);
        } else {
            this._parent.appendChild(this._domNode);
        }
        this._component.afterRender();
    }

    isRendered() {
        return !!this._domNode;
    }

    /**
     * @param {Builder} builder
     */
    build(builder) {
        return builder.build(this._document);
    }

    appendChildren(parent, beforeChild, ...children) {
        children.forEach((child) => {
            if (child) {
                if (!(child instanceof Component)) {
                    throw new Error('canOnlyAppendComponents');
                }
                this._component._childManager.attach(child);
                child._domManager.render(this._document, parent, beforeChild);
            }
        });
    }

    /**
     * @returns {HTMLElement}
     */
    getDomNode() {
        if (!this.isRendered()) {
            throw new Error('cannotGetDomNodeBeforeRendering');
        }
        if (this.isShadowElement()) {
            return this._domNode.getDomNode();
        } else {
            return this._domNode;
        }
    }

    /**
     * @returns {Boolean} if the dom node is instace of a ShadowElement
     */
    isShadowElement() {
        return this._domNode instanceof ShadowElement;
    }

    $queryOverShadow(domNode, path) {
        for (const shadow of domNode.querySelectorAll('jscore-shadow')) {
            const match = shadow.shadowRoot.querySelector(path);
            if (match) {
                return match;
            }
            const childMatch = this.$queryOverShadow(shadow.shadowRoot, path);
            if (childMatch) {
                return childMatch;
            }
        }
        return null;
    }

    $queryAllOverShadow(domNode, path) {
        const data = [];
        for (const shadow of domNode.querySelectorAll('jscore-shadow')) {
            data.push(...shadow.shadowRoot.querySelectorAll(path));
            data.push(...this.$queryAllOverShadow(shadow.shadowRoot, path));
        }
        return data;
    }

    uninit() {
        if (this._parent) {
            this._parent.removeChild(this._domNode);
        }
        delete this._parent;
        delete this._document;
        delete this._domNode;
        delete this._component;
    }
};

export const Component = class extends Emitter {
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
        // this is here and not in _domManager so that dev can choose whether to call children's afterRender before or after this component
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
     * @returns {Component[]} All children Components
     */
    getAllChildren() {
        return this._childManager.getAllChildren();
    }

    /**
     * @param {CSSStyleSheet} cssSheet
     * @returns {Component} chainable
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
        if (!this._domManager._document) {
            throw new Error('cannotCreateModifierIfElementHasNotBeenRendered');
        }
        return new Modifier(el, this._domManager._document);
    }

    /**
     * Search dom node using document.querySelector
     * @param {String} path
     * @returns {HTMLElement}
     */
    $query(path) {
        const match = this.getDomNode().querySelector(path);
        if (match) {
            return match;
        }
        return this._domManager.$queryOverShadow(this.getDomNode(), path);
    }

    /**
     * Search dom node using document.querySelector
     * @param {String} path
     * @returns {HTMLElement}[]
     */
    $queryAll(path) {
        const data = Array.from(this.getDomNode().querySelectorAll(path));
        data.push(...this._domManager.$queryAllOverShadow(this.getDomNode(), path));
        return data;
    }

    /**
     * Shortcut for $($query(path))
     * @param {String} path
     * @returns {Modifier}
     */
    $$(path) {
        const selected = this.$query(path);
        if (!selected) {
            throw new Error(`selectorNotFound: ${path}`);
        }
        return this.$(selected);
    }

    /**
     * Shortcut for this.$queryAll(path).map((el) => this.$(el))
     * @param {String} path
     * @returns {Modifier}[]
     */
    $$all(path) {
        return this.$queryAll(path).map((el) => this.$(el));
    }

    /**
     * Render element after another, aka parent.insertBefore()
     * @param {Node} parent
     * @param {...Component} children
     */
    append(parent, ...children) {
        this._domManager.appendChildren(parent, null, ...children);
    }

    /**
     * Render element after another, aka parent.insertBefore()
     * @param {Node} parent
     * @param  {...Component} childs
     */
    appendBefore(parent, beforeChild, ...children) {
        this._domManager.appendChildren(parent, beforeChild, ...children);
    }

    reset() {
        this._childManager.reset();
    }

    uninit() {
        super.uninit();
        this._childManager.uninit();
        this._domManager.uninit();
        delete this._childManager;
        delete this._domManager;
    }
};


export const BaseDomElement = class extends Component {
    constructor() {
        super();
        this._classNamesBuffer = [];
    }

    /** @param {...string} classNames */
    addCssClass(...classNames) {
        if (this._domManager.isRendered()) {
            this.$(this.getDomNode()).addCssClass(...classNames);
        } else {
            for (const className of classNames) {
                const index = this._classNamesBuffer.indexOf(className);
                if (index === -1) {
                    this._classNamesBuffer.push(className);
                }
            }
        }
        return this;
    }

    /** @param {...string} classNames */
    removeCssClass(...classNames) {
        if (this._domManager.isRendered()) {
            this.$(this.getDomNode()).removeCssClass(...classNames);
        } else {
            for (const className of classNames) {
                const index = this._classNamesBuffer.indexOf(className);
                if (index !== -1) {
                    this._classNamesBuffer.splice(index, 1);
                }
            }
        }
        return this;
    }

    removeAllCssClasses() {
        if (this._domManager.isRendered()) {
            this.$(this.getDomNode()).removeAllCssClasses();
        } else {
            this._classNamesBuffer = [];
        }
        return this;
    }

    /** 
     * @param {string} oldClassName
     * @param {string} newClassName
     */
    replaceCssClass(oldClassName, newClassName) {
        this.removeCssClass(oldClassName);
        this.addCssClass(newClassName);
        return this;
    }

    /** 
     * @param {string} className
     * @param {boolean} condition add if true, remove if false
     */
    toogleCssClass(className, condition) {
        if (this._domManager.isRendered()) {
            this.$(this.getDomNode()).toogleCssClass(className, condition);
        } else {
            if (condition) {
                this.addCssClass(className);
            } else {
                this.removeCssClass(className);
            }
        }
        return this;
    }

    beforeRender() {
        if (this._classNamesBuffer) {
            this.$(this.getDomNode()).addCssClass(...this._classNamesBuffer);
            delete this._classNamesBuffer;
        }
    }
};
