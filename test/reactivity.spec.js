import { createSignal, createEffect, createMemo } from '../src/reactivity'

test('Signal initialzation and change', () => {
  const [count, setCount] = createSignal(0)

  expect(count()).toBe(0)
  setCount(6)
  expect(count()).toBe(6)
})

test('Reaction created by createEffect', () => {
  const [count, setCount] = createSignal(0)
  const results = []
  createEffect(() => results.push(count()))
  setCount(5)
  setCount(10)
  expect(results).toEqual([0, 5, 10])
})

test('Derivation without memo', () => {
  const [firstName, setFirstName] = createSignal('John')
  const [lastName] = createSignal('Smith')
  const fullName = jest.fn(() => {
    return `${firstName()} ${lastName()}`
  })

  // when signal changes each time, fullName value would recalculate by runing again
  // even though no values change on dependencies. so finally recalulate as four times
  createEffect(() => fullName())
  createEffect(() => fullName())
  setFirstName('Jacob')

  expect(fullName.mock.calls).toHaveLength(4)
})

test('Derivation with memo', () => {
  const [firstName, setFirstName] = createSignal('John')
  const [lastName] = createSignal('Smith')
  const aggregate = jest.fn(() => {
    return `${firstName()} ${lastName()}`
  })

  const fullName = createMemo(aggregate)

  // fullName value wouldn't recalculate again as long as no values change on dependencies.
  // so finally recalulate as two times
  createEffect(() => fullName())
  createEffect(() => fullName())
  setFirstName('Jacob')

  expect(aggregate.mock.calls).toHaveLength(2)
})

test('Dependencies are maintained dynamically when reactive expressions re-run', () => {
  const [firstName] = createSignal('John')
  const [lastName, setLastName] = createSignal('Smith')
  const [showFullName, setShowFullName] = createSignal(true)

  const aggregate = jest.fn(() => {
    if (!showFullName()) return firstName()
    return `${firstName()} ${lastName()}`
  })

  const displayName = createMemo(aggregate)

  createEffect(() => displayName())
  setShowFullName(false)
  setLastName('Legend')
  setShowFullName(true)

  expect(aggregate.mock.results[0].value).toBe('John Smith')
  expect(aggregate.mock.results[1].value).toBe('John')
  expect(aggregate.mock.results[2].value).toBe('John Legend')
})
