import { Component } from '../dom/component.js';
import sheet from 'https://cdn.jsdelivr.net/npm/bootstrap-4-grid@3.4.0/css/grid.min.css' assert { type: 'css' };

/**
 * A Bootstrap Grid wrapper https://getbootstrap.com/docs/4.0/layout/grid/
 * Defaults to className  "container-fluid")
 */
export let Grid = class extends Component {
    /** @param  {...Row} rows */
    constructor(...rows) {
        super();
        this.rows = rows;
    }

    createDomNode() {
        return this.el('div').addCssSheet(sheet).addCssClass('container-fluid');
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.rows);
    }
};

/** This grid assumes the grid.css is already loaded */
export let GlobalGrid = class extends Grid {
    createDomNode() {
        return this.el('div').addCssClass('container-fluid');
    }
}

/**
 * Bootstrap Row, defaults className "row"
 */
export let Row = class extends Component {
    /** @param  {...Column} columns */
    constructor(...columns) {
        super();
        this.columns = columns;
    }

    createDomNode() {
        return this.el('div').addCssClass('row');
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.columns);
    }
};

/** Bootstrap grid Column, cssClass defaults to "col-md-auto" */
export let Column = class extends Component {
    /** @param {...Row} rows */
    constructor(...rows) {
        super();
        this.rows = rows;
    }

    createDomNode() {
        return this.el('div').addCssClass('col-md-auto');
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.rows);
    }
};

/** Bootstrap column modified to insert jscore Components (className default to "col-md-auto") */
export let Content = class extends Component {
    /** @param {...Component} children */
    constructor(...children) {
        super();
        this.children = children;
    }

    createDomNode() {
        return this.el('div').addCssClass('col-md-auto');
    }

    beforeRender() {
        this.append(this.getDomNode(), ...this.children);
    }
};
