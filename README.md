# jscore

A collection of js modules to build dynamic dom based apps.

# Objectives

* Use latest standards at expense of browser support
* Provide basic framework-like functionality to build apps
* Manage object life-cycle automatically

# Inspiration

Some of the concepts are re-interpretations using new standards of [Avature](https://wwww.avature.net) Main App javascript framework. Avature's framework was built at the beginning of Web 2.0, and there were not many alternatives around.

# Features and Usage

Any app must extend from `dom/app.js`'s DomApp class. A DomApp is a special type of DomNode that has the `render()` method to draw itself.

A DomNode is the object representation of a group of DOM elements, encapsulating it's behaviour. Each visible DOM element you want to show must be created extending from DomNode.

The DomNode consists of a DOMElement tree plus -optionally- a set of other DomNode children. Each children is added and references are kept internally for removing dependencies and allowing for proper garbage collection.

DomNodes inclues a set of handful methods for buliding the DOMElement tree and append it's children. Here's a very basic application (remember a DomApp is a DomNode too) that renders a simple h1 header:

```javascript:demo/readme/demo1.js
import { DomApp } from '../../dom/app.js';

export let App = class extends DomApp {
    createDomNode() {
        return super.createDomNode().addChild(
            this.el('h1').addText('This is just a H1 title')
        );
    }
};
```
