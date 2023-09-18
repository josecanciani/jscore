import { Component, BaseDomElement } from '../dom/component.js';

const TableCell = class extends BaseDomElement {
    /** @param {Builder} content */
    constructor(content) {
        super();
        this.content = content;
    }

    createDomNode() {
        return this.el('td');
    }

    beforeRender() {
        super.beforeRender();
        this.append(this.getDomNode(), this.content);
    }
}

const TableHeader = class extends TableCell {
    createDomNode() {
        return this.el('th');
    }
}

const TableRow = class extends BaseDomElement {
    /** @param {TableCell} content */
    constructor(...cells) {
        super();
        this.cells = cells;
    }

    createDomNode() {
        return this.el('tr');
    }

    beforeRender() {
        super.beforeRender();
        this.append(
            this.getDomNode(),
            ...this.cells
        );
    }
}

export let Table = class extends BaseDomElement {
    constructor(headers, rows) {
        super();
        this.headers = headers;
        this.rows = rows;
    }

    createDomNode() {
        return this.el('table');
    }

    beforeRender() {
        super.beforeRender();
        this.append(
            this.getDomNode(),
            new TableRow(...this.headers.map((content) => new TableHeader(content))),
            ...this.rows.map((cells) => new TableRow(...cells.map((cell) => new TableCell(cell))))
        );
    }
};
