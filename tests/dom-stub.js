/* Faux DOM minimal pour exécuter app.js dans jsc. Les vues produisent du HTML sous forme de texte :
   on vérifie ce texte, pas le rendu. */
(function (g) {
  const noop = () => {};
  function el(tag) {
    const e = { tagName: tag || "div", innerHTML: "", textContent: "", hidden: false, disabled: false, value: "", checked: false, dataset: {}, style: {}, className: "", files: null,
      classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
      addEventListener: noop, removeEventListener: noop, appendChild: noop, remove: noop, click: noop, select: noop, focus: noop, setAttribute: noop, removeAttribute: noop,
      querySelector: () => el(), querySelectorAll: () => [], closest: () => null };
    return e;
  }
  const store = {};
  g.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, clear: () => { Object.keys(store).forEach(k => delete store[k]); } };
  g.document = { body: Object.assign(el("body"), { classList: { add: noop, remove: noop, toggle: noop, contains: () => false } }), documentElement: el("html"),
    querySelector: () => el(), querySelectorAll: () => [], createElement: tag => el(tag), addEventListener: noop, visibilityState: "visible" };
  g.window = g;
  g.navigator = { userAgent: "jsc", platform: "jsc", maxTouchPoints: 0, standalone: false, clipboard: { writeText: () => Promise.resolve() } };
  g.location = { hash: "", protocol: "file:", origin: "null" };
  g.matchMedia = () => ({ matches: false, addEventListener: noop });
  g.requestAnimationFrame = f => { f(); return 0; };
  g.setTimeout = () => 0; g.clearTimeout = noop; g.setInterval = () => 0; g.clearInterval = noop;
  g.addEventListener = noop;
  g.FileReader = function () { this.readAsText = () => { this.result = ""; if (this.onload) this.onload(); }; };
  g.Blob = function (parts) { this.size = parts.join("").length; };
  g.URL = { createObjectURL: () => "blob:x", revokeObjectURL: noop };
  g.AudioContext = undefined;
  g.scrollTo = noop;
  g.Date.prototype.toLocaleDateString = function () { return "jour test"; };
})(globalThis);
