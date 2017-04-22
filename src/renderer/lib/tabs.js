import Draggabilly from 'draggabilly';
import { el, on, off, clamp } from './utils';

let instanceId = 0;

const svgBackground = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><symbol id="topleft" viewBox="0 0 214 29" ><path d="M14.3 0.1L214 0.1 214 29 0 29C0 29 12.2 2.6 13.2 1.1 14.3-0.4 14.3 0.1 14.3 0.1Z"/></symbol><symbol id="topright" viewBox="0 0 214 29"><use xlink:href="#topleft"/></symbol><clipPath id="crop"><rect class="mask" width="100%" height="100%" x="0"/></clipPath></defs><svg width="50%" height="100%" transfrom="scale(-1, 1)"><use xlink:href="#topleft" width="214" height="29" class="xi-tab-background"/><use xlink:href="#topleft" width="214" height="29" class="xi-tab-shadow"/></svg><g transform="scale(-1, 1)"><svg width="50%" height="100%" x="-100%" y="0"><use xlink:href="#topright" width="214" height="29" class="xi-tab-background"/><use xlink:href="#topright" width="214" height="29" class="xi-tab-shadow"/></svg></g></svg>`;

export default class Tabs {
  constructor(workspace) {
    this.workspace = workspace;
    this.draggabillyInstances = [];
    this.id = instanceId++;

    // Option
    this.tabOverlapDistance = 14;
    this.minWidth = 45;
    this.maxWidth = 243;
    // Option

    this.styleEl = el('style');
    this.contentEl = el('div', null, 'xi-tabs-content');
    this.bottomBar = el('div', null, 'xi-tabs-bottom-bar');

    this.el = el('div', [this.contentEl], 'xi-tabs-container');
    this.el.setAttribute('data-xi-tabs-instance-id', this.id);
    this.container = workspace.el.appendChild(el('div', [this.el, this.styleEl, this.bottomBar], 'xi-tabs'));

    this.registerEvents();
    this.layoutTabs();
    this.fixZIndices();
    this.registerDragEvents();

    // Connect events to workspace...
    this.on('tabAdd', (e) => {/* ... */});
    this.on('tabRemove', (e) => {
      const tab = e.detail.tab;
      this.workspace.closeView(tab.dataset.id);
    });
    this.on('activeTabChange', (e) => {
      const tab = e.detail.tab;
      this.workspace.selectView(tab.dataset.id);
    });
  }

  /**
   * Events (uses DOM events).
   */

  on(event, f) {
    on(this.el, event, f, false);
  }

  off(event, f) {
    off(this.el, event, f, false);
  }

  emit(event, data) {
    this.el.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  registerEvents() {
    on(window, 'resize', (e) => this.layoutTabs(), false);

    on(this.el, 'click', ({ target }) => {
      if (target.classList.contains('xi-tab-close')) {
        this.removeTab(target.parentNode);
      }
    });

    on(this.el, 'mousedown', ({ target }) => {
      if (target.classList.contains('xi-tab') ||
          target.classList.contains('xi-tab-content') ||
          target.classList.contains('xi-tab-icon')) {
        this.setCurrentTab(target);
      }
    }, false);
  }

  /**
   * Tab helpers.
   */

  tabs() {
    return this.el.querySelectorAll('.xi-tab');
  }

  tabWidth() {
    const tabsContentWidth = this.contentEl.clientWidth - this.tabOverlapDistance;
    const width = (tabsContentWidth / this.tabs.length) + this.tabOverlapDistance;
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
    const tabWidth = this.tabWidth(),
          effectiveWidth = this.tabEffectiveWidth();

    this.cleanUpPreviouslyDraggedTabs();
    for (const tab of this.tabs()) tab.style.width = `${tabWidth}px`;

    requestAnimationFrame(() => {
      let styleHTML = '';
      this.tabPositions().forEach((left, i) => {
        styleHTML += `
          .xi-tabs-content .xi-tab:nth-child(${i+1})  {
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

      if (tab.classList.contains('xi-tab-current')) {
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

            this.setCurrentTab(tab);
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
        const destinationIndex = clamp(Math.floor((currentPosX + (effectiveWidth / 2)) / effectiveWidth), 0, tabs.length);

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

  setCurrentTab(tab) {
    const currentTab = this.el.querySelector('.xi-tab-current');
    if (currentTab) currentTab.classList.remove('xi-tab-current');
    tab.classList.add('xi-tab-current');
    this.fixZIndices();
    this.emit('activeTabChange', { tab });
  }

  /**
   * External methods.
   */

  createTab() {
    const svg = el('div');
    svg.innerHTML = svgBackground;

    const bg = el('div', [svg.firstElementChild], 'xi-tab-background');
    const icon = el('div', null, 'xi-tab-icon');
    const title = el('div', null, 'xi-tab-title');
    const close = el('div', null, 'xi-tab-close');
    return el('div', [bg, icon, title, close], 'xi-tab');
  }

  addTab(data) {
    const tab = this.createTab();

    tab.classList.add('xi-tab-just-added');
    setTimeout(() => tab.classList.remove('xi-tab-just-added'), 500);

    this.contentEl.appendChild(tab);
    this.updateTab(tab, Object.assign({}, { title: '', icon: '' }, data));
    this.emit('tabAdd', { tab });
    this.setCurrentTab(tab);
    this.layoutTabs();
    this.fixZIndices();
    this.registerDragEvents();
  }

  removeTab(tab) {
    if (tab.classList.contains('xi-tab-current')) {
      if (tab.previousElementSibling) {
        this.setCurrentTab(tab.previousElementSibling);
      } else if (tab.nextElementSibling) {
        this.setCurrentTab(tab.nextElementSibling);
      }
    }
    // TODO: move and then remove - for animation
    tab.parentNode.removeChild(tab);
    this.emit('tabRemove', { tab });
    this.layoutTabs();
    this.fixZIndices();
    this.registerDragEvents();
  }

  updateTab(tab, data) {
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













  // TODO: ensure ordered ?
  // update(activeView) {
  //   for (const id in this.workspace.views) {
  //     const view = this.workspace.views[id];

  //     let tab = this.getTabForView(view);
  //     if (!tab) {
  //       tab = this.createTab(view);
  //     }
  //     if (view == activeView) {
  //       tab.classList.add('active');
  //     } else {
  //       tab.classList.remove('active');
  //     }
  //   }
  // }

  // getTabForView(view) {
  //   return this.tabs.querySelector(`[data-view-id=${view.id}]`);
  // }

  // onclick(e) {
  //   const tab = e.target;
  //   this.workspace.selectView(tab.dataset.viewId);
  // }

  // createTab(view) {
  //   const tab = el('div', view.id, 'xi-tab');
  //   tab.setAttribute('data-view-id', view.id);
  //   on(tab, 'click', this.onclick, false);
  //   return this.tabs.appendChild(tab);
  // }
}
