class Dom
{
  constructor(element)
  {
    if(element instanceof Dom)
    {
      this.elements = [...element.elements]
    }
    else if(element instanceof NodeList)
    {
      this.elements = Array.from(element)
    }
    else if(element instanceof Element)
    {
      this.elements = [element]
    }
    else if(element === window.document)
    {
      this.elements = [element]
    }
    else if(false === Boolean(element))
    {
      const error = new Error('Invalid argument: element is null or undefined')
      error.cause = 'Expected element to be an instance of HTMLElement, NodeList, Array of HTMLElements or Dom'
      error.code  = 'E_DOM_CONSTRUCTOR_INVALID_ARGUMENT'
      throw error
    }
    else
    {
      if(element instanceof Set)
      {
        element = Array.from(element)
      }

      if(element instanceof Array)
      {
        element = element.map(item => item instanceof Dom ? item.elements : item).flat()
      }
      else
      {
        element = [element]
      }

      this.elements = element.filter(item => item === window.document 
                                          || item instanceof Element)
    }
  }

  from(element)
  {
    return new Dom(element)
  }

  each(callback)
  {
    return this.forEach(callback)
  }

  forEach(callback)
  {
    this.elements.forEach((element, ...attr) => callback(this.from(element), ...attr))
    return this
  }

  find(selector, root)
  {
    return this.select(selector, root)
  }

  select(selector, root)
  {
    const list = []
    
    for(const element of this.elements)
    {
      const nodeList = (root || element).querySelectorAll(selector)
      list.push(...Array.from(nodeList))
    }

    return this.from(list)
  }

  css(property, value)
  {
    return value === undefined
    ? this.getCss(property)
    : this.setCss(property, value)
  }

  getCss(property)
  {
    for(const element of this.elements)
      return window
        .getComputedStyle(element, null)
        .getPropertyValue(property)
  }

  setCss(property, value)
  {
    property = property.toLowerCase().split('-').map((segment, i) =>
    {
      if(i > 0 && segment.length)
        segment[0] = segment[0].toUpperCase()

      return segment
    }).join('')

    for(const element of this.elements)
      element.style[property] = value

    return this
  }

  getHeight()
  {
    for(const element of this.elements)
      return element.innerHeight
  }

  focus()
  {
    for(const element of this.elements)
      element.focus()

    return this
  }

  * parentWalk(selector, matchThis = false)
  {
    function * walk(element)
    {
      for(let item = element; item; item = item.parentElement)
      {
        if(new Dom(item).is(selector))
        {
          yield item
        }
      }
    }

    for(const element of this.elements)
    {
      const item = matchThis ? element : element.parentElement

      if(item)
      {
        yield * walk(item)
      }
    }
  }

  parent(selector, matchThis = false)
  {
    const collection = []

    for(const element of this.elements)
    {
      if(false === Boolean(selector))
      {
        element.parentElement && collection.push(element.parentElement)
      }
      else
      {
        for(const parent of this.from(element).parentWalk(selector, matchThis))
        {
          collection.push(parent)
          break // only the first matching parent of each element is expected
        }
      }
    }

    return this.from(collection)
  }

  siblings(selector)
  {
    return this.getSiblings(selector)
  }

  getSiblings(selector)
  {
    const siblings = []

    for(const element of this.elements)
    {
      let sibling

      for(sibling = element.parentElement.firstChild; sibling; sibling = element.nextSibling)
      {
        if(false === this.elements.includes(sibling))
          if(selector && this.from(sibling).is(selector))
            siblings.push(sibling)
      }
    }

    return this.from(siblings)
  }

  next(selector)
  {
    return this.nextSiblings(selector)
  }

  nextSiblings(selector)
  {
    const walk = element =>
    {
      if(element.nextSibling)
      {
        return this.from(element.nextSibling).is(selector)
        ? element.nextSibling
        : walk(element.nextSibling)
      }
    }

    const nextSiblings = []

    for(const element of this.elements)
    {
      const sibling = walk(element)
      sibling && nextSiblings.push(sibling)
    }

    return this.from(nextSiblings)
  }

