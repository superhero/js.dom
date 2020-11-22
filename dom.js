var dom = new (function Dom(elements)
{
  this.from = function(e)
  {
    var list = e instanceof NodeList
             ? Array.prototype.slice.call(e)
             : e instanceof Array
               ? e
               : [e];

    list = list.filter(function(item)
    {
      return item == window.document || item instanceof Element;
    });

    return new Dom(list);
  };

  this.getCss = function(property)
  {
    for(var i in elements)
      return window
        .getComputedStyle(elements[i], null)
        .getPropertyValue(property);
  };

  this.setCss = function(property, value)
  {
    property = property.toLowerCase().split('-').map(function(value, i)
    {
      if(i > 0 && value.length)
        value = value.charAt(0).toUpperCase() + value.slice(1);

      return value;
    }).join('');

    for(var i in elements)
      elements[i].style[property] = value;

    return this;
  };

  this.getHeight = function()
  {
    for(var i in elements)
      return elements[i].innerHeight;
  };

  this.focus = function()
  {
    for(var i in elements)
      elements[i].focus();

    return this;
  };

  this.select = function(selector, root)
  {
    var list = [];
    for(var i in elements)
    {
      var nodeList = (root || elements[i]).querySelectorAll(selector);
      list = list.concat(Array.prototype.slice.call(nodeList));
    }

    return this.from(list);
  };

  this.parent = function(selector, matchThis)
  {
    for(var i in elements)
    {
      if(!selector)
        return this.from(elements[i].parentNode);

      if(matchThis && this.is(selector))
        return this.from(elements[i]);

      return function recur(child)
      {
        if(!child.parentNode)
          return false;

        var parent = this.from(child.parentNode);
        return parent.is(selector)
        ? parent
        : recur.call(this, child.parentNode);
      }.call(this, elements[i]);
    }
  };

  this.getSiblings = function(selector)
  {
    var siblings = [];

    for(var i in elements)
    {
      var sibling = elements[i].parentNode.firstChild;

      do
      {
        if(!~elements.indexOf(sibling))
          if(!selector || this.from(sibling).is(selector))
            siblings.push(sibling);
      }
      while (sibling = sibling.nextSibling);
    }

    return this.from(siblings);
  };

  this.nextSibling = function(selector)
  {
    function walker(selector, element)
    {
      if(element.nextSibling)
      {
        var sibling = this.from(element.nextSibling);
        return sibling.is(selector)
        ? sibling
        : walker.call(this, selector, element.nextSibling);
      }
    }

    for(var i in elements)
      return walker.call(this, selector, elements[i]);
  };

  this.previousSibling = function(selector)
  {
    function walker(selector, element)
    {
      if(element.previousSibling)
      {
        var sibling = this.from(element.previousSibling);
        return sibling.is(selector)
        ? sibling
        : walker.call(this, selector, element.previousSibling);
      }
    }

    for(var i in elements)
      return walker.call(this, selector, elements[i]);
  };

  this.before = function(html)
  {
    for(var i in elements)
      elements[i].insertAdjacentHTML('beforebegin', html);

    return this;
  };

  this.prepend = function(item)
  {
    for(var i in elements)
      item instanceof HTMLElement
      ? elements[i].insertBefore(item, elements[i].childNodes[0])
      : item instanceof Dom
        ? item.get().forEach(function(item)
          {
            elements[i].insertBefore(item, elements[i].childNodes[0]);
          })
        : elements[i].insertAdjacentHTML('afterbegin', item);

    return this;
  };

  this.append = function(item)
  {
    for(var i in elements)
      item instanceof HTMLElement
      ? elements[i].appendChild(item)
      : item instanceof Dom
        ? item.get().forEach(function(item)
          {
            elements[i].appendChild(item);
          })
        : elements[i].insertAdjacentHTML('beforeend', item);

    return this;
  };

  this.after = function(html)
  {
    for(var i in elements)
      elements[i].insertAdjacentHTML('afterend', html);

    return this;
  };

  this.new = function(s)
  {
    return this.from(document.createElement(s))
  };

  this.remove = function()
  {
    for(var i in elements)
      elements[i].parentNode.removeChild(elements[i]);

    elements = [];

    return this;
  };

  this.removeAttribute = function(name)
  {
    for(var i in elements)
      elements[i].removeAttribute(name);

    return this;
  };

  this.setAttribute = function(name, value)
  {
    for(var i in elements)
      elements[i].setAttribute(name, value);

    return this;
  };

  this.getAttribute = function(attr)
  {
    for(var i in elements)
      return elements[i].getAttribute(attr);
  };

  this.clear = function()
  {
    for(var i in elements)
      while(elements[i].childNodes.length)
        elements[i].removeChild(elements[i].childNodes[0]);

    return this;
  };

  this.on = function(eventName, observer)
  {
    for(var i in elements)
      elements[i].addEventListener(eventName, observer.bind(elements[i]));

    return this;
  };

  this.trigger = function(eventName)
  {
    var e; // The custom event that will be created

    if(document.createEvent)
    {
      e = document.createEvent("HTMLEvents");
      e.initEvent(eventName, true, true);
    }
    else
    {
      e = document.createEventObject();
      e.eventType = eventName;
    }

    e.eventName = eventName;

    if(document.createEvent)
    {
      for(var i in elements)
        elements[i].dispatchEvent(e);
    }
    else
    {
      for(var i in elements)
        elements[i].fireEvent('on' + e.eventName, e);
    }
  };

  this.click = function()
  {
    for(var i in elements)
      elements[i].click();

    return this;
  };

  this.addClass = function(className)
  {
    for(var i in elements)
    {
      var
      list = (elements[i].className || '').split(' ');
      list = list.filter(function(value){return value != ''});

      if(~list.indexOf(className))
        return this;

      list.push(className);
      elements[i].className = list.join(' ');
    }

    return this;
  };

  this.removeClass = function(className)
  {
    for(var i in elements)
    {
      var
      list  = elements[i].className.split(' '),
      index = list.indexOf(className);

      ~index && list.splice(index, 1);
      elements[i].className = list.join(' ');
    }

    return this;
  };

  this.toggleClass = function(className)
  {
    for(var i in elements)
    {
      var element = this.from(elements[i]);

      element.hasClass(className)
      ? element.removeClass(className)
      : element.addClass(className);
    }

    return this;
  };

  this.hasClass = function(className)
  {
    for(var i in elements)
      return !!~elements[i].className.split(' ').indexOf(className);
  };

  this.getContent = function()
  {
    for(var i in elements)
      return elements[i].innerHTML;
  };

  this.setContent = function(content)
  {
    for(var i in elements)
      elements[i].innerHTML = content;

     return this;
  };

  this.children = function()
  {
    var list = [];
    for(var i in elements)
    {
      var arrayList = Array.prototype.slice.call(elements[i].children);
      list = list.concat(arrayList);
    }

    return this.from(list);
  };

  this.childOf = function(selector)
  {
    for(var i in elements)
      if(!function recur(child)
          {
            return child.parentNode
            ? ( this.from(child.parentNode).is(selector)
              ? true
              : recur.call(this, child.parentNode))
            : false;
          }.call(this, elements[i]))
        return false;

    return !!elements.length;
  };

  this.get = function(i)
  {
    return i == undefined ? elements : elements[i];
  };

  this.valueMap = function()
  {
    var map = {};

    for(var i in elements)
    {
      var
      element = this.from(elements[i]),
      name    = element.getAttribute('name') || element.getData('name');

      if((element.is('[type="radio"]') || element.is('[type="checkbox"]'))
      && !element.get(0).checked)
        continue;

      if(name != undefined)
      {
        var value = 'value' in elements[i]
          ? elements[i].value
          : elements[i].innerHTML;

        map[name] = map[name] === undefined
         ? value
         : [].concat(map[name], value);
      }
    }

    return map;
  };

  this.getValue = function()
  {
    for(var i in elements)
      return elements[i].value;
  };

  this.setValue = function(value)
  {
    for(var i in elements)
      elements[i].value = value;

    return this;
  };

  this.hasData = function(name)
  {
    for(var i in elements)
      return elements[i].dataset
        ? name in elements[i].dataset
        : elements[i].hasAttribute &&
          elements[i].hasAttribute('data-' + name.replace(
            /([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase());
  };

  this.getData = function(name)
  {
    for(var i in elements)
      return elements[i].dataset
        ? elements[i].dataset[name]
        : elements[i].getAttribute &&
          elements[i].getAttribute('data-' + name.replace(
            /([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase());
  };

  this.getOffset = function()
  {
    for(var i in elements)
    {
      var offset =
      {
        top  : elements[i].offsetTop,
        left : elements[i].offsetLeft
      };

      return offset;
    }
  };

  this.getWidth = function()
  {
    for(var i in elements)
      return {
        client : elements[i].clientWidth,
        offset : elements[i].offsetWidth,
        scroll : elements[i].scrollWidth
      }

    return {}
  };

  this.getHeight = function()
  {
    for(var i in elements)
      return {
        client : elements[i].clientHeight,
        offset : elements[i].offsetHeight,
        scroll : elements[i].scrollHeight
      }

    return {}
  };

  this.setScroll = function(point)
  {
    for(var i in elements)
    {
      if('y' in point)
        elements[i].scrollTop = point.y;

      if('x' in point)
        elements[i].scrollLeft = point.x;
    }

    return this;
  };

  this.setData = function(name, value)
  {
    for(var i in elements)
      elements[i].dataset
        ? elements[i].dataset[name] = value
        : elements[i].setAttribute('data-' + name.replace(
            /([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase(), value);

    return this;
  };

  this.is = function(selector)
  {
    if(!elements.length)
      return false;

    if(selector instanceof Dom)
      return selector.get().length == this.get().length
          && selector.get().every(function(item)
             {
               return ~this.get().indexOf(item);
             }.bind(this));

    if(selector instanceof HTMLElement)
      return ~this.get().indexOf(selector);

    var matches =
      ( elements[0].matches
     || elements[0].matchesSelector
     || elements[0].msMatchesSelector
     || elements[0].mozMatchesSelector
     || elements[0].webkitMatchesSelector
     || elements[0].oMatchesSelector);

   for(var i in elements)
     if(!(matches && matches.call(elements[i], selector)))
      return false;

    return true;
  };

  this.filter = function(selector)
  {
    var filteredElements = [];

    for(var i in elements)
      if(this.from(elements[i]).is(selector))
        filteredElements.push(elements[i]);

    return this.from(filteredElements);
  };

  this.exclude = function(selector)
  {
    var filteredElements = [];

    for(var i in elements)
      if(!this.from(elements[i]).is(selector))
        filteredElements.push(elements[i]);

    return this.from(filteredElements);
  };

  this.toString = function()
  {
    var out = '';

    for(var i in elements)
      out += elements[i].outerHTML;

    return out;
  };
})([window.document]);
