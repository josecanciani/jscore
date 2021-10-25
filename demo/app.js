import { DomApp } from 'https://cdn.jsdelivr.net/gh/josecanciani/jscore@v0.0.1-alpha/dom/app.js';
import { Grid, Row, Column, Content } from 'https://cdn.jsdelivr.net/gh/josecanciani/jscore@v0.0.1-alpha/layout/grid.js';
import { SimpleNode } from 'https://cdn.jsdelivr.net/gh/josecanciani/jscore@v0.0.1-alpha/dom/simpleNode.js';
import { ErrorType } from 'https://cdn.jsdelivr.net/gh/josecanciani/jscore@v0.0.1-alpha/debug/console.js';
import sheet from './app.css' assert { type: 'css' };

export let App = class extends DomApp {
    /**
     * This is a demo application for josecanciani/jscore module. Arguments of the constructor are here for dependency injection
     * @param {Document} doc
     * @param {Node} parent
     * @param {String} cssClass
     * @param {LocalStorage} storage
     */
    constructor(doc, parent, cssClass, storage) {
        super(doc || document, parent || document.body, cssClass || 'jscoreDemo', storage || window.localStorage);
        this.console.addExtraContent(
            new SimpleNode(
                this.el('span')
                .addText('This is a sample console, you can put extra elements here, like this text.')
                .build()
            )
        );
    }

    createDomNode() {
        return this.el('div')
            .addClass(this.className)
            .addSheet(sheet)
            .build();
    }

    render() {
        super.render(
            // The console object lifecycle is managed by the parent class
            this.console,
            (new Grid()).addRows(
                (new Row()).addColumns(
                    new Content(new SimpleNode(this.el('h1').addText('JSCore demo').build()))
                ),
                (new Row()).addColumns(
                    new Content(
                        new SimpleNode(this.el('p').addText(`
                            In this demo you can find the builtin console to the left, and a simple Grid system bellow.
                        `).build())
                    )
                ),
                (new Row()).addColumns(
                    new Content(new SimpleNode(this.el('span').addText('This is a left column').build())),
                    (new Column()).addRows(
                        (new Row()).addColumns(
                            new Content(new SimpleNode(this.el('span').addText('This is the first row from a second column').build()))
                        ),
                        (new Row()).addColumns(
                            new Content(new SimpleNode(this.el('span').addText('This is a second row from a second column').build()))
                        )
                    )
                )
            )
        );
    }

    afterRender() {
        super.afterRender();
        this.console.log('This is a warning message', ErrorType.WARNING);
        this.console.log('This is an error message', ErrorType.ERROR);
    }
};
