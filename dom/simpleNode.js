import { DomNode } from "./node.js";

export let SimpleNode = class extends DomNode {
    /**
     * A simple HTMLElement to DomNode wrapper
     * @param {HTMLElement} el
     */
    constructor(el) {
        super();
        this.el = el;
    }

    createDomNode() {
        return this.el;
    }
}
