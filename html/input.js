import { BaseDomElement } from '../dom/component.js';

export const TextInput = class extends BaseDomElement {
    constructor(name, defaultValue, placeHolder) {
        super();
        this.name = name;
        this.defaultValue = defaultValue || '';
        this.placeHolder = placeHolder || '';
    }

    createDomNode() {
        return this.el('input')
            .attr('type', 'text')
            .attr('name', this.name)
            .value(this.defaultValue)
            .attr('placeholder', this.placeHolder);
    }
};
