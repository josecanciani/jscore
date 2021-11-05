import { DomApp } from '../dom/app.js';
import { Row, Column, Content } from '../layout/grid.js';
import { SimpleNode } from '../dom/simpleNode.js';
import { ErrorType } from '../debug/console.js';

export let App = class extends DomApp {
    /**
     * This is a demo application for josecanciani/jscore module. Arguments of the constructor are here for dependency injection
     * @param {Document} doc
     * @param {Node} parent
     * @param {String} cssClass
     * @param {LocalStorage} storage
     */
    constructor(sheet, console, grid) {
        super(null, null, 'jscoreDemo', null, null, console, sheet);
        this.grid = grid;
        this.getConsole().addExtraContent(
            new SimpleNode(
                this.el('span')
                .addText('This is a sample console, you can put extra elements here, like this text.')
            )
        );
    }

    beforeRender() {
        this.append(
            this.getDomNode(),
            // The console object lifecycle is managed by the parent class
            this.getConsole(),
            this.grid.addRows(
                (new Row()).addColumns(
                    new Content(new SimpleNode(this.el('h1').addText('JSCore demo')))
                ),
                (new Row()).addColumns(
                    new Content(
                        new SimpleNode(this.el('p').addText(`
                            In this demo you can find the builtin console to the left, and a simple Grid system bellow.
                        `))
                    )
                ),
                (new Row()).addColumns(
                    new Content(new SimpleNode(this.el('span').addText('This is a left column'))),
                    (new Column()).addRows(
                        (new Row()).addColumns(
                            new Content(new SimpleNode(this.el('span').addText('This is the first row from a second column')))
                        ),
                        (new Row()).addColumns(
                            new Content(new SimpleNode(this.el('span').addText('This is a second row from a second column')))
                        )
                    )
                )
            )
        );
    }

    afterRender() {
        super.afterRender();
        this.getConsole().log('This is a warning message', ErrorType.WARNING);
        this.getConsole().log('This is an error message', ErrorType.ERROR);
    }
};
