import Draggabilly from 'draggabilly';
import EventEmitter from './events';
import { el, on, off, clamp } from './utils';

// TODO: curve edges of new tab button
// TODO: fill width better
// TODO: don't prevent resize if adding tabs

let instanceId = 0;

const svgBackground = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><symbol id="topleft" viewBox="0 0 214 29" ><path d="M14.3 0.1L214 0.1 214 29 0 29C0 29 12.2 2.6 13.2 1.1 14.3-0.4 14.3 0.1 14.3 0.1Z"/></symbol><symbol id="topright" viewBox="0 0 214 29"><use xlink:href="#topleft"/></symbol><clipPath id="crop"><rect class="mask" width="100%" height="100%" x="0"/></clipPath></defs><svg width="50%" height="100%" transfrom="scale(-1, 1)"><use xlink:href="#topleft" width="214" height="29" class="xi-tab-background"/><use xlink:href="#topleft" width="214" height="29" class="xi-tab-shadow"/></svg><g transform="scale(-1, 1)"><svg width="50%" height="100%" x="-100%" y="0"><use xlink:href="#topright" width="214" height="29" class="xi-tab-background"/><use xlink:href="#topright" width="214" height="29" class="xi-tab-shadow"/></svg></g></svg>`;
const svgNewTab = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><symbol id="addnew" viewBox="0 0 53 29" ><path d="M 14.3 5 L 34.3 5 43 22 22.3 22 Z" /></symbol><symbol id="topright" viewBox="0 0 53 29"><use xlink:href="#addnew"/></symbol><clipPath id="crop"><rect class="mask" width="100%" height="100%" x="0"/></clipPath></defs><svg width="100%" height="100%" transfrom="scale(1, 1)"><use xlink:href="#addnew" width="53" height="29" class="xi-tab-background"/><use xlink:href="#addnew" width="53" height="29" class="xi-tab-shadow"/></svg></svg>`;

export default class Tabs extends EventEmitter {
  constructor(workspace) {
    super();

    this.workspace = workspace;
    this.draggabillyInstances = [];
    this.id = instanceId++;

    // TODO: Options
    this.tabOverlapDistance = 14;
    this.minWidth = 45;
    this.maxWidth = 243;
    // TODO: Options

    const newBtnBg = el('div', null, 'xi-tab-background');
    newBtnBg.innerHTML = svgNewTab;
    const newBtnIcon = el('div', null, 'xi-tab-icon');
    this.newTabButton = el('div', [newBtnBg, newBtnIcon], 'xi-tab xi-new-tab');

    this.styleEl = el('style');
    this.contentEl = el('div', [this.newTabButton], 'xi-tabs-content');
    this.bottomBar = el('div', null, 'xi-tabs-bottom-bar');

    this.el = el('div', [this.contentEl, this.bottomBar], 'xi-tabs-container');
    this.el.setAttribute('data-xi-tabs-instance-id', this.id);
    this.container = workspace.el.appendChild(el('div', [this.el, this.styleEl], 'xi-tabs'));

    this.registerEvents();
    this.layoutTabs();
    this.fixZIndices();
    this.registerDragEvents();
  }

  registerEvents() {
    on(window, 'resize', (e) => this.layoutTabs(), false);

    on(this.el, 'click', ({ target }) => {
      if (target.classList.contains('xi-new-tab')) {
        this.emit('new');
      }
      if (target.classList.contains('xi-tab-close')) {
        this.removeTab(target.parentNode); // TODO: before close
      }
    });

    on(this.el, 'mousedown', ({ target }) => {
      if (target.classList.contains('xi-new-tab')) return;
      if (target.classList.contains('xi-tab') ||
          target.classList.contains('xi-tab-icon') ||
          target.classList.contains('xi-tab-content')) {
        this.selectTab(target);
      }
    }, false);

    // Prevent resizing while mouse is over the element.
    const checkOutside = ({ pageX: x, pageY: y }) => {
      if (!this.container.contains(document.elementFromPoint(x, y))) {
        enableResize();
      }
    };

    const disableResize = () => {
      this._cachedTabWidth = this.tabWidth();
      this.el.classList.add('xi-tabs-no-resize');
      on(window, 'mousemove', checkOutside, false);
    };

    const enableResize = () => {
      off(window, 'mousemove', checkOutside, false);
      this.el.classList.remove('xi-tabs-no-resize');
      this.el.classList.add('xi-tabs-animate');
      this.layoutTabs();
      setTimeout(() => this.el.classList.remove('xi-tabs-animate'), 200);
    };

    on(this.el, 'mousemove', (e) => {
      if (!this.el.classList.contains('xi-tabs-no-resize')) {
        disableResize();
      }
    });
  }