  previous(selector)
  {
    return this.previousSiblings(selector)
  }

  previousSiblings(selector)
  {
    const walk = element =>
    {
      if(element.previousSibling)
      {
        return this.from(element.previousSibling).is(selector)
        ? element.previousSibling
        : walk(element.previousSibling)
      }
    }

    const previousSiblings = []

    for(const element of this.elements)
    {
      const sibling = walk(element)
      sibling && previousSiblings.push(sibling)
    }

    return this.from(previousSiblings)
  }

  before(item)
  {
    for(const element of this.elements)
    {
      if(false === element.parentElement)
      {
        const error = new Error('Invalid operation: element has no parent node')
        error.cause = 'Expected the element to have a parent node in order to insert content before it'
        error.code  = 'E_DOM_BEFORE_NO_PARENT_NODE'
        throw error
      }

      item instanceof HTMLElement
      ? element.before(item)
      : item instanceof Dom
        ? item.elements.forEach(item => element.before(item))
        : element.insertAdjacentHTML('beforebegin', item)
    }

    return this
  }

  after(item)
  {
    for(const element of this.elements)
    {
      if(false === element.parentElement)
      {
        const error = new Error('Invalid operation: element has no parent node')
        error.cause = 'Expected the element to have a parent node in order to insert content after it'
        error.code  = 'E_DOM_AFTER_NO_PARENT_NODE'
        throw error
      }
      
      item instanceof HTMLElement
      ? element.after(item)
      : item instanceof Dom
        ? item.elements.forEach(item => element.after(item))
        : element.insertAdjacentHTML('afterend', item)
    }

    return this
  }

  prepend(item)
  {
    for(const element of this.elements)
      item instanceof HTMLElement
      ? element.insertBefore(item)
      : item instanceof Dom
        ? item.elements.forEach(item => element.insertBefore(item))
        : element.insertAdjacentHTML('afterbegin', item)

    return this
  }

  append(item)
  {
    for(const element of this.elements)
      item instanceof HTMLElement
      ? element.appendChild(item)
      : item instanceof Dom
        ? item.elements.forEach(item => element.appendChild(item))
        : element.insertAdjacentHTML('beforeend', item)

    return this
  }

  create(tagName)
  {
    return this.createElement(tagName)
  }

  createElement(tagName)
  {
    return this.from(document.createElement(tagName))
  }

  attr(name, value)
  {
    return this.attribute(name, value)
  }

  attribute(name, value)
  {
    switch(value)
    {
      case null      : return this.removeAttribute(name)
      case undefined : return this.getAttribute(name)
      default        : return this.setAttribute(name, value)
    }
  }

  deleteAttribute(name)
  {
    return this.removeAttribute(name)
  }

  removeAttribute(name)
  {
    for(const element of this.elements)
      element.removeAttribute(name)

    return this
  }

  setAttribute(name, value)
  {
    for(const element of this.elements)
      element.setAttribute(name, value)

    return this
  }

  getAttribute(attr)
  {
    for(const element of this.elements)
      if(element.hasAttribute(attr))
        return element.getAttribute(attr)
  }

  hasAttribute(attr)
  {
    for(const element of this.elements)
      return element.hasAttribute(attr)
  }

  clear()
  {
    for(const element of this.elements)
      while(element.childNodes.length)
        element.removeChild(element.childNodes[0])

    return this
  }

  delete()
  {
    return this.remove()
  }

  remove()
  {
    this.parent().clear()
    return this
  }

  on(eventName, observer)
  {
    for(const element of this.elements)
      element.addEventListener(eventName, observer.bind(element))

    return this
  }

  execute(eventName)
  {
    return this.trigger(eventName)
  }

  fireEvent(eventName)
  {
    return this.trigger(eventName)
  }

  dispatchEvent(eventName)
  {
    return this.trigger(eventName)
  }

  trigger(eventName)
  {
    return this.triggerEvent(eventName)
  }

