import Base from './base'

import isString from './utils/types/isString'
import isFunction from './utils/types/isFunction'
import isObject from './utils/types/isObject'
import isArray from './utils/types/isArray'
import later from './utils/lang/later'
import cloneDeep from './utils/lang/cloneDeep'
import createElement from './utils/dom/createElement'
import addClass from './utils/dom/addClass'
import hasClass from './utils/dom/hasClass'
import removeClass from './utils/dom/removeClass'
import on from './utils/event/on'
import off from './utils/event/off'
import paint from './utils/icons/paint'

import Command from './command'
import Commands from './commands'

import _createButton from './_createButton'

const DISABLED = 'outline-toolbar_disabled'
const HIDDEN = 'outline-toolbar_hidden'

class Toolbar extends Base {
  constructor(options) {
    super()

    this._default()

    if (options) {
      this.initialize(options)
    }
  }

  _default() {
    this.attrs = cloneDeep(Toolbar.DEFAULTS)

    this.disabled = false
    this.closed = false

    this.$el = null
    this.buttons = []
    this.commands = null

    return this
  }

  initialize(options) {
    let created

    this.attr(options)
    this.disabled = this.attr('disabled')
    this.closed = this.attr('closed')
    this.commands = new Commands()

    created = this.attr('created')

    if (isFunction(created)) {
      created.call(this)
    }

    this.render().addListeners()

    return this
  }

  isDisabled(name) {
    const buttons = this.attr('buttons')
    let button

    if (name) {
      button = buttons.find((option) => option.name === name)

      return button?.disabled
    }

    return this.disabled
  }

  isClosed() {
    return this.closed
  }

  highlight(name) {
    const button = this.buttons.find((item) => item.name === name)
    const ACTIVE = 'outline-toolbar_active'
    let $button

    if (button) {
      return this
    }

    $button = button.$el

    if (hasClass($button, ACTIVE)) {
      removeClass($button, ACTIVE)
    } else {
      addClass($button, ACTIVE)
    }

    return this
  }

  render() {
    const mounted = this.attr('mounted')
    const buttons = this.attr('buttons') || []
    const placement = this.attr('placement')

    paint()

    this.$el = createElement('div', {
      id: 'outline-toolbar',
      className: `outline-toolbar outline-toolbar_${placement}`
    })
    this._paint(buttons)
    document.body.appendChild(this.$el)

    if (this.closed) {
      this.hide()
    }

    if (this.disabled) {
      this.disable()
    }

    if (isFunction(mounted)) {
      mounted.call(this)
    }

    return this
  }

  erase() {
    this.$el.innerHTML = ''
    return this
  }

  _paint(buttons) {
    const rounded = this.attr('rounded')
    const $fragment = document.createDocumentFragment()

    buttons.forEach((button) => {
      const $button = _createButton(button, rounded)

      $fragment.appendChild($button)

      this.buttons.push({
        name: button.name,
        $el: $button
      })
    })

    this.$el.appendChild($fragment)

    return this
  }

  _remove() {
    document.body.removeChild(this.$el)
    return this
  }

  refresh(buttons) {
    this.attr({ buttons })
    this.erase()._paint(buttons)
    return this
  }

  add(button) {
    const $el = this.$el
    const buttons = this.attr('buttons') || []
    const action = button.action
    const $fragment = document.createDocumentFragment()
    const _self = this
    let name
    let type
    let context
    let command
    let listener

    if (isObject(button)) {
      buttons.push(button)
      $fragment.appendChild(_createButton(button))
    } else if (isArray(button)) {
      button.forEach((item) => {
        $fragment.appendChild(_createButton(item))
      })
    }
    $el.appendChild($fragment)

    if (action) {
      name = button.name
      type = action.type || 'click'
      listener = action.handler
      context = action.context

      if (isString(listener)) {
        command = listener
        action.handler = function () {
          _self.$emit(command, name)
        }
        listener = action.handler
      }

      if (isFunction(listener)) {
        this.commands.add(new Command(name, listener.bind(context)))
        on($el, `.${name}`, type, listener, context | this, true)
      }
    }

    return this
  }

  remove(name) {
    const $el = this.$el
    const buttons = this.attr('buttons') || []
    const button = buttons.find((option) => option.name === name)
    const index = buttons.indexOf(button)
    let $button

    if (!button) {
      return this
    }

    if (index > -1) {
      buttons.splice(index, 1)
    }

    $button = $el.querySelector(`.${name}`)
    this._disable(name)
    $el.removeChild($button)

    return this
  }

  _disable(name) {
    const $el = this.$el
    const buttons = this.attr('buttons') || []
    const button = buttons.find((option) => option.name === name)
    const index = buttons.indexOf(button)
    let action
    let $button
    let type
    let context
    let listener

    if (button.disabled) {
      return this
    }

    buttons[index].disabled = true

    action = button.action
    $button = $el.querySelector(`.${name}`)

    if (action) {
      type = action.type || 'click'
      context = action.context || this
      listener = action.handler

      if (isFunction(listener)) {
        this.commands.add(new Command(button.name, listener.bind(context)))
        on($el, `.${name}`, type, listener, context, true)
      }
    }

    addClass($button, DISABLED)

    return this
  }

