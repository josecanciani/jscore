export let ShadowElement = class extends HTMLElement {
    /**
     *
     * @param {DomElement}
     * @param {*} sheets
     */
    constructor(element, sheets) {
        super();
        let shadow = this.attachShadow({mode: 'open'});
        let styleSheets = sheets.filter((sheet) => sheet instanceof CSSStyleSheet);
        if (styleSheets.length) {
            shadow.adoptedStyleSheets = sheets;
        }
        // this is for legacy support, until Constructable StyleSheets are mainstream
        sheets.filter((sheet) => !(sheet instanceof CSSStyleSheet)).forEach((legacySheet) => shadow.appendChild(legacySheet));
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

let TextNode = class {
    constructor(text) {
        this.text = text;
    }

    build(document) {
        return document.createTextNode(this.text);
    }
};

export let Builder = class {
    /**
     * A simple builder for DOM elements. Should be available to any {DomNode} class using el() method
     * @param {Document} document
     * @param {String} type a dom type (like "div")
     * @param {CSSStyleSheet} sheet a css style sheet to apply to this node
     */
    constructor(type) {
        this.type = type;
        this.classNames = [];
        this.childs = [];
        this.innerHtml = '';
        this.attributes = [];
        this.eventListeners = [];
        this.sheets = [];
    }

    /**
     * @param {String[]} classNames CSS class names for this element
     * @returns {Builder}
     */
    addClass(...classNames) {
        classNames.forEach((className) => this.classNames.push(className));
        return this;
    }

    /**
     * Add a child element to this one
     * @param {Builder} builder Can be null for more stylish code when using
     * @returns {Builder}
     */
    addChild(builder, first) {
        if (builder) {
            if (!builder.build) {
                throw new Error('Only builders are allowed');
            }
            if (first) {
                this.childs.unshift(builder);
            } else {
                this.childs.push(builder);
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
                this.childs.unshift(new TextNode(text));
            } else {
                this.childs.push(new TextNode(text));
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
     * @param {Document} document
     * @returns {HTMLElement}
     */
    build(document) {
        const el = document.createElement(this.type);
        this.classNames.forEach((className) => el.classList.add(className));
        if (this.childs.length && this.innerHtml.length) {
            throw new Error('cannotAddHtmlAndChildsElementsAtTheSameTime');
        }
        this.childs.forEach((child) => el.appendChild(child.build(document)));
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
        this.element = el;
    }

    /**
     * @param {String} name Attribute name to set
     * @param {*} value the value to set
     * @returns {Modifier}
     */
    attr(name, value) {
        this.element.setAttribute(name, value);
        return this;
    }

    /**
     * @param {*} value the new value to set
     * @returns {Modifier}
     */
    value(value) {
        this.element.value = value;
        return this;
    }

    /**
     * @param {Boolean} hide whether to hide or unhide the element
     * @returns {Modifier}
     */
    hide(hide) {
        if (hide) {
            this.element.setAttribute('hidden', true);
        } else {
            this.element.removeAttribute('hidden');
        }
        return this;
    }

    /**
     * @param {Boolean} hide whether to enable or disable the element
     * @returns {Modifier}
     */
    enable(enable) {
        this.element.disabled = !enable;
        return this;
    }

    /**
     * In case you need to return after chaining
     * @returns {HTMLElement} the elemennt that's being modified
     */
    el() {
        return this.element;
    }
};
