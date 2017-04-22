
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function el(tag, content, cls, style) {
  const e = document.createElement(tag);
  if (Array.isArray(content)) {
    content.forEach((item) => e.appendChild(item));
  } else if (typeof content == 'string') {
    e.appendChild(document.createTextNode(content));
  }
  if (Array.isArray(cls)) {
    cls.forEach((c) => e.classList.add(c));
  } else if (cls) {
    e.className = cls;
  }
  if (style) {
    e.style.cssText = style;
  }
  return e;
}

export function on(el, ev, f, opts) {
  if (Array.isArray(ev)) {
    ev.forEach((e) => on(el, e, f, opts));
  } else {
    el.addEventListener(ev, f, opts);
  }
}

export function off(el, ev, f, opts) {
  if (Array.isArray(ev)) {
    ev.forEach((e) => off(el, e, f, opts));
  } else {
    el.removeEventListener(ev, f, opts);
  }
}

export function removeChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
  return el;
}

export function removeChildrenAndAdd(parent, el) {
  return removeChildren(parent).appendChild(el);
}

