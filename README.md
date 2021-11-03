# jscore

A collection of js modules to build dynamic dom based apps.

# Objectives

* Use latest standards at expense of browser support
* Provide basic framework-like functionality to build apps
* Manage object life-cycle automatically

# Inspiration

Some of the concepts are re-interpretations using new standards of [Avature](https://wwww.avature.net) Main App javascript framework. Avature's framework was built at the beginning of Web 2.0, and there were not many alternatives around.

# Features and Usage

Any app must extend from `dom/app.js`'s DomApp class. A DomApp is a special type of DomNode that has the `render()` method to draw itself. This is usually how you kick off your app.

You can include the app and run it on any node, but you will usually use the `body` element as your root node. Check out [demo/readme/demo1.html](demo/readme/demo1.html) for a sample usage (we just include some basic Boootstrap css style and import a DomApp to render).

```html
        <script type="module">
            import { App } from './demo1.js';
            (new App()).render();
        </script>
```

## A DomNode

A DomNode is the object representation of a group of DOM elements, encapsulating it's behaviour.

The DomNode consists of a DOMElement tree plus -optionally- a set of other DomNode children. Each children is added and references are kept internally for removing dependencies later and allowing for proper garbage collection.

DomNodes inclues a set of handful methods for buliding the DOMElement tree and append it's children. Here's a very basic application (remember a DomApp is a DomNode too) that renders a simple h1 header.

```javascript
import { DomApp } from '../../dom/app.js';

export let App = class extends DomApp {
    createDomNode() {
        return super.createDomNode().addChild(
            this.el('h1').addText('This is just a H1 title')
        );
    }
};
```

## Emitter class: custom events

`proto/Emitter.js`'s Emitter is a base class that provides a pub/sub like functionality for objects. All DomNodes extends from Emitter, so you can listen and dispatch custom events from any of them.
