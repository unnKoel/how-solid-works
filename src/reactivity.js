// create fundamental reactivity primitives as createSignal, createEffect, and createMemo
import Stack from './stack'

const emptyContext = Stack()
const cleanups = new Set()
let context = Stack()

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
    const running = context.peek()
    if (running && running.batch) {
      running((batchSubscriptions) => {
        value = newValue
        for (const sub of [...subscriptions]) {
          batchSubscriptions.add(sub)
        }
      })
    } else {
      value = newValue
      // If current item in Set changes while it's being used,
      // then cause a problem that the loop recursely execute.
      // so it's essential to clone an new array.
      runSubscriptions([...subscriptions])
    }
  }

  return [read, write]
}

export const root = (fn) => {
  const ret = untracked(() =>
    fn(function dispose() {
      for (const cleanup of cleanups) {
        cleanup()
      }
    })
  )

  return ret
}

const cleanup = (running) => {
  if (running.onCleanup) running.onCleanup()

  for (const sub of running.dependencies) {
    sub.delete(running)
  }

  running.dependencies.clear()
}

export const onCleanup = (func) => {
  const running = context.peek()
  if (running) running.onCleanup = func
}

export const effect = (func, current) => {
  const effect = {
    execute: () => {
      cleanup(effect)
      context.push(effect)
      try {
        current = func(current)
      } finally {
        context.pop()
      }
    },

    dependencies: new Set(),
  }

  cleanups.add(() => cleanup(effect))
  effect.execute()
}

export const createMemo = (func) => {
  const [derivedValue, setDerivedValue] = createSignal()

  effect(() => setDerivedValue(func()))

  return derivedValue
}

export const untracked = (fn) => {
  let oldContext = context
  context = emptyContext

  try {
    return fn()
  } finally {
    context = oldContext
  }
}

const runSubscriptions = (subscriptions) => {
  for (const sub of subscriptions) {
    sub.execute()
  }
}

export const batch = (fn) => {
  const batchEffect = (((writeSlice) => {
    const batchSubscriptions = (batchEffect.subscriptions = batchEffect.subscriptions ?? new Set())
    const writeSlices = (batchEffect.writeSlices = batch.writeSlices ?? [])

    if (writeSlice) {
      writeSlices.push(writeSlice)
    } else {
      for (const wts of writeSlices) {
        wts(batchSubscriptions)
      }
      runSubscriptions(batchSubscriptions)
    }
  }).batch = true)

  try {
    context.push(batchEffect)
    return fn()
  } finally {
    context.pop()()
  }
}

export const globalConfig = {
  context,
}
