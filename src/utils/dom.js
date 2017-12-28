// @flow

export function elt(tag: string, content?: any, className?: string, cssText?: string): any {
  const e = document.createElement(tag);
  if (className) e.className = className
  if (cssText) e.style.cssText = cssText;
  if (typeof content === 'string') e.appendChild(document.createTextNode(content));
  else if (Array.isArray(content)) {
    for (let i = 0; i < content.length; ++i) e.appendChild(content[i]);
  }
  return e;
}

export function on(el: any, event: string, listener: () => mixed, opts: any = false) {
  el.addEventListener(event, listener, opts);
}

export function off(el: any, event: string, listener: () => mixed, opts: any = false) {
  el.removeEventListener(event, listener, opts);
}

export function removeChildren(el: any) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function removeChildrenAndAdd(parent: any, el: any) {
  return removeChildren(parent).appendChild(el);
}