  triggerEvent(eventName)
  {
    for(const element of this.elements)
      element.dispatchEvent(
        new Event(
          eventName, 
          {
            bubbles     : true,
            cancelable  : true,
            composed    : true 
          }))

    return this
  }

  click()
  {
    for(const element of this.elements)
      element.click()

    return this
  }

  class(className)
  {
    return {
      add    : this.addClass   .bind(this, className),
      has    : this.hasClass   .bind(this, className),
      delete : this.deleteClass.bind(this, className),
      remove : this.removeClass.bind(this, className),
      toggle : this.toggleClass.bind(this, className)
    }
  }

  addClass(className)
  {
    for(const element of this.elements)
    {
      const classNames = (element.className || '').split(' ').filter(value => value != '')

      if(classNames.includes(className))
        continue

      classNames.push(className)
      element.className = classNames.join(' ')
    }

    return this
  }

  hasClass(className)
  {
    for(const element of this.elements)
      if(element.className.split(' ').includes(className))
        return true

    return false
  }

  deleteClass(className)
  {
    return this.removeClass(className)
  }

  removeClass(className)
  {
    for(const element of this.elements)
    {
      const
        list  = element.className.split(' '),
        index = list.indexOf(className)

      ~index && list.splice(index, 1)
      element.className = list.join(' ')
    }

    return this
  }

  toggleClass(className)
  {
    for(const element of this.elements)
    {
      element = this.from(element)
      element.hasClass(className)
      ? element.removeClass(className)
      : element.addClass(className)
    }

    return this
  }

  html(content)
  {
    return this.innerHTML(content)
  }

  innerHTML(content)
  {
    return this.content(content)
  }

  content(content)
  {
    return undefined === content
    ? this.getContent()
    : this.setContent(content)
  }

  getContent()
  {
    let content

    for(const element of this.elements)
      if(element.innerHTML)
        content = element.innerHTML

    return content
  }

  setContent(content)
  {
    for(const element of this.elements)
      element.innerHTML = content

     return this
  }

  children(children)
  {
    return undefined === children
    ? this.getChildren()
    : this.setChildren(children)
  }

  getChildren()
  {
    const list = []

    for(const element of this.elements)
    {
      list.push(...Array.from(element.children))
    }

    return this.from(list)
  }

  setChildren(children)
  {
    for(const element of this.elements)
    {
      element.innerHTML = ''

      children instanceof HTMLElement
      ? element.appendChild(children)
      : children instanceof Dom
        ? children.elements.forEach(item => element.appendChild(item))
        : element.insertAdjacentHTML('beforeend', children)
    }

    return this
  }

  isChildOf(selector)
  {
    const walk = element => element.parentElement
                            ? ( this.from(element.parentElement).is(selector)
                              ? true
                              : walk.call(this, element.parentElement))
                            : false

    for(const element of this.elements)
      if(false === walk(element)) 
        return false

    return Boolean(this.elements.length)
  }

  check(checked = true)
  {
    for (const element of this.elements)
      if('checked' in element)
        element.checked = Boolean(checked)

    return this
  }

  checked()
  {
    return this.isChecked()
  }

  isChecked()
  {
    for (const element of this.elements)
      if(element.checked)
        return true

   return false
  }

  value(value)
  {
    return undefined === value
    ? this.getValue()
    : this.setValue(value)
  }

  getValue()
  {
    if(this.elements.length > 1)
      return this.getValueMap()

    for(const element of this.elements)
      return 'value' in element
                      ? element.value
                      : element.innerHTML
  }

  getValueMap()
  {
    const map = {}

    for(const element of this.elements)
    {
      const
        domElement  = this.from(element),
        name        = domElement.getAttribute('name') ?? domElement.getData('name')

      if((domElement.is('[type="radio"]') || domElement.is('[type="checkbox"]'))
      && false === domElement.isChecked())
        continue

      else if(name !== undefined)
      {
        const value = domElement.getValue()
        map[name]   = undefined === map[name]
                      ? value
                      : [].concat(map[name], value)
      }
    }

    return map
  }

  setValue(value)
  {
    for(const element of this.elements)
      if('value' in element)
        element.value = value

    return this
  }

