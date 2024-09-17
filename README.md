# jscore

A collection of Javascript modules to build single page apps (SSPs).

## Objectives

* Use latest standards (at expense of browser support if needed).
  * This includes `import` modules (both js and css) and the use of Shadow Elements for component style isolation.
* Provide basic framework-like functionality to build apps.
* Manage object life-cycle automatically, when possible.

## Inspiration

Some of the concepts are re-interpretations using new standards of [Avature](https://wwww.avature.net) Main App Javascript framework. Avature's framework was built at the beginning of Web 2.0, and there were not many alternatives around.

## Demo

See a working Demo at https://josecanciani.github.io/jscore/demo/index.html

## Tutorial

### The Application class

Any application must extend the `Application` class (`dom/app.js`). A `Application` is a special type of `Component` that has the `render()` method to draw itself. This is usually how you kick off your app.

You can include your `Application` and run it inside any DOM node, but you will usually use the `body` element as your root node. Check out [demo/index.html](demo/index.html) for a sample usage (we just include some basic Bootstrap CSS style and import a Application to render).

```html
        <script type="module">
            import { App } from './demo1.js';
            (new App()).render();
        </script>
```

### A Component

A `Component` is the base abstraction to build web pages. It's a representation of a group of DOM elements and it encapsulates it's application logic into smaller, easier to handle and extend, parts.

The Component consists of a `DOMElement`` tree plus -optionally- a set of other Component children. When a child Component is added, its references are kept internally for removing dependencies later and allowing for accurate garbage collection.

Components includes a set of handful methods for building the `DOMElement` tree and append its children.

#### `createDomNode()`

The main method for building your Component is the `createDomNode()`, which is used to create the basic DOM tree where your Component will live. It should return an `HTMLElement` (represented by the `Builder` class). More on this later, for now just know that you create HTML elements with the handful `el()` method.

Here's a very basic application (remember an `Application` is a `Component` too) that renders a simple `h1` header:

```javascript
import { Application } from '../../dom/app.js';

export let MyApp = class extends Application {
    createDomNode() {
        return super.createDomNode().addChild(
            this.el('h1').addText('This is just a H1 title')
        );
    }
};
```
Test live: [https://codepen.io/josecanciani/pen/dyzJgWB](https://codepen.io/josecanciani/pen/dyzJgWB)

#### `beforeRender` vs `afterRender`

When rendering a component, there are two opportunities to add children `Component`s: `beforeRender` and `afterRender`.

The difference lies in at what point the components are inserted into their parent DOM Nodes. When using `beforeRender`, the child nodes are added to the the parent's element tree at a point when this tree is **not yet** in the browser's DOM. `afterRender`, in contrast, is executed once the element tree has been added to the browser's DOM.

You will almost always use `beforeRender` so that all the tree appears at once to the user, which should be faster and won't produce browser hiccups. But there will be situations when you do need to run after the parent element is added to the browser DOM: for example using an external Chart library that depends on a container to be already rendered in the browser.

#### `append` and `appendBefore`

To add children to the DOM tree you use the `append` and `appendBefore` methods. They will be added inside your main DOM Element (the one returned in the `createDomNode()` method).

```javascript
    createDomNode() {
        return this.el('table').addChild(
            this.el('tr').addChild(
                this.el('td').addCssClass('left').addText('Left column, on the right the custom positioned content: '))
            .addChild(
                this.el('td').addCssClass('right')
            )
        );
     }
```

And now we use the `beforeRender` to append our child:

```javascript
    beforeRender() {
        this.append(
            this.$query('td.left'),
            new Button()
        );
    }
```

In this case, instead of appending to `this.getDomNode()`, we are positioning the button on the a specific `td` element. You can just store a reference to the `td` element if you prefer, or like this example you can just use the handy `$query()` method to find it.

Test live: [https://codepen.io/josecanciani/pen/VwzQYjQ](https://codepen.io/josecanciani/pen/VwzQYjQ)

### Events: the Emitter class

`Emitter` (from `proto/Emitter.js`) is a base class that provides a pub/sub-like functionality for objects. All `Component`s extend from `Emitter`, so you can listen and dispatch custom events from any of them.

Let's create a new component, containing a button that we can listen to from our app:

```javascript
const Button = class extends Component {
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

Notice we are using the element `Builder` method `listen` (which translates to a DOMElement `addEventListener`) -more on building DOM elements later-. In turn dispatching a custom `click` event.

Now let's add this button in our application. We'll add a listener for this custom `click` event. We are going to use the `beforeRender()` method to append a new `Component` child, and when a click event is received, we will open an alert window.

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

If you add a listener, you should remove it before trying to `uninit` the target object. If you don't do this, an exception will be thrown (but it will not break the flow to reduce the possibility of breaking the app). This is in place so that the framework can warn you about poorly manage object life cycles. If you create an object, you are expected to remove it (not only to avoid references that makes garbage collection impossible, but also so you can trust any uninit code you add is always executed).

You can only add one listener type per object (ie: you cannot add two `click` event listeners from the same object to the same target). This will also avoid race condition situations, mandating the developer to properly handle both together.

#### Error handling

When calling `dispatchEvent` the engine will run all registered callbacks and catch any error they may throw. If any error is caught, the return value will be an `EmitterError` error object containing the list of errors.

By default, errors will be thrown later in the event loop, but you can avoid that if you deal with them by calling the `stopPropagation()` method of the returned error object.

### Children life cycle: add and remove

We already saw how to append a child, but there's another method called `appendBefore` that follows the native `insertBefore` browser method and allows to add an element before another.

Both methods supports multiple children in the parameter, you can just add several in one command: `this.append(this.getDomNode(), child1, child2, ..., childN)`.

Removing a child is as simple as calling it's `uninit` method.

Let's use our previous HTML Table example and this time we will "toogle" our button between the two table cells:

```javascript
    beforeRender() {
        this._toogleButton('td.left', 'td.right');
    }

    _toogleButton(from, to) {
        this._uninitPreviousButton();
        this.button = new Button();
        this.addListener(this.button, 'click', () => this._toogleButton(to, from));
        this.append(from, this.button);
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

As you can see, every time the user clicks the button, we are removing it from the DOM by just calling it's `uninit` method. The engine will take care of checking dependencies (that's why we have to remove the listener first, to avoid an exception). Then we just create a new one, this time within the other table cell (notice how we switch `from` and `to`).

### Element Builder: `this.el()`

The `el()` method of a `Component` object returns a `Builder` (`dom/element.js`) object that can be used to create new dom elements.

Most attributes can be set with the `attr` method, as we want to keep browser implementation as much as possible.

You can create a shadow element using the `addCssSheet` method, but this is only recommended for the parent node in a `Component` tree (see Styling with Shadow Elements bellow).

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


### CSS Modules (over Shadow Elements): `addCssSheet()`

The engine supports Constructible StyleSheets. When you `addCssSheet()` using the `Builder`, a Shadow Element will be created automatically, and the style will be appended to it.

```javascript
import sheet from './myModule.css' with { type: 'css' };

class MyComponent extends Component {
    createDomNode() {
        return this.el('div').addCssSheet(sheet);
    }
}
```

This means the Style will only be available for this specific part of the DOM, which is a great way to encapsulate styles. This is an optional behaviour, but it let's you work on completly independent components. Since the CSS of the parent will not affect a shadowed child, in order to style the child you will need to append your own style sheet to it.

### The console

The engine provides a very rudimentary console object (`debug/console.js`), a Component that can be included in your page. By default, the Application will use the browser's `console.log`, but you can override it.

See the `demo/index.html` for sample usage.
