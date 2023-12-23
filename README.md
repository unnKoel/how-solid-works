# How solid works

Explore how solid works behind the scenes.

## Destructure

- Reactivity

  - createSignal
  - createEffect
  - createMemo
  - untrack

- Rendering
  - createComponent
  - dynamicPropery(convert the access of prop from invoking to the way of property access).
  - insert (link child nodes to parent node)
  - assign (static attributes)

## Q&A

- what can we do to avoid the component being invoked in reaction ?

  Component just has the responsibility to wrap one piece of dom creation which would be involved in tracked block sometimes. When reaction conducts, this component function would be invoked that's unnecessary, even that violates the principle of fine-grained tracking tech.

  When this case appears is when component assess signals outside of effects and memos, because it would trigger upstream re-rendering to reinvoke this component. for example

  ```js
  function Greeting(props) {
    const text = document.createTextNode('Hi '),
      el = document.createElement('span')
    el.textContent = props.name
    return [text, el] // A fragment... :)
  }

  const [visible, setVisible] = createSignal(false)
  const [name, setName] = createSignal('Addy')

  const el = document.createElement('div')
  createEffect(() => {
    if (visible()) {
      el.append(...Greeting({ name }))
    } else el.textContent = ''
  })
  ```

  The upstream effect has the dependency of name, so as long as name value has be changed, then this effect would rerun, the Greeting component inside it would also be reinvoked, this badly enlarges the update scope of reaction. What we really need to do is just make el's text content reactive to name.

  How we can solve this problem? create an new reactive scope by putting el's text change logic in it through `createEffect`, then it woudn't trigger upstream re-rendering.

  ```js
  function Greeting(props) {
    const text = document.createTextNode('Hi '),
      el = document.createElement('span')
    createEffect(() => {
      el.textContent = props.name
    })
    return [text, el] // A fragment... :)
  }
  ```

  Essentially for each component, there are two parts, creation and update. what we need to do is to avoid creation part is done once again on every change trigger by state update.

  This issue is handled in different way in different kinds of library as below

  - For virtual dom, it always recreate virtual dom through rerun creation part and diff it to get a real cost here of creating DOM nodes.
  - Library like Svelte, compiling each component into basically 2 functions. A create path and an update path. So on create it runs the initial code. But whenever the reactive system triggers it runs the update path instead.
  - As solid which only comple jsx but not component, what it does is to exclude component recreate dom in update phase.

  What we are able to do is including a new API called untrack to solve this issue mentioned above that's what the `createComponent` API does, inside which, `untrack` is called to wrap component function to make it escape the tracking scope.

## Reference

- [SolidJS: Reactivity to Rendering](https://angularindepth.com/posts/1289/solidjs-reactivity-to-rendering)
