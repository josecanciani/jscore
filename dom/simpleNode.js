import { DomNode } from './node.js';

export let SimpleNode = class extends DomNode {
    /**
     * A simple HTMLElement to DomNode wrapper
     * @param {Builder} builder
     */
    constructor(builder) {
        super();
        this.builder = builder;
    }

    createDomNode() {
        return this.builder;
    }
};