  data(name, value)
  {
    return undefined === value
    ? this.getData(name)
    : this.setData(name, value)
  }

  hasData(name)
  {
    return undefined !== this.getData(name)
  }

  static #_LETTER_FOLLOWED_BY_AN_UPPERCASE_LETTER = /([a-zA-Z])(?=[A-Z])/g
  static paramCase = s => s.replace(Dom.#_LETTER_FOLLOWED_BY_AN_UPPERCASE_LETTER, '$1-').toLowerCase()

  getData(name)
  {
    for(const element of this.elements)
    {
      const data = element.dataset
      ? element.dataset[name]
      : element.getAttribute 
        && element.getAttribute('data-' + Dom.paramCase(name))

      if(undefined !== data)
      {
        return data
      }
    } 
  }

  setData(name, value)
  {
    for(const element of this.elements)
      element.dataset
        ? element.dataset[name] = value
        : element.setAttribute 
          && element.setAttribute('data-' + Dom.paramCase(name), value)

    return this
  }

  offset()
  {
    return this.getOffset()
  }

  getOffset()
  {
    for(const element of this.elements)
    {
      return {
        top  : element.offsetTop,
        left : element.offsetLeft
      }
    }
  }

  size()
  {
    const 
      width  = this.getWidth(),
      height = this.getHeight()

    return { width, height }
  }

  width()
  {
    return this.getWidth()
  }

  getWidth()
  {
    for(const element of this.elements)
      return {
        client : element.clientWidth,
        offset : element.offsetWidth,
        scroll : element.scrollWidth
      }

    return {}
  }

  height()
  {
    return this.getHeight()
  }

  getHeight()
  {
    for(const element of this.elements)
      return {
        client : element.clientHeight,
        offset : element.offsetHeight,
        scroll : element.scrollHeight
      }

    return {}
  }

  scroll(point)
  {
    return undefined === point
    ? this.getScroll()
    : this.setScroll(point)
  }

  getScroll()
  {
    for(const element of this.elements)
    {
      return {
        x : element.scrollLeft,
        y : element.scrollTop
      }
    }
  }

  setScroll(point)
  {
    let x, y

    if(typeof point === 'number')
    {
      y = point
    }
    else
    {
      x = point.x
      y = point.y

      if(false === (Number.isInteger(x) || Number.isInteger(y)))
      {
        const error = new Error('Invalid argument: point')
        error.cause = 'Expected point to be a number or an object with x and/or y properties as numbers'
        error.code  = 'E_DOM_SET_SCROLL_INVALID_ARGUMENT'
        throw error
      }
    }

    for(const element of this.elements)
    {
      Number.isInteger(x) && (element.scrollLeft = x)
      Number.isInteger(y) && (element.scrollTop  = y)
    }

    return this
  }

  is(selector)
  {
    if(0 === this.elements.length)
      return false

    if(selector instanceof Dom)
      return selector.elements.length === this.elements.length
          && selector.elements.every(item => this.elements.includes(item))

    if(selector instanceof HTMLElement)
      return this.elements.includes(selector)

    const match = element => element.matches
                          ?? element.matchesSelector
                          ?? element.msMatchesSelector
                          ?? element.mozMatchesSelector
                          ?? element.webkitMatchesSelector
                          ?? element.oMatchesSelector
                          ?? function() 
                             {
                               const error = new Error('Browser does not support element.matches(selector)')
                               error.cause = 'Expected the browser to support element.matches(selector) to perform selector matching'
                               error.code  = 'E_DOM_BROWER_UNSUPPORTED'
                               throw error
                             }

    for(const element of this.elements)
      if(false === match(element).call(element, selector))
        return false

    return true
  }

  filter(selector)
  {
    const filteredElements = []

    for(const element of this.elements)
      if(this.from(element).is(selector))
        filteredElements.push(element)

    return this.from(filteredElements)
  }

  toString()
  {
    let out = ''

    for(const element of this.elements)
      out += element.outerHTML

    return out
  }
}

const dom = new Dom(window.document)
