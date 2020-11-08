// 04bcb59 added an autoWidth setting to the Popup options.
// This option, when disabled, will mask the whole section for computing
// the width for the popup automatically within the _updateLayout method.
// https://github.com/panodata/grafana-map-panel/issues/79#issuecomment-723290476
import { Popup } from './leaflet';

// @option autoWidth: Boolean = true
// Set it to `false` if you don't want to compute
// and set the width of a opened popup automatically.
Popup.prototype.options.autoWidth = true;

Popup.prototype._updateLayout = function() {
  var container = this._contentNode,
    style = container.style;

  if (this.options.autoWidth) {
    style.width = '';
    style.whiteSpace = 'nowrap';

    var width = container.offsetWidth;
    width = Math.min(width, this.options.maxWidth);
    width = Math.max(width, this.options.minWidth);

    style.width = width + 1 + 'px';
    style.whiteSpace = '';
  }

  style.height = '';

  var height = container.offsetHeight,
    maxHeight = this.options.maxHeight,
    scrolledClass = 'leaflet-popup-scrolled';

  if (maxHeight && height > maxHeight) {
    style.height = maxHeight + 'px';
    addClass(container, scrolledClass);
  } else {
    removeClass(container, scrolledClass);
  }

  this._containerWidth = this._container.offsetWidth;
};

// Have to include these helper functions...

// @function hasClass(el: HTMLElement, name: String): Boolean
// Returns `true` if the element's class attribute contains `name`.
function hasClass(el, name) {
  if (el.classList !== undefined) {
    return el.classList.contains(name);
  }
  var className = getClass(el);
  return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
}

// @function addClass(el: HTMLElement, name: String)
// Adds `name` to the element's class attribute.
function addClass(el, name) {
  if (el.classList !== undefined) {
    var classes = splitWords(name);
    for (var i = 0, len = classes.length; i < len; i++) {
      el.classList.add(classes[i]);
    }
  } else if (!hasClass(el, name)) {
    var className = getClass(el);
    setClass(el, (className ? className + ' ' : '') + name);
  }
}

// @function removeClass(el: HTMLElement, name: String)
// Removes `name` from the element's class attribute.
function removeClass(el, name) {
  if (el.classList !== undefined) {
    el.classList.remove(name);
  } else {
    setClass(el, trim((' ' + getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
  }
}

// @function setClass(el: HTMLElement, name: String)
// Sets the element's class.
function setClass(el, name) {
  if (el.className.baseVal === undefined) {
    el.className = name;
  } else {
    // in case of SVG element
    el.className.baseVal = name;
  }
}

// @function getClass(el: HTMLElement): String
// Returns the element's class.
function getClass(el) {
  return el.className.baseVal === undefined ? el.className : el.className.baseVal;
}

// @function trim(str: String): String
// Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

// @function splitWords(str: String): String[]
// Trims and splits the string on whitespace and returns the array of parts.
function splitWords(str) {
  return trim(str).split(/\s+/);
}
