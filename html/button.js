import { BaseDomElement } from '../dom/component.js';

export let Button = class extends BaseDomElement {
    constructor(text) {
        super();
        this.text = text || 'Unlabeled';
    }

    createDomNode() {
        return this.el('button')
            .addText(this.text)
            .listen('click', (event) => {
                event.preventDefault();
                this.dispatchEvent('click');
            });
    }
};
