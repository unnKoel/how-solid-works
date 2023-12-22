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

  What we are able to do is including a new API called untrack to solve this issue mentioned above that's what the `createComponent` API does, inside which, `untrack` is called to wrap component function to make it escape the tracking scope.