  /**
   * Tab helpers.
   */

  tabs() {
    return this.el.querySelectorAll('.xi-tab');
  }

  tabWidth() {
    if (this.el.classList.contains('xi-tabs-no-resize')) {
      return this._cachedTabWidth;
    }
    const tabsContentWidth = this.contentEl.clientWidth - this.tabOverlapDistance;
    const width = (tabsContentWidth / this.tabs().length) + this.tabOverlapDistance;
    return clamp(width, this.minWidth, this.maxWidth);
  }

  tabEffectiveWidth() {
    return this.tabWidth() - this.tabOverlapDistance;
  }

  tabPositions() {
    const effectiveWidth = this.tabEffectiveWidth();
    let left = 0;
    let positions = [];
    for (const tab of this.tabs()) {
      positions.push(left);
      left += effectiveWidth;
    }
    return positions;
  }

  layoutTabs() {
    const tabs = this.tabs(),
          tabWidth = this.tabWidth(),
          effectiveWidth = this.tabEffectiveWidth();

    this.cleanUpPreviouslyDraggedTabs();
    for (const tab of tabs) tab.style.width = `${tabWidth}px`;

    if (tabs.length == 1) {
      this.newTabButton.style.display = 'none';
    }
    else if (tabs.length > 1) {
      this.newTabButton.style.display = 'block';
      this.newTabButton.style.width = '48px';
    }

    requestAnimationFrame(() => {
      let styleHTML = '';
      this.tabPositions().forEach((left, i) => {
        styleHTML += `
          .xi-tabs-container[data-xi-tabs-instance-id='${this.id}'] .xi-tab:nth-child(${i+1})  {
            transform: translate3d(${left}px, 0, 0);
          }
        `;
      });
      this.styleEl.innerHTML = styleHTML;
    });
  }

  cleanUpPreviouslyDraggedTabs() {
    for (const tab of this.tabs()) {
      tab.classList.remove('xi-tab-just-dragged');
    }
  }

  fixZIndices() {
    const tabs = [...this.tabs()];

    tabs.forEach((tab, i) => {
      let zIndex = tabs.length - i;

      if (tab.classList.contains('xi-tab-selected')) {
        this.bottomBar.style.zIndex = tabs.length + 1;
        zIndex = tabs.length + 2;
      }
      tab.style.zIndex = zIndex;
    });
  }

  registerDragEvents() {
    const tabs = [...this.tabs()];
    const effectiveWidth = this.tabEffectiveWidth();
    const tabPositions = this.tabPositions();

    this.draggabillyInstances.forEach((inst) => inst.destroy());

    tabs.forEach((tab, originalIndex) => {
      if (tab == this.newTabButton) return;
      const originalPosX = tabPositions[originalIndex];
      const draggabillyInstance = new Draggabilly(tab, {
        axis: 'x',
        containment: this.contentEl
      });

      this.draggabillyInstances.push(draggabillyInstance);

      draggabillyInstance.on('dragStart', () => {
        this.cleanUpPreviouslyDraggedTabs();
        tab.classList.add('xi-tab-currently-dragged');
        this.el.classList.add('xi-tabs-sorting');
        this.fixZIndices();
      });

      draggabillyInstance.on('dragEnd', () => {
        const finalTranslateX = parseFloat(tab.style.left, 10);
        tab.style.transform = 'translate3d(0, 0, 0)';

        // Animate dragged tab back into its place.
        requestAnimationFrame(() => {
          tab.style.left = '0';
          tab.style.transform = `translate3d(${finalTranslateX}px, 0, 0)`;

          requestAnimationFrame(() => {
            tab.classList.remove('xi-tab-currently-dragged');
            this.el.classList.remove('xi-tabs-sorting');

            this.selectTab(tab);
            tab.classList.add('xi-tab-just-dragged');

            requestAnimationFrame(() => {
              tab.style.transform = '';
              this.registerDragEvents();
            });
          });
        });
      });

      draggabillyInstance.on('dragMove', (e, pointer, moveVector) => {
        // The current index must be computed within the event since it may
        // change during the `dragMove`.
        const tabs = [...this.tabs()];
        const currentIndex = tabs.indexOf(tab);

        const currentPosX = originalPosX + moveVector.x;
        const destinationIndex = clamp(Math.floor((currentPosX + (effectiveWidth / 2)) / effectiveWidth), 0, tabs.length - 2);

        if (currentIndex != destinationIndex) {
          this.animateTabMove(tab, currentIndex, destinationIndex);
        }
      });
    });
  }

