# jscore

A collection of Javascript modules to build dynamic DOM-based apps.

## Objectives

* Use latest standards at expense of browser support
* Provide basic framework-like functionality to build apps
* Manage object life-cycle automatically

## Inspiration

Some of the concepts are re-interpretations using new standards of [Avature](https://wwww.avature.net) Main App javascript framework. Avature's framework was built at the beginning of Web 2.0, and there were not many alternatives around.

## Tutorial

Any app must extend from `dom/app.js`'s DomApp class. A DomApp is a special type of DomNode that has the `render()` method to draw itself. This is usually how you kick off your app.

You can include the app and run it on any node, but you will usually use the `body` element as your root node. Check out [demo/readme/demo1.html](demo/readme/demo1.html) for a sample usage (we just include some basic Bootstrap CSS style and import a DomApp to render).

```html
        <script type="module">
            import { App } from './demo1.js';
            (new App()).render();
        </script>
```

### A DomNode

A DomNode is the object representation of a group of DOM elements, encapsulating its behavior.

The DomNode consists of a DOMElement tree plus -optionally- a set of other DomNode children. Each child is added and references are kept internally for removing dependencies later and allowing for proper garbage collection.

DomNodes includes a set of handful methods for building the DOMElement tree and append its children. Here's a very basic application (remember a DomApp is a DomNode too) that renders a simple h1 header.

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

`proto/Emitter.js`'s Emitter is a base class that provides a pub/sub-like functionality for objects. All DomNodes extend from Emitter, so you can listen and dispatch custom events from any of them.

Let's create a new DomNode, containing a button that we can listen to from our app:

```javascript
let Button = class extends DomNode {
    createDomNode() {
        return this.el('button')
            .addText('click me')
            .listen('click', (event) => {
                event.preventDefault();
                this.dispatchEvent('click');
            });
    }
}
```

Notice we are using the Element Builder's `listen` (which translates to a DOMElement `addEventListener`), but we are in turn dispatching a custom 'click event.

Now let's add it to our NodeApp application, and listen for this custom click. We are going to use the `beforeRender()` method to append a new child, and when a click event is received, we will open an alert window.

```javascript
    beforeRender() {
        let button = new Button();
        this.addListener(button, 'click', () => alert('button has been clicked'))
        this.append(this.getDomNode(), button);
    }
```

Test live: [https://codepen.io/josecanciani/pen/abyERVX](https://codepen.io/josecanciani/pen/abyERVX)

#### Parameters

The `dispatchEvent` method accepts an arbitrary number of parameters that will be passed to the callback when called:

```javascript
    this.dispatchEvent('myEvent', par1, par2, ...parN);
    /* ... */
    this.addListener(myObj, 'myEvent', (par1, par2, ...parN) => /* ... */);
```

#### Life cycle

If you add a listener, you should remove it before trying to `uninit` the target object. If you don't do this, an exception will be thrown (but it will not break the flow). This is in place so that the engine can warn you about a possible race condition error.

You can only add one listener type per object (ie: you cannot add two `click` event listeners from the same object to the same target). This will also avoid race condition situations, mandating the developer to properly handle both together.

#### Error handling

When calling `dispatchEvent` the engine will run all registered callbacks and catch any error they may throw. If any error is caught, the return value will be an `EmitterError` error object containing the list of errors.

By default, errors will be thrown later in the event loop, but you can avoid that if you deal with them by calling the `stopPropagation()` method of the returned error object.

### Positioning a child

Having one class per HTMLElement would be a nightmare, so a DomNode can render a tree of elements. Sometimes you want a child to be rendered under a specific node. For this case, we have the handy `setChildParent` method.

In this example we add a table with two cells in our app:

```javascript
    createDomNode() {
        return this.el('table').addChild(
            this.el('tr')
                .addChild(this.el('td').addClass('left').addText('Left column, on the right the custom positioned content: '))
                .addChild(this.el('td').addClass('right'))
        );
     }
```

And now, when appending our child, we will use the `setChildParent` method, which is chainable, so you can just do:

```javascript
    beforeRender() {
        this.append(
            this.getDomNode(),
            this.setChildParent(new Button(), 'td.left')
        );
    }
```

Test live: [https://codepen.io/josecanciani/pen/VwzQYjQ](https://codepen.io/josecanciani/pen/VwzQYjQ)

### Children life cycle: add and remove

We already saw how to append a child, but there's another method called `appendBefore` that follows the native `insertBefore` method and allows to add an element before another.

Both methods supports multiple child in the parameter, you can just add several in one command: `this.append(this.getDomNode(), child1, child2, ..., childN)`.

You may also notice that the append methods receive a DomElement, which will usually be the main dom element of our object (the one created by the `createDomNode` method). You can specify any other element (see Element Selector), but usually, you will use the `setChildParent` method to specify it.

Removing a child is as simple as calling it's `uninit` method. Let's modify our app to "toogle" our button between the two table cells:

```javascript
    beforeRender() {
        this._toogleButton('td.left', 'td.right');
    }

    _toogleButton(from, to) {
        this._uninitPreviousButton();
        this.button = new Button();
        this.addListener(this.button, 'click', () => this._toogleButton(to, from));
        this.append(this.getDomNode(), this.setChildParent(this.button, from));
    }

    _uninitPreviousButton() {
        if (this.button) {
            this.removeListener(this.button, 'click');
            this.button.uninit();
        }
    }

    uninit() {
        this._uninitPreviousButton();
        super.uninit();
    }
```

Test Live: [https://codepen.io/josecanciani/pen/mdMpzJb](https://codepen.io/josecanciani/pen/mdMpzJb)

As you can see, every time the user clicks the button, we are removing it from the DOM by just calling it's `uninit` method. The engine will take care of checking dependencies (that's why we have to remove the listener first). Then we just create a new one, this time within the other table cell.

### beforeRender vs afterRender

When rendering a node, there are two opportunities to add children nodes: `beforeRender` and `afterRender`.

The difference lies in at what point the dom elements are inserted into the parent nodes. When using `beforeRender`, the nodes are added to the the object's element tree at a point when this tree is still NOT in the browser's DOM. `afterRender`, in contrast, is executed once the element tree has been added to the browser's DOM.

You will almost always use `beforeRender` so that all the tree is added at once, which should be faster and won't produce browser hiccups.

But there is a situation when you do need the element inside the DOM, like when using an external Chart library that depends on a container to be already rendered in the browser.

### Element Builder: `this.el()`

The `el()` method of a `DomNode` object returns a `Builder` (`dom/element.js`) object that can be used to create new dom elements.

Most attributes can be set with the `attr` method, as we want to keep browser implementation as much as possible.

You can create a shadow element using the `addSheet` method, but this is only recommended for the parent node in a `DomNode` tree (see Styling with Shadow Elements bellow).

You can add HTML but it's not recommended, instead keep using new Builders to create your tree, appending with the `addChild` method.

The `addText` method allows inserting a Text Node as a child.

The `listen` method will add dom listeners using the browser's `addEventListener`.


### Element Modifier: `this.$()`

The `this.$()` method takes an HTMLElement and returns a Modifier object that allows you to manipulate it. Use this instead of using Browser's specific ways.

It has similar functions as the `Builder` object but is focused on already rendered objects.

Most handy methods are `enable()` and `hide()`. Again, anything that can be achieved with the built-in `setAttribute` method should use `attr()`, but for others that require some tweaks (like `hide()`), we implement a custom method.

### Element Selector: `this.$query()` & `this.$$()`

`this.$query(path)` will run the builtin `querySelector` method over the main DOM element (the one created with `createDomNode()`). This is useful to get rendered elements to work within your class.

The `$$` method is a shortcut to `this.$(this.$query(path))`.


### CSS Modules (over Shadow Elements): `addSheet()`

The engine supports both Constructible StyleSheets and legacy style HTMLElements for backward compatibility.

When you `addSheet` using the `Builder`, a Shadow Element will be created automatically, and the style will be appended to it.

#### Modern version

```javascript
import sheet from './myModule.css' assert { type: 'css' };

class MyDomNode extends DomNode {
    createDomNode() {
        return this.el('div').addSheet(sheet);
    }
}
```

#### Legacy version

You can also use a style element instead, to support browsers that do not implement it:

```javascript
let style = document.createElement('style');
```

We provide the tool `tools/cssToJavascriptStyle.js` that converts a CSS file into a .css.js file that will export a sheet using this method.

You can view `demo/index.legacy.html` to view a working example.


### The console

The engine provides a very rudimentary console object (`debug/console.js`), a DomNode that can be included in your page. By default, the DomApp will use the browser's `console.log`, but you can override it.

See the `demo/index.html` for sample usage.
