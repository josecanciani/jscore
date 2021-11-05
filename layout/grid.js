import { DomNode } from '../dom/node.js';

export let Grid = class extends DomNode {
    /**
     * A Bootstrap Grid wrapper https://getbootstrap.com/docs/4.0/layout/grid/
     * @param {CSSStyleSheet} Bootstrap style sheet, we are not importing it here to support older browsers
     * @param {String} classNames Bootstrap classname plus your own (default to "container-fluid")
     */
    constructor(sheet, ...classNames) {
        super();
        this.sheet = sheet;
        this.rows = [];
        this.classNames = classNames.length ? classNames : ['container-fluid'];
    }

    createDomNode() {
        return this.el('div')
            .addSheet(this.sheet)
            .addClass(...this.classNames);
    }

    /**
     * @param  {...Row} rows
     * @returns {this}
     */
    addRows(...rows) {
        this.rows = rows;
        return this;
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.rows);
    }
};

export let Row = class extends DomNode {
    /**
     * @param {String} classNames Bootstrap classname plus your own (default to "row")
     */
    constructor(...classNames) {
        super();
        this.columns = [];
        this.classNames = classNames.length ? classNames : ['row'];
    }

    /**
     * @param  {...Column} columns
     * @returns {this}
     */
    addColumns(...columns) {
        this.columns = columns;
        return this;
    }

    createDomNode() {
        return this.el('div').addClass(...this.classNames);
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.columns);
    }
};

export let Column = class extends DomNode {
    /**
     * @param {String} classNames Bootstrap class name and your own (defaults to "col-md-auto")
     */
    constructor(...classNames) {
        super();
        this.rows = [];
        this.classNames = classNames.length ? classNames : ['col-md-auto'];
    }

    /**
     *
     * @param  {...Row} rows
     * @returns {this}
     */
    addRows(...rows) {
        this.rows = rows;
        return this;
    }

    createDomNode() {
        return this.el('div').addClass(...this.classNames);
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.rows);
    }
};

export let Content = class extends DomNode {
    /**
     * @param {NodeNde} child
     * @param {String} classNames Bootstrap class name or your own (default to "col-md-auto")
     */
    constructor(child, ...classNames) {
        super();
        this.child = child;
        this.classNames = classNames.length ? classNames : ['col-md-auto'];
    }

    createDomNode() {
        return this.el('div').addClass(...this.classNames);
    }

    beforeRender() {
        this.append(this.getDomNode(), this.child);
    }
};
