// create fundamental reactivity primitives as createSignal, createEffect, and createMemo
import Stack from './stack'

const emptyContext = Stack()
let context = Stack()
const effects = new Set()

export const createSignal = (value) => {
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

const cleanup = (running) => {
  if (running.onCleanup) running.onCleanup()

  for (const sub of running.dependencies) {
    sub.delete(running)
  }

  running.dependencies.clear()
}

export const root = (fn) => {
  const ret = untracked(() =>
    fn(function dispose() {
      for (const effect of effects) {
        cleanup(effect)
      }
    })
  )

  return ret
}

export const onCleanup = (func) => {
  const running = context.peek()
  if (running) running.onCleanup = func
}

export const createEffect = (func) => {
  const effect = {
    execute: () => {
      cleanup(effect)
      context.push(effect)
      try {
        func()
      } finally {
        context.pop()
      }
    },

    dependencies: new Set(),
  }

  effects.add(effect)
}

export const createMemo = (func) => {
  const [derivedValue, setDerivedValue] = createSignal()

  createEffect(() => setDerivedValue(func()))

  return derivedValue
}

export const untracked = (fn) => {
  const oldContext = context
  context = emptyContext
  try {
    return fn()
  } finally {
    context = oldContext
  }
}
