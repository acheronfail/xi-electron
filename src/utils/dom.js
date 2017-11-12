
export function elt(tag, content, className, cssText) {
  const e = document.createElement(tag);
  if (className) e.className = className
  if (cssText) e.style.cssText = cssText;
  if (typeof content === 'string') e.appendChild(document.createTextNode(content));
  else if (Array.isArray(content)) {
    for (let i = 0; i < content.length; ++i) e.appendChild(content[i]);
  }
  return e;
}

export function on(elt, event, listener, opts = false) {
  elt.addEventListener(event, listener, opts);
}

export function off(elt, event, listener, opts = false) {
  elt.removeEventListener(event, listener, opts);
}

export function removeChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function removeChildrenAndAdd(parent, el) {
  return removeChildren(parent).appendChild(el);
}
