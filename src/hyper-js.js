/** 
 - using hyperscript approach to render that runs from bottom to up.
 - how to identify dynamic expression which should be tracked, 
    all dynamic expression are wrapped in functions without parameters that's 
    used to distinguish with event functions, as each event function has event
    object passed in.
 */
import { createEffect } from './reactivity'

const dynamicProperty = (props, key) => {
  const value = props[key]
  Object.defineProperty(props, key, {
    get: () => value(),
    enumerable: true,
  })

  return props
}

const assign = (element, props) => {
  const keys = Object.getOwnPropertyNames(props)
  for (const key of keys) {
    element.setAttribute(key, props[key])
  }
}

const insert = (parent, child) => {
  if (typeof child === 'function') createEffect(() => appendChildElements(parent, child()))
  else appendChildElements(parent, child)
}

const appendChildElements = (parent, child) => {
  if (typeof child === 'string') {
    parent.appendChild(document.createTextNode(child))
  } else if (child instanceof Element) {
    parent.appendChild(child)
  } else if (Array.isArray(child)) {
    for (const c of child) {
      insert(parent, c)
    }
  }
}

const getProps = (args) => {
  let props,
    next = args[0]
  if (
    next == null ||
    (typeof next === 'object' && !Array.isArray(next) && !(next instanceof Element))
  )
    props = args.shift()
  props || (props = {})
  if (args.length) {
    props.children = args.length > 1 ? args : args[0]
  }
  return props
}

const h = (...args) => {
  let element = null

  const item = (l) => {
    let type = typeof l
    if (type === 'string') {
      if (!element) element = document.createElement(l)
      else insert(element, l)
    } else if (
      type === 'number' ||
      type === 'boolean' ||
      l instanceof Date ||
      l instanceof RegExp
    ) {
      insert(element, l.toString())
    } else if (l instanceof Element || Array.isArray(l)) {
      insert(element, l)
    } else if (type === 'object') {
      let dynamic = false
      const keys = Object.getOwnPropertyNames(l)

      for (const key of keys) {
        const value = l[key]
        // dynamic attribute that should be tracked for reaction
        if (typeof value === 'function') {
          dynamicProperty(l, key)
          dynamic = true
        }
      }
      if (dynamic) {
        createEffect(() => assign(element, l))
      } else {
        assign(element, l)
      }
    } else if (type === 'function') {
      // component or dynamic content
      if (!element) {
        const props = getProps(args)
        const keys = Object.getOwnPropertyNames(props)

        for (const key of keys) {
          const value = props[key]
          // dynamic attribute that should be tracked for reaction
          if (typeof value === 'function') {
            dynamicProperty(props, key)
          }
        }

        element = l(props)
      } else {
        insert(element, l)
      }
    }
  }

  while (args.length) item(args.shift())
  return element
}

export default h
