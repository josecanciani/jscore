import { DomNode } from '../dom/node.js';
import sheet from 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap-grid.min.css' assert { type: 'css' };

export let Grid = class extends DomNode {
    /**
     * A Bootstrap Grid wrapper https://getbootstrap.com/docs/4.0/layout/grid/
     * @param {String} className Bootstrap classname
     */
    constructor(className) {
        super();
        this.rows = [];
        this.className = className || 'container-fluid';
    }

    createDomNode() {
        return this.el('div')
            .addSheet(sheet)
            .addClass(this.className)
            .build();
    }

    /**
     * @param  {...Row} rows
     * @returns {this}
     */
    addRows(...rows) {
        this.rows = rows;
        return this;
    }

    /**
     * @param {Node} parent
     */
    render(parent) {
        super.render(parent, ...this.rows);
    }
};

export let Row = class extends DomNode {
    /**
     * @param {String} className Bootstrap classname
     */
    constructor(className) {
        super();
        this.columns = [];
        this.className = className || 'row';
    }

    /**
     *
     * @param  {...Column} columns
     * @returns {this}
     */
    addColumns(...columns) {
        this.columns = columns;
        return this;
    }

    createDomNode() {
        return this.el('div').addClass(this.className).build();
    }

    /**
     * @param {Node} parent
     */
    render(parent) {
        super.render(parent, ...this.columns);
    }
};

export let Column = class extends DomNode {
    /**
     * @param {String} className Bootstrap class name
     */
    constructor(className) {
        super();
        this.rows = [];
        this.className = className || 'col-md-auto';
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
        return this.el('div').addClass(this.className).build();
    }

    /**
     * @param {Row} parent
     */
    render(parent) {
        super.render(parent, ...this.rows);
    }
};

export let Content = class extends DomNode {
    /**
     * @param {NodeNde} child
     * @param {String} className Bootstrap class name
     */
    constructor(child, className) {
        super();
        this.child = child;
        this.className = className || 'col-md-auto';
    }

    createDomNode() {
        return this.el('div').addClass(this.className).build();
    }

    /**
     * @param {Row} parent
     */
    render(parent) {
        super.render(parent, this.child);
    }
};
