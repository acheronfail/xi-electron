export function elt(
  tag: string,
  content?: string | HTMLElement[] | null,
  className?: string | null,
  cssText?: string
): HTMLElement {
  const e = document.createElement(tag);
  if (className) { e.className = className; }
  if (cssText) { e.style.cssText = cssText; }
  if (typeof content === 'string') {
    e.appendChild(document.createTextNode(content));
  } else if (Array.isArray(content)) {
    for (let i = 0; i < content.length; ++i) {
      e.appendChild(content[i]);
    }
  }
  return e;
}

export type ListenerOptions = {
  capture: boolean,
  passive: boolean
} | boolean;

export function on(
  el: HTMLElement,
  event: string,
  listener: (...args: any[]) => void,
  opts: ListenerOptions = false
): void {
  el.addEventListener(event, listener, opts);
}

export function off(
  el: HTMLElement,
  event: string,
  listener: (...args: any[]) => void,
  opts: ListenerOptions = false
): void {
  el.removeEventListener(event, listener, opts);
}

export function removeChildren(el: HTMLElement): HTMLElement {
  while (el.firstChild) { el.removeChild(el.firstChild); }
  return el;
}

export function removeChildrenAndAdd(parent: HTMLElement, el: HTMLElement | HTMLElement[]): HTMLElement {
  if (Array.isArray(el)) {
    removeChildren(parent);
    el.forEach((e) => parent.appendChild(e));
    return parent;
  } else {
    return removeChildren(parent).appendChild(el);
  }
}