  _enable(name) {
    const $el = this.$el
    const buttons = this.attr('buttons') || []
    const button = buttons.find((option) => option.name === name)
    const index = buttons.indexOf(button)
    let action
    let $button
    let type
    let listener

    if (!button.disabled) {
      return this
    }

    buttons[index].disabled = false

    action = button.action
    $button = $el.querySelector(`.${name}`)

    if (action) {
      type = action.type || 'click'
      listener = action.handler

      if (isFunction(listener)) {
        this.commands.del(button.name)
        off($el, type, listener)
      }
    }

    removeClass($button, DISABLED)

    return this
  }

  disable(name) {
    const disabled = this.attr('afterDisabled')

    if (name) {
      this._disable(name)
    } else {
      addClass(this.$el, DISABLED)
      this.removeListeners()
      this.disabled = true

      if (isFunction(disabled)) {
        disabled.call(this)
      }
    }

    return this
  }

  enable(name) {
    const enabled = this.attr('afterEnabled')

    if (name) {
      this._enable(name)
    } else {
      this.disabled = false
      removeClass(this.$el, DISABLED)
      this.addListeners()

      if (isFunction(enabled)) {
        enabled.call(this)
      }
    }

    return this
  }

  show(name) {
    const opened = this.attr('afterOpened')
    const buttons = this.attr('buttons') || []
    const button = buttons.find((option) => option.name === name)
    const $el = this.$el
    let $button

    if (name) {
      if (!button) {
        return this
      }

      $button = $el.querySelector(`.${name}`)
      removeClass($button, HIDDEN)
    } else {
      removeClass($el, HIDDEN)
      this.closed = false

      if (isFunction(opened)) {
        later(() => {
          opened.call(this)
        }, 310)
      }
    }

    return this
  }

  hide(name) {
    const closed = this.attr('afterClosed')
    const buttons = this.attr('buttons') || []
    const button = buttons.find((option) => option.name === name)
    const $el = this.$el
    let $button

    if (name) {
      if (!button) {
        return this
      }

      $button = $el.querySelector(`.${name}`)
      addClass($button, HIDDEN)
    } else {
      addClass($el, HIDDEN)
      this.closed = true

      if (isFunction(closed)) {
        later(() => {
          closed.call(this)
        }, 310)
      }
    }

    return this
  }

  toggle() {
    if (this.isClosed()) {
      this.show()
    } else {
      this.hide()
    }

    return this
  }

  destroy() {
    const beforeDestroy = this.attr('beforeDestroy')
    const afterDestroy = this.attr('afterDestroy')

    if (isFunction(beforeDestroy)) {
      beforeDestroy.call(this)
    }

    this.removeListeners()._remove()._default()

    if (isFunction(afterDestroy)) {
      afterDestroy.call(this)
    }

    return this
  }

  execute(name) {
    if (this.isDisabled(name)) {
      return this
    }

    this.commands.execute(name)

    return this
  }

  addListeners() {
    const buttons = this.attr('buttons') || []
    const $el = this.$el

    if (!buttons || buttons.length < 1) {
      return this
    }

    buttons.forEach((button) => {
      const action = button.action
      const disabled = this.disabled
      const _self = this
      let name
      let type
      let listener
      let context
      let command

      if (disabled) {
        return false
      }

      if (action) {
        name = button.name
        context = action.context || this
        listener = action.handler

        if (isString(listener)) {
          command = listener
          action.handler = function () {
            _self.$emit(command, name)
          }
          listener = action.handler
        }

        if (isFunction(listener)) {
          type = action.type || 'click'

          this.commands.add(new Command(name, listener.bind(context)))
          on($el, `.${name}`, type, listener, context, true)
        }
      }
    })

    return this
  }

  removeListeners() {
    const buttons = this.attr('buttons') || []
    const $el = this.$el

    if (!buttons || buttons.length < 1) {
      return this
    }

    buttons.forEach((button) => {
      const action = button.action
      const disabled = this.disabled
      let type
      let listener

      if (disabled) {
        return false
      }

      if (action) {
        listener = action.handler
        type = action.type || 'click'
      }

      if (isFunction(listener)) {
        this.commands.del(button.name)
        off($el, type, listener)
      }
    })

    return this
  }
}

Toolbar.DEFAULTS = {
  placement: 'ltr',
  closed: false,
  disabled: false,
  rounded: true,
  buttons: [],
  created: null,
  mounted: null,
  afterClosed: null,
  afterOpened: null,
  afterDisabled: null,
  afterEnabled: null,
  beforeDestroy: null,
  afterDestroy: null
}

export default Toolbar
