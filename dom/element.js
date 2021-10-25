export let ShadowElement = class extends HTMLElement {
    /**
     *
     * @param {DomElement}
     * @param {*} sheets
     */
    constructor(element, sheets) {
        super();
        let shadow = this.attachShadow({mode: 'open'});
        shadow.adoptedStyleSheets = sheets || [];
        this.domNode = element;
        shadow.appendChild(element);
    }

    /**
     * @returns {DomElement}
     */
    getDomNode() {
        return this.domNode;
    }

    /**
     * @param {Node} child
     */
    appendChild(child) {
        this.getDomNode().appendChild(child);
    }

    /**
     * @param {Node} node
     * @param {Node} child
     */
    insertBefore(node, child) {
        this.getDomNode().insertBefore(node, child);
    }
};

export let Builder = class {
    /**
     * A simple builder for DOM elements. Should be available to any {DomNode} class using el() method
     * @param {Document} document
     * @param {String} type a dom type (like "div")
     * @param {CSSStyleSheet} sheet a css style sheet to apply to this node
     */
    constructor(document, type) {
        this.document = document;
        this.type = type;
        this.className = [];
        this.childs = [];
        this.innerHtml = '';
        this.attributes = [];
        this.eventListeners = [];
        this.sheets = [];
    }

    /**
     * @param {String} className CSS class name for this element
     * @returns {Builder}
     */
    addClass(className) {
        if (className && className.length) {
            this.className.push(className);
        }
        return this;
    }

    /**
     * Add a child element to this one
     * @param {HTMLElement} element Can be null for more stylish code when using
     * @returns {Builder}
     */
    addChild(element, first) {
        if (element) {
            if (first) {
                this.childs.unshift(element);
            } else {
                this.childs.push(element);
            }
        }
        return this;
    }

    /**
     * Add a Text Node inside this element
     * @param {String} text
     * @returns {Builder}
     */
    addText(text, first) {
        if (text) {
            if (first) {
                this.childs.unshift(this.document.createTextNode(text));
            } else {
                this.childs.push(this.document.createTextNode(text));
            }
        }
        return this;
    }

    /**
     * Add a Constructed StyleSheets, will be added as an adoptedStyleSheet using a shadow
     * @param {CSSStyleSheet} sheet
     * @returns {Builder}
     */
    addSheet(sheet) {
        if (sheet) {
            this.sheets.push(sheet);
        }
        return this;
    }

    /**
     * Add an attribute to this dom element
     * @param {String} name
     * @param {*} value
     * @returns {Builder}
     */
    attr(name, value) {
        this.attributes.push({
            name: name,
            value: value
        });
        return this;
    }

    /**
     * Add HTML formatted text to this element
     * @param {String} html
     * @returns
     */
    html(html, first) {
        if (first) {
            this.innerHtml = html + this.innerHtml;
        } else {
            this.innerHtml += html;
        }
        return this;
    }

    /**
     * Add a dom event listener on this element
     * @param {String} name
     * @param {function} callback
     * @returns {Builder}
     */
    listen(name, callback) {
        this.eventListeners.push({
            name: name,
            callback: callback
        });
        return this;
    }

    /**
     * Set a value (usually for form elements) to this element
     * @param {*} value
     * @returns {Builder}
     */
    value(value) {
        this.value = value;
        return this;
    }

    /**
     * @returns {HTMLElement}
     */
    build() {
        const el = this.document.createElement(this.type);
        this.className.forEach((className) => el.classList.add(className));
        if (this.childs.length && this.innerHtml.length) {
            throw new Error('cannotAddHtmlAndChildsElementsAtTheSameTime');
        }
        this.childs.forEach((child) => el.appendChild(child instanceof Builder ? child.build() : child));
        if (this.innerHtml.length) {
            el.innerHTML = this.innerHtml;
        }
        this.attributes.forEach((attr) => el.setAttribute(attr.name, attr.value));
        this.eventListeners.forEach((event) => el.addEventListener(event.name, event.callback));
        if (typeof this.value !== 'undefined') {
            el.value = this.value;
        }
        if (this.sheets.length) {
            return new ShadowElement(el, this.sheets);
        }
        return el;
    }
};

export let Modifier = class {
    /**
     * A helper class to perform common actions on html elements
     * @param {HTMLElement} el
     */
    constructor(el) {
        this.el = el;
    }

    /**
     * @param {String} name Attribute name to set
     * @param {*} value the value to set
     * @returns {Modifier}
     */
    attr(name, value) {
        this.el.setAttribute(name, value);
        return this;
    }

    /**
     * @param {*} value the new value to set
     * @returns {Modifier}
     */
    value(value) {
        this.el.value = value;
        return this;
    }

    /**
     * @param {Boolean} hide whether to hide or unhide the element
     * @returns {Modifier}
     */
    hide(hide) {
        if (hide) {
            this.el.setAttribute('hidden', true);
        } else {
            this.el.removeAttribute('hidden');
        }
        return this;
    }

    /**
     * @param {Boolean} hide whether to enable or disable the element
     * @returns {Modifier}
     */
    enable(enable) {
        this.el.disabled = !enable;
        return this;
    }

    /**
     * In case you need to return after chaining
     * @returns {HTMLElement} the elemennt that's being modified
     */
    el() {
        return this.el;
    }
};