  animateTabMove(tab, src, dest) {
    if (dest < src) {
      tab.parentNode.insertBefore(tab, this.tabs()[dest]);
    } else {
      tab.parentNode.insertBefore(tab, this.tabs()[dest + 1]);
    }
  }

  selectTab(tab) {
    const currentTab = this.el.querySelector('.xi-tab-selected');
    if (currentTab) currentTab.classList.remove('xi-tab-selected');
    tab.classList.add('xi-tab-selected');
    this.fixZIndices();
    this.emit('change', tab.dataset);
  }

  createTab() {
    const svg = el('div');
    svg.innerHTML = svgBackground;

    const bg = el('div', [svg.firstElementChild], 'xi-tab-background');
    const icon = el('div', null, 'xi-tab-icon');
    const title = el('div', null, 'xi-tab-title');
    const close = el('div', null, 'xi-tab-close');
    return el('div', [bg, icon, title, close], 'xi-tab');
  }

  removeTab(tab, force) {
    if (!force && !this.signal('remove', null, tab.dataset)) return null;

    if (tab.classList.contains('xi-tab-selected')) {
      if (tab.previousElementSibling && tab.previousElementSibling != this.newTabButton) {
        this.selectTab(tab.previousElementSibling);
      } else if (tab.nextElementSibling && tab.nextElementSibling != this.newTabButton) {
        this.selectTab(tab.nextElementSibling);
      }
    }

    // Animate out and then remove.
    this.el.classList.add('xi-tabs-animate');
    tab.classList.add('xi-tab-just-removed');
    setTimeout(() => {
      tab.parentNode.removeChild(tab);
      this.layoutTabs();
      setTimeout(() => this.el.classList.remove('xi-tabs-animate'), 120);
    }, 150);

    this.emit('removed', tab.dataset);
    this.fixZIndices();
    this.registerDragEvents();
    return tab;
  }

  updateTab(tab, data) {
    if (!data.id) throw new Error('Tab must have an `id` property!');
    for (const key in data) {
      if (key == 'title') {
        tab.querySelector('.xi-tab-title').textContent = data.title;
      }
      if (key == 'icon') {
        tab.querySelector('.xi-tab-icon').style.backgroundImage = `url('${data.icon}')`;
      }
      tab.setAttribute(`data-${key}`, data[key]);
    }
  }

  /**
   * External methods.
   */

  add(data) {
    if (!data.id) throw new Error('Tab must have an `id` property!');
    const tab = this.createTab();

    tab.classList.add('xi-tab-just-added');
    setTimeout(() => tab.classList.remove('xi-tab-just-added'), 500);

    this.contentEl.insertBefore(tab, this.newTabButton);
    this.updateTab(tab, Object.assign({}, { title: '', icon: '' }, data));
    this.emit('add', tab.dataset);
    this.selectTab(tab);
    this.layoutTabs();
    this.fixZIndices();
    this.registerDragEvents();
  }

  has(id) {
    const tab = this.el.querySelector(`.xi-tab[data-id='${id}']`);
    if (tab && tab.classList.contains('xi-tab-just-removed')) return false;
    return !!tab;
  }

  select(id) {
    const tab = this.el.querySelector(`.xi-tab[data-id='${id}']`);
    if (tab) this.selectTab(tab);
  }

  remove(id) {
    const tab = this.el.querySelector(`.xi-tab[data-id='${id}']`);
    if (tab) this.removeTab(tab /*, true */ );
  }
}
