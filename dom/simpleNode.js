import { Component } from './component.js';
import { Builder } from './element.js';

export let SimpleNode = class extends Component {
    /**
     * A simple HTMLElement to Component wrapper
     * @param {Builder} builder
     */
    constructor(builder) {
        super();
        this.builder = builder;
    }

    /**
     * @returns {Builder}
     */
    createDomNode() {
        return this.builder;
    }
};
