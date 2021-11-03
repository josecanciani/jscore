# jscore

A collection of js modules to build dynamic dom based apps.

## Objectives

* Use latest standards at expense of browser support
* Provide basic framework-like functionality to build apps
* Manage object life-cycle automatically

## Inspiration

Some of the concepts are re-interpretations using new standards of [Avature](https://wwww.avature.net) Main App javascript framework. Avature's framework was built at the beginning of Web 2.0, and there were not many alternatives around.

## Tutorial

Any app must extend from `dom/app.js`'s DomApp class. A DomApp is a special type of DomNode that has the `render()` method to draw itself. This is usually how you kick off your app.

You can include the app and run it on any node, but you will usually use the `body` element as your root node. Check out [demo/readme/demo1.html](demo/readme/demo1.html) for a sample usage (we just include some basic Boootstrap css style and import a DomApp to render).

```html
        <script type="module">
            import { App } from './demo1.js';
            (new App()).render();
        </script>
```

### A DomNode

A DomNode is the object representation of a group of DOM elements, encapsulating it's behaviour.

The DomNode consists of a DOMElement tree plus -optionally- a set of other DomNode children. Each children is added and references are kept internally for removing dependencies later and allowing for proper garbage collection.

DomNodes inclues a set of handful methods for building the DOMElement tree and append it's children. Here's a very basic application (remember a DomApp is a DomNode too) that renders a simple h1 header.

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
Test live: [https://codepen.io/josecanciani/pen/dyzJgWB](https://codepen.io/josecanciani/pen/dyzJgWB)

### Emitter class: custom events

`proto/Emitter.js`'s Emitter is a base class that provides a pub/sub like functionality for objects. All DomNodes extends from Emitter, so you can listen and dispatch custom events from any of them.

Let's create a new DomNode, containing a button that we can listen from our app:

```javascript
let Button = class extends DomNode {
    createDomNode() {
        return this.el('button').addText('click me').listen('click', (event) => this.onClick(event));
    }

    onClick(event) {
        event.preventDefault();
        this.dispatchEvent('click');
    }
}
```

We are dispatching a custom click event everytime this button is pressed. Now let's add it to our NodeApp application, and listen it. We are going to use the `beforeRender()` method to append a new child:

```javascript
    beforeRender() {
        let button = new Button();
        this.addListener(button, 'click', () => alert('button has been clicked'))
        this.append(this.getDomNode(), button);
    }
```

Test live: [https://codepen.io/josecanciani/pen/abyERVX](https://codepen.io/josecanciani/pen/abyERVX)

### Positioning a child

TODO

### Removing a child

TODO

### beforeRender vs afterRender

TODO

### The builtin console

TODO
