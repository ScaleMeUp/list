/**
 * Build styles
 */
import './index.css';

import { IconListBulleted } from '@codexteam/icons'

import { Icon as NumberedIcon } from './icons/numbered.js';
import { Icon as UnorderedIcon } from './icons/unordered.js';
import { Icon as CircledIcon } from './icons/circled.js';
import { Icon as SquaredIcon } from './icons/squared.js';
import { Icon as StaredIcon } from './icons/stared.js';
import { Icon as DashedIcon } from './icons/dashed.js';
import { Icon as ArrowedIcon } from './icons/arrowed.js';
import { Icon as SpacingIcon } from './icons/spacing.js';

/**
 * @typedef {import('@editorjs/editorjs').PasteEvent} PasteEvent
 */

/**
 * @typedef {object} ListData
 * @property {string} style
 * @property {string} spacing - can be compact or normal
 * @property {Array} items - li elements
 */

/**
 * @typedef {object} ListConfig
 * @description Tool's config from Editor
 * @property {string} defaultStyle — ordered or unordered
 * @property {string} defaultSpacing — compact or normal
 */

/**
 * List Tool for the Editor.js 2.0
 */
export default class List {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Allow to use native Enter behaviour
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: IconListBulleted,
      title: 'List',
    };
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {object} params - tool constructor options
   * @param {ListData} params.data - previously saved data
   * @param {object} params.config - user config for Tool
   * @param {object} params.api - Editor.js API
   * @param {boolean} params.readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    /**
     * HTML nodes
     *
     * @private
     */
    this._elements = {
      wrapper: null,
    };

    this.api = api;
    this.readOnly = readOnly;

    this.settings = {
      'style': [
        {
          name: 'numbered',
          title: this.api.i18n.t('Numbered'),
          icon: NumberedIcon,
          default: config.defaultStyle === 'numbered' || true,
        },

        {
          name: 'unordered',
          title: this.api.i18n.t('Unordered'),
          icon: UnorderedIcon,
          default: config.defaultStyle === 'unordered' || false,
        },

        {
          name: 'circled',
          title: this.api.i18n.t('Circled'),
          icon: CircledIcon,
          default: config.defaultStyle === 'circled' || false,
        },

        {
          name: 'squared',
          title: this.api.i18n.t('Squared'),
          icon: SquaredIcon,
          default: config.defaultStyle === 'squared' || false,
        },

        {
          name: 'stared',
          title: this.api.i18n.t('Stared'),
          icon: StaredIcon,
          default: config.defaultStyle === 'stared' || false,
        },

        {
          name: 'dashed',
          title: this.api.i18n.t('Dashed'),
          icon: DashedIcon,
          default: config.defaultStyle === 'dashed' || false,
        },

        {
          name: 'arrowed',
          title: this.api.i18n.t('Arrowed'),
          icon: ArrowedIcon,
          default: config.defaultStyle === 'arrowed' || false,
        },
      ],

      'spacing': [
        {
          name: 'normal',
          title: this.api.i18n.t('Normal'),
          icon: null,
          default: config.defaultSpacing === 'normal' || true,
          render: () => document.createElement('span'),
        },

        {
          name: 'compact',
          title: this.api.i18n.t('Compact'),
          icon: null,
          default: config.defaultSpacing === 'compact' || false,
        },
      ]
    };

    /**
     * Tool's data
     *
     * @type {ListData}
     */
    this._data = {
      style: this.settings.style.find((tune) => tune.default === true).name,
      spacing: this.settings.spacing.find((tune) => tune.default === true).name,
      items: [],
    };

    this.data = data;
  }

  /**
   * Returns list tag with items
   *
   * @returns {Element}
   * @public
   */
  render() {
    this._elements.wrapper = this.makeMainTag(
        this._data.style,
        this._data.spacing
    );

    // fill with data
    if (this._data.items.length) {
      this._data.items.forEach((item) => {
        this._elements.wrapper.appendChild(this._make('li', this.CSS.item, {
          innerHTML: item,
        }));
      });
    } else {
      this._elements.wrapper.appendChild(this._make('li', this.CSS.item));
    }

    if (!this.readOnly) {
      // detect keydown on the last item to escape List
      this._elements.wrapper.addEventListener('keydown', (event) => {
        const [ENTER, BACKSPACE] = [13, 8]; // key codes

        switch (event.keyCode) {
          case ENTER:
            this.getOutofList(event);
            break;
          case BACKSPACE:
            this.backspace(event);
            break;
        }
      }, false);
    }

    return this._elements.wrapper;
  }

  /**
   * @returns {ListData}
   * @public
   */
  save() {
    return this.data;
  }

  /**
   * Allow List Tool to be converted to/from other block
   *
   * @returns {{export: Function, import: Function}}
   */
  static get conversionConfig() {
    return {
      /**
       * To create exported string from list, concatenate items by dot-symbol.
       *
       * @param {ListData} data - list data to create a string from thats
       * @returns {string}
       */
      export: (data) => {
        return data.items.join('. ');
      },
      /**
       * To create a list from other block's string, just put it at the first item
       *
       * @param {string} string - string to create list tool data from that
       * @returns {ListData}
       */
      import: (string) => {
        return {
          items: [ string ],
          style: 'unordered',
        };
      },
    };
  }

  /**
   * Sanitizer rules
   *
   * @returns {object}
   */
  static get sanitize() {
    return {
      style: {},
      items: {
        font: true,
        br: true,
        a: true,
        i: true,
        b: true,
        s: true,
      },
    };
  }

  /**
   * Settings
   *
   * @public
   * @returns {Array}
   */
  renderSettings() {
    const transform = (items, active, callback) => {
      return items.map(item => ({
        ...item,
        closeOnActivate: true,
        isActive: active === item.name,
        onActivate: () => callback(item.name)
      }))
    }

    return [
      {
        name: 'style',
        title: this.api.i18n.t('Style'),
        icon: IconListBulleted,
        children: {
          items: transform(
              this.settings.style,
              this._data.style,
              (value) => this.toggleStyleTune(value)
          )
        },
      },

      {
        name: 'spacing',
        title: this.api.i18n.t('Spacing'),
        icon: SpacingIcon,
        children: {
          items: transform(
              this.settings.spacing,
              this._data.spacing,
              (value) => this.toggleSpacingTune(value)
          )
        },
      },
    ]
  }

  /**
   * On paste callback that is fired from Editor
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event) {
    const list = event.detail.data;

    this.data = this.pasteHandler(list);
  }

  /**
   * List Tool on paste configuration
   *
   * @public
   */
  static get pasteConfig() {
    return {
      tags: ['OL', 'UL', 'LI'],
    };
  }

  /**
   * Creates main <ul> or <ol> tag depended on style
   *
   * @param {string} style
   * @param {string} spacing - 'compact' or 'normal'
   * @returns {HTMLOListElement|HTMLUListElement}
   */
  makeMainTag(style, spacing) {
    const styleClass = style === 'numbered'
        ? this.CSS.wrapperOrdered
        : `${this.CSS.wrapperList}${style}`;

    const spacingClass = spacing === 'compact'
        ? this.CSS.spacingCompact
        : this.CSS.spacingNormal;

    const tag = style === 'numbered' ? 'ol' : 'ul';

    return this._make(tag, [
        this.CSS.baseBlock,
        this.CSS.wrapper,
        styleClass,
        spacingClass,
    ], {
      contentEditable: !this.readOnly,
    });
  }

  /**
   * Toggles List style
   *
   * @param {string} style - 'ordered'|'unordered'
   */
  toggleStyleTune(style) {
    const newTag = this.makeMainTag(
        style,
        this._data.spacing,
    );

    while (this._elements.wrapper.hasChildNodes()) {
      newTag.appendChild(this._elements.wrapper.firstChild);
    }

    this._elements.wrapper.replaceWith(newTag);
    this._elements.wrapper = newTag;
    this._data.style = style;
  }

  /**
   * Toggles List style
   *
   * @param {string} spacing - 'compact'|'normal'
   */
  toggleSpacingTune(spacing) {
    const newTag = this.makeMainTag(this._data.style, spacing);

    while (this._elements.wrapper.hasChildNodes()) {
      newTag.appendChild(this._elements.wrapper.firstChild);
    }

    this._elements.wrapper.replaceWith(newTag);
    this._elements.wrapper = newTag;
    this._data.spacing = spacing;
  }

  /**
   * Styles
   *
   * @private
   */
  get CSS() {
    return {
      baseBlock: this.api.styles.block,
      wrapper: 'cdx-list',
      wrapperOrdered: 'cdx-list--ordered',
      wrapperList: `cdx-list--`,
      spacingNormal: 'cdx-list--normal',
      spacingCompact: 'cdx-list--compact',
      item: 'cdx-list__item',
    };
  }

  /**
   * List data setter
   *
   * @param {ListData} listData
   */
  set data(listData) {
    if (!listData) {
      listData = {};
    }

    this._data.style = listData.style || this.settings.style.find((tune) => tune.default === true).name;
    this._data.spacing = listData.spacing || this.settings.spacing.find((tune) => tune.default === true).name;
    this._data.items = listData.items || [];

    const oldView = this._elements.wrapper;

    if (oldView) {
      oldView.parentNode.replaceChild(this.render(), oldView);
    }
  }

  /**
   * Return List data
   *
   * @returns {ListData}
   */
  get data() {
    this._data.items = [];

    const items = this._elements.wrapper.querySelectorAll(`.${this.CSS.item}`);

    for (let i = 0; i < items.length; i++) {
      const value = items[i].innerHTML.replace('<br>', ' ').trim();

      if (value) {
        this._data.items.push(items[i].innerHTML);
      }
    }

    return this._data;
  }

  /**
   * Helper for making Elements with attributes
   *
   * @param  {string} tagName           - new Element tag name
   * @param  {Array|string} classNames  - list or name of CSS classname(s)
   * @param  {object} attributes        - any attributes
   * @returns {Element}
   */
  _make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      el[attrName] = attributes[attrName];
    }

    return el;
  }

  /**
   * Returns current List item by the caret position
   *
   * @returns {Element}
   */
  get currentItem() {
    let currentNode = window.getSelection().anchorNode;

    if (currentNode.nodeType !== Node.ELEMENT_NODE) {
      currentNode = currentNode.parentNode;
    }

    return currentNode.closest(`.${this.CSS.item}`);
  }

  /**
   * Get out from List Tool
   * by Enter on the empty last item
   *
   * @param {KeyboardEvent} event
   */
  getOutofList(event) {
    const items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item);

    /**
     * Save the last one.
     */
    if (items.length < 2) {
      return;
    }

    const lastItem = items[items.length - 1];
    const currentItem = this.currentItem;

    /** Prevent Default li generation if item is empty */
    if (currentItem === lastItem && !lastItem.textContent.trim().length) {
      /** Insert New Block and set caret */
      currentItem.parentElement.removeChild(currentItem);
      this.api.blocks.insert();
      this.api.caret.setToBlock(this.api.blocks.getCurrentBlockIndex());
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handle backspace
   *
   * @param {KeyboardEvent} event
   */
  backspace(event) {
    const items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item),
        firstItem = items[0];

    if (!firstItem) {
      return;
    }

    /**
     * Save the last one.
     */
    if (items.length < 2 && !firstItem.innerHTML.replace('<br>', ' ').trim()) {
      event.preventDefault();
    }
  }

  /**
   * Select LI content by CMD+A
   *
   * @param {KeyboardEvent} event
   */
  selectItem(event) {
    event.preventDefault();

    const selection = window.getSelection(),
        currentNode = selection.anchorNode.parentNode,
        currentItem = currentNode.closest('.' + this.CSS.item),
        range = new Range();

    range.selectNodeContents(currentItem);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Handle UL, OL and LI tags paste and returns List data
   *
   * @param {HTMLUListElement|HTMLOListElement|HTMLLIElement} element
   * @returns {ListData}
   */
  pasteHandler(element) {
    const { tagName: tag } = element;
    let style;

    switch (tag) {
      case 'OL':
        style = 'ordered';
        break;
      case 'UL':
      case 'LI':
        style = 'unordered';
    }

    const data = {
      style,
      items: [],
    };

    if (tag === 'LI') {
      data.items = [ element.innerHTML ];
    } else {
      const items = Array.from(element.querySelectorAll('LI'));

      data.items = items
        .map((li) => li.innerHTML)
        .filter((item) => !!item.trim());
    }

    return data;
  }
}

