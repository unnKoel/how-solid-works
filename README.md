# How solid works

Explore how solid works behind the scenes.

## Destructure

- Reactivity

  - ✅ createSignal
  - ✅ createEffect
  - ✅ createMemo
  - ✅ untrack
  - ✅ root
  - ✅ onCleanup
  - batch

- Rendering
  - ✅ createComponent
  - ✅ dynamicPropery(convert the access of prop from invoking to the way of property access).
  - ✅ insert (link child nodes to parent node)
  - ✅ assign (static attributes)

## Q&A

- What can we do to avoid the component being invoked in reaction?

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

  Reference to `Reactive Isolation` section of this blog [SolidJS: Reactivity to Rendering](https://angularindepth.com/posts/1289/solidjs-reactivity-to-rendering)

- Why do we need a root function in reactive system?

  The observer pattern as used by these reactive libraries has the potential to produce memory leak. computations that subscribe to signals that out live them are never released as long as the signal is still in use.

  This also has the downside of keeping old Dom references in closures when it comes to Dom side effects.

  What we need to do is to collect all effect references in global scope and try to invoke those cleanups of all effects in the right time to avoid memory leak and keepking old Dom references in closures.

  Refer to the [implementation of root](https://github.com/ryansolid/mobx-jsx/blob/master/src/lib.ts#L38) in mobx-jsx and the downside of observer pattern, Reactive Roots section in this blog [SolidJS: Reactivity to Rendering](https://stackoverflow.com/questions/20156453/how-to-detect-element-being-added-removed-from-dom-element), as well as [render implementation](<(https://github.com/ryansolid/dom-expressions/blob/main/packages/dom-expressions/src/client.js#L48)>) in dom-expression.

- If effect has dependencies on outside of effect, how can we clean those reference up?

  `cleanup` disposal way should be involved which is used to do something cleanning up like invoking `removeEventListener` to unbind an event to avoid memory leak, ect. more detail reason as [cleaning up stale side effects](https://github.com/adamhaile/S?tab=readme-ov-file#cleaning-up-stale-side-effects)

  This `cleanup` function will run before each effect start to run, but after rendering, check out this [example](https://playground.solidjs.com/anonymous/8ecb4064-5d3d-4345-b031-38008da113b3) which proves the running order among `rendering`, `cleanup` and `effect`.

  Its implementation seems to be like that `cleanup` function links to the responding `effect` which gets out of execution context(which is really a stack behind) when `cleanup` is running. At the stage of clean before executing effect, check if current-runing effect has a cleanup function. if it is, then execute cleanup function to clean outside dependencies. The execution of `effect` should be set a parameter called `isChange` which expresses if effect runs due to signal change. `cleanup` only runs under condition of signal change which means update. For initial case, cleanup doesn't need to run.

  The last extramely important thing need to do is how to warrant `effect` runs after dom creation. Behind the scene, the reality is that non-dom-creation `effect` runs after dom-creation `effect`. what we need to do seems to be simply filter dom-creation `effect` out and make them run first in the loop of effect execution. for update phase, it works as be. But, for initial phase, we first put all effects into a array for collection which would run once dom template creation stage complete.

  Another approach about how to warrant `effect` runs after dom creation is making two version of `creactEffect` API, one of them is normal like building effects with signal, another has the same functionality but additional put the whole into an micro task, so that every effect which uses the latter would runs after those using the former.

- If an effect is expensive dom operation that depends on multiple signals. When two signals among changes in the meantime, then the dom operation would run twice, that couldn't be accepted. How to resolve this problem?

- What if condition exists in dom expression?

  In this case, if a part of dom needs to hide when condition is not satisfied, disposal work should be exectuted in each child component. how to find out disposal functions for all of child component, as Solid hasn't component tree to maintain.

  Solid expands surrounding computation, as computation always lives because of linking to Dom in the end. So it seems to create an new concept called ower linking to computation. owers are cascaded like a component tree, but it only serves to maintain the trace of computations to figure out those corresponding disposals.

  Another use is

  > useContext obtains context by walking up the owner tree to find the nearest ancestor providing the desired context. So without an owner you cannot look up any provided context

- Does each render path end at the Dom, so Dom lifecycle determines lifecycles of signals, computations related?

- Why giving up component tree instead of applying owner tree?

  Build owner tree based on reactive execution path and after-execution cleanup path which is from pragmatic perspective of framework at a low level, keeping it agnostic for the upper level is a good design principle. that means a pure reactive system should keep it simple and pure, Don't let concepts or semantic from user penetrate in. By this way, this type of reactive system is independent and better to reuse in more cases.

  Instead, component tree is built depending on the clear UI semantic defined by user.

  Assuming that each signal in one component changes trigger the whole component rerun considering the component as a computation, then this mental mode is what React has done. So reactive mode of React is just the special case of fine-grained reative. 

- How does the context implement?

  Before I suppose that context could be fulfilled using stack, because the top of stack is the place where providers store. That's true, however we have already the owner or component tree. any one of branch of that tree could work as a stack, so it's unnecessary to involve another stack, simply put providers created on each corresponding owner or component node. For betterment, avoiding search up till end of that owner or component tree, using providers from parent node override nodes with same type in the child node is a high performant way, as `useContext` always pick the latest one.

- What do internal functions as `runTop` and `lookUpstream` ready do?

  Reaction happends like propagation from center point(Signal) to computation edges. but if adopting a way like invoking observers on every computation owner, then couldn't ensure the update order which is based on dependencies. There are two types of dependencies, subscription between computation and parent-child computation. So first it has to find out the root computation(marked as stale) which is the start point of this update path depending on dependency trace, and then run it to tirgger the whole update chain. other computations in the update chain that are derived nodes are marked as pending. 

  When running the root computation, it must find out all ancestor computations through parent-child computation dependencies, and then run them from top to bottom invoking order to reevaluate all computations.

  Subscription between computation is created by `createMemo` in general, as below
  ```js
    [a1, setA1] = createSignal(false),
    b1 = createMemo(
      () => {
        a1();
      },
      undefined,
      { equals: false }
    ),
    b2 = createMemo(
      () => {
        b1();
      },
      undefined,
      { equals: false }
    ),
  ```

  Parent-child computation is created by nested invokation of `createMemo` or `createEffect`
  ```js
    createRoot(() => {
      const [s1, set1] = createSignal(1);
      const [s2, set2] = createSignal(2);
      let c1: () => number;
      createEffect(() => {
        const value = s2() + 3
        createMemo(() => {
          c1 = createMemo(() => s1());
          return c1 + value
        }); 
      })  
    });
  ```

- What is trasition? what problem does it solve? how to implement it?

- How about <Suspense\>, lazy, createResource?

  <Suspense\> works upon Context as well as the same with <ErrorBoundary\>. When any async request from outside completes, then get and invoke the function of showing children of `Suspense` component from the nearest owner which is created by `Suspense` component.

  But `Suspense` collects all status of async requests, Only when all of them are resolved, children elements show. One approach is counting the number of pending requests, it decreases as long as they are resolved till that number is zero that's the time of showing children.

  `lazy` return a component function which internally news a signal to get the asnyc component from promise when resolved, then create a derived state using `createMemo` to invoke component passed in props related to get the final root element of component created which is wrapped in a function to be returned in order to make appending that root element of component into parent element is reactive, because it would be wrapped by `createdEffect` automatically in rendering process as it's a function.
  So the whole reactive track path is generated, once component is resolved and set component into signal, this will trigger the subsequential track path, ending with appending that component into DOM tree.

- CatchError and <ErrorBoundary\>
  
  `ErrorBoundary` is a declarative expression to define the way of error handler, however `catchError` is a imperative way. ErrorBoundary is implemented based on the context, where there is a built-in specific context called something like ErrorContext which puts the function of showing error view in the nearest owner that's newly created by `ErrorBoundary`. When any error happends under that owner scope, getting that function from nearest owner and invoke it to show error view.

  What the function of showing error view looks like is that appending elemens associated with error view into the root element to replace children of `ErrorBoundary` component.

  `catchError` offers a imperative way to set error handler into the error context upstream. Use case of it is like that report error to server side. `ErrorBoundary` is generally used to provide a view for error case on client side.

## Reference

- [A Hands-on Introduction to Fine-Grained Reactivity](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf)

- [SolidJS: Reactivity to Rendering](https://angularindepth.com/posts/1289/solidjs-reactivity-to-rendering)

- [How to detect element being added/removed from dom element?](https://stackoverflow.com/questions/20156453/how-to-detect-element-being-added-removed-from-dom-element)

- [mobx-jsx](https://github.com/ryansolid/mobx-jsx/blob/master/src/lib.ts)

- [solid](https://github.com/solidjs/solid)
