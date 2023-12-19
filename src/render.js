/** 
 - using hyperscript approach to render that runs from bottom to up.
 - how to identify dynamic expression which should be tracked, 
    all dynamic expression are wrapped in functions without parameters that's 
    used to distinguish with event functions, as each event function has event
    object passed in.
 */

const passinProps = (element, props = {}) => {
  for (const propKey in props) {
    element.setAttribute(propKey, props[propKey])
  }
}

const h = (...args) => {
  let element = null

  const item = (l) => {
    let type = typeof l
    if (type === 'string') {
      if (!element) element = document.createElement(l)
      else element.appendChild(document.createTextNode(l))
    } else if (
      type === 'number' ||
      type === 'boolean' ||
      l instanceof Date ||
      l instanceof RegExp
    ) {
      element.appendChild(document.createTextNode(l.toString()))
    } else if (l instanceof Element || Array.isArray(l)) {
      l = Array.isArray(l) ? l : [l]
      l.forEach((ele) => {
        element.appendChild(ele)
      })
    } else if (type === 'object') {
      passinProps(element, l)
    }
  }

  while (args.length) item(args.shift())

  return element
}

export default h
