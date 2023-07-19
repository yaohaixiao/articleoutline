import Base from './base'

import later from './utils/lang/later'
import isFunction from './utils/types/isFunction'
import addClass from './utils/dom/addClass'
import removeClass from './utils/dom/removeClass'
import createElement from './utils/dom/createElement'
import on from './utils/event/on'
import off from './utils/event/off'

import { paintSvgSprites, createSvgIcon } from './utils/icons'

class Drawer extends Base {
  constructor(options) {
    super()

    this.attrs = Drawer.DEFAULTS
    this.title = ''
    this.closed = true
    this.$el = null
    this.$modal = null
    this.$header = null
    this.$title = null
    this.$close = null
    this.$main = null
    this.$footer = null
    this.$overlay = null

    if (options) {
      this.initialize(options)
    }
  }

  initialize(options) {
    let created

    this.attr(options)

    this.title = this.attr('title')
    created = this.attr('created')

    if (isFunction(created)) {
      created.call(this)
    }

    this.render().addListeners()
    return this
  }

  setTitle(title) {
    this.attr('title', title)
    this.title = title
    this.$title.innerHTML = title

    return this
  }

  isClosed() {
    return this.closed
  }

  render() {
    const mounted = this.attr('mounted')
    const size = this.attr('size')
    const placement = this.attr('placement')
    const hasClose = this.attr('hasClose')
    const hasOverlay = this.attr('hasOverlay')
    const hasOffset = this.attr('hasOffset')
    const hasPadding = this.attr('hasPadding')
    let $el
    let $modal
    let $header
    let $title
    let $close
    let $main
    let $footer
    let $overlay

    paintSvgSprites()
    Drawer.zIndex += 1

    $title = createElement(
      'h2',
      {
        className: 'outline-drawer__title'
      },
      [this.title]
    )
    this.$title = $title

    if (hasClose) {
      $close = createElement(
        'div',
        {
          className: 'outline-drawer__close'
        },
        [createSvgIcon('close', 20)]
      )
      this.$close = $close
    }

    $header = createElement(
      'header',
      {
        className: 'outline-drawer__header'
      },
      [$title, $close]
    )
    this.$header = $header

    $main = createElement(
      'div',
      {
        className: 'outline-drawer__main'
      },
      ['']
    )
    this.$main = $main

    if (!hasPadding) {
      addClass($main, ' outline-drawer_full')
    }

    $footer = createElement(
      'footer',
      {
        className: 'outline-drawer__footer'
      },
      ['']
    )
    this.$footer = $footer

    $modal = createElement(
      'div',
      {
        className: `outline-drawer__modal outline-drawer_${placement} outline-drawer_${size} outline-drawer_closed`
      },
      [$header, $main, $footer]
    )
    this.$modal = $modal

    if (hasOffset) {
      addClass($modal, ' outline-drawer_offset')
    }

    if (hasOverlay) {
      $overlay = createElement(
        'div',
        {
          className: 'outline-drawer__overlay'
        },
        ['']
      )
      this.$overlay = $overlay
    }

    $el = createElement(
      'div',
      {
        className: `outline-drawer`
      },
      [$modal, $overlay]
    )
    this.$el = $el
    document.body.appendChild($el)

    if (isFunction(mounted)) {
      mounted.call(this)
    }

    return this
  }

  open() {
    const opened = this.attr('afterOpened')
    const $modal = this.$modal

    addClass(this.$el, 'outline-drawer_opened')
    removeClass($modal, 'outline-drawer_closed')
    addClass($modal, 'outline-drawer_opened')

    later(() => {
      this.closed = false

      if (isFunction(opened)) {
        opened.call(this)
      }
    })

    return this
  }

  close() {
    const closed = this.attr('afterClosed')
    const $modal = this.$modal

    removeClass($modal, 'outline-drawer_opened')
    addClass($modal, 'outline-drawer_closed')

    later(() => {
      removeClass(this.$el, 'outline-drawer_opened')
      this.closed = true

      if (isFunction(closed)) {
        closed.call(this)
      }
    })

    return this
  }

  toggle() {
    if (this.isClosed()) {
      this.open()
    } else {
      this.close()
    }

    return this
  }

  destroy() {
    const afterDestroy = this.attr('afterDestroy')
    const beforeDestroy = this.attr('beforeDestroy')

    if (isFunction(beforeDestroy)) {
      beforeDestroy.call(this)
    }

    this.removeListeners()

    this.attrs = Drawer.DEFAULTS
    this.title = ''
    this.closed = false
    this.$el = null
    this.$modal = null
    this.$header = null
    this.$title = null
    this.$close = null
    this.$main = null
    this.$footer = null
    this.$overlay = null

    Drawer.zIndex -= 1

    if (isFunction(afterDestroy)) {
      afterDestroy.call(this)
    }

    return this
  }

  addListeners() {
    const hasClose = this.attr('hasClose')
    const hasOverlay = this.attr('hasOverlay')
    const $el = this.$el

    if (hasClose) {
      on($el, '.outline-drawer__close', 'click', this.onClose, this, true)
    }

    if (hasOverlay) {
      on($el, '.outline-drawer__overlay', 'click', this.onClose, this, true)
    }

    return this
  }

  removeListeners() {
    const hasClose = this.attr('hasClose')
    const hasOverlay = this.attr('hasOverlay')
    const $el = this.$el

    if (!hasClose && !hasOverlay) {
      return this
    }

    off($el, 'click', this.onClose)

    return this
  }

  onClose() {
    this.close()
    return this
  }
}

Drawer.DEFAULTS = {
  placement: 'rtl',
  title: '标题',
  size: 'regular',
  hasClose: true,
  hasOverlay: true,
  hasOffset: false,
  hasPadding: true,
  created: null,
  mounted: null,
  afterClosed: null,
  afterOpened: null,
  afterScroll: null,
  beforeDestroy: null,
  afterDestroy: null
}

Drawer.zIndex = 2000

export default Drawer