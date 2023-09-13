import { DomNode } from '../dom/node.js';
import sheet from 'https://cdn.jsdelivr.net/npm/bootstrap-4-grid@3.4.0/css/grid.min.css' assert { type: 'css' };

export let Grid = class extends DomNode {
    /**
     * A Bootstrap Grid wrapper https://getbootstrap.com/docs/4.0/layout/grid/
     * @param {String} mainClass Bootstrap classname (defaults to "container-fluid")
     */
    constructor(cssClassName) {
        super();
        this.rows = [];
        this.className = cssClassName || 'container-fluid';
    }

    createDomNode() {
        return this.el('div')
            .addSheet(sheet)
            .addClass(this.className);
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
