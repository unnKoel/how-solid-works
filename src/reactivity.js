// create fundamental reactivity primitives as createSignal, createEffect, and createMemo
import Stack from './stack'

const context = Stack()

const createSignal = (value) => {
  const subscriptions = new Set()

  const read = () => {
    const running = context.peek()

    if (running) {
      subscriptions.add(running)
      running.dependencies.add(subscriptions)
    }

    return value
  }

  const write = (newValue) => {
    value = newValue
    // If current item in Set changes while it's being used,
    // then cause a problem that the loop recursely execute.
    // so it's essential to clone an new array.
    for (const sub of [...subscriptions]) {
      sub.execute()
    }
  }

  return [read, write]
}

const cleanDependencies = (running) => {
  for (const sub of running.dependencies) {
    sub.delete(running)
  }

  running.dependencies.clear()
}

const createEffect = (func) => {
  const effect = {
    execute: () => {
      cleanDependencies(effect)
      context.push(effect)
      try {
        func()
      } finally {
        context.pop()
      }
    },

    dependencies: new Set(),
  }

  effect.execute() // effect fist run should be scheduled after Dom creation, so don't put it here
}

const createMemo = (func) => {
  const [derivedValue, setDerivedValue] = createSignal()

  createEffect(() => setDerivedValue(func()))

  return derivedValue
}

export { createSignal, createEffect, createMemo }
