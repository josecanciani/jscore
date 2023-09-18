import { BaseDomElement } from '../dom/component.js';

export const Label = class extends BaseDomElement {
    constructor(text) {
        super();
        this.text = text || 'Unlabeled';
    }

    createDomNode() {
        return this.el('label').addText(this.text);
    }
};
