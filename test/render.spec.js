/**
 * @jest-environment jsdom
 */

import h from '../src/render'

const insertBody = (dom) => {
  document.body.appendChild(dom)
}

const cleanUpHtmlFormat = (html) => {
  return html.replace(/>\s+|\s+</g, (m) => m.trim()).replace(/\n/g, '')
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('pure static DOM rendering', () => {
  test('a simple element', () => {
    const dom = h('div', { class: 'static', style: 'color: blue' }, 'hello solid')
    insertBody(dom)
    expect(document.body.innerHTML).toBe(
      '<div class="static" style="color: blue">hello solid</div>'
    )
  })

  test('nested element', () => {
    const dom = h(
      'div',
      { class: 'static', style: 'color: blue' },
      h('span', { class: 'inner-text' }, new Date('12/1/23'))
    )
    insertBody(dom)
    expect(document.body.innerHTML).toBe(
      cleanUpHtmlFormat(
        `<div class="static" style="color: blue">
          <span class="inner-text">Fri Dec 01 2023 00:00:00 GMT+0800 (China Standard Time)</span>
         </div>`
      )
    )
  })

  test('a few of child elements', () => {
    const dom = h(
      'div',
      { class: 'static', style: 'color: blue' },
      h(
        'ul',
        { class: 'book-lists' },
        h('li', { class: 'book-item' }, ''),
        h('li', { class: 'book-item' }, ''),
        h('li', { class: 'book-item' }, '')
      )
    )
    insertBody(dom)
    expect(document.body.innerHTML).toBe(
      cleanUpHtmlFormat(
        `<div class="static" style="color: blue">
          <ul class="book-lists">
            <li class="book-item"></li>
            <li class="book-item"></li>
            <li class="book-item"></li>
          </ul>
        </div>`
      )
    )
  })

  test('an array of child elements', () => {
    const dom = h(
      'div',
      { class: 'static', style: 'color: blue' },
      h(
        'ul',
        { class: 'book-lists' },
        [h('li', { class: 'book-item' }, ''), h('li', { class: 'book-item' }, '')],
        h('li', { class: 'book-item' }, '')
      )
    )
    insertBody(dom)
    expect(document.body.innerHTML).toBe(
      cleanUpHtmlFormat(
        `<div class="static" style="color: blue">
          <ul class="book-lists">
            <li class="book-item"></li>
            <li class="book-item"></li>
            <li class="book-item"></li>
          </ul>
        </div>`
      )
    )
  })
})
