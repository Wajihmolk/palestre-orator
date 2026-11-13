/* Mini harnais de tests pour jsc : test(nom, fn), eq(a, b, msg), ok(x, msg), throws(fn). */
const T = { n: 0, fail: 0, out: [] };
function test(name, fn) { T.n++; try { fn(); T.out.push("  ✓ " + name); } catch (e) { T.fail++; T.out.push("  ✗ " + name + "\n      " + (e && e.message ? e.message : e)); } }
function ok(x, msg) { if (!x) throw new Error(msg || "attendu vrai, reçu " + JSON.stringify(x)); }
function eq(a, b, msg) { const ja = JSON.stringify(a), jb = JSON.stringify(b); if (ja !== jb) throw new Error((msg ? msg + " : " : "") + "attendu " + jb + ", reçu " + ja); }
function throws(fn, msg) { let t = false; try { fn(); } catch (e) { t = true; } if (!t) throw new Error(msg || "exception attendue"); }
function section(name) { T.out.push("\n" + name); }
// Un HTML produit par une vue ne doit contenir aucune trace de valeur manquante.
function sane(html, where) {
  ok(typeof html === "string" && html.length > 20, where + " : HTML vide");
  ["undefined", "NaN", "[object Object]", "null</", ">null<", "function ("].forEach(bad => { if (html.includes(bad)) throw new Error(where + " contient « " + bad + " » : " + html.slice(Math.max(0, html.indexOf(bad) - 80), html.indexOf(bad) + 40)); });
  const open = (html.match(/<(div|section|ul|ol|li|p|button|details|summary|blockquote|label|h[1-3]|span|b|i|textarea|select|option|svg|g)\b/g) || []).length;
  const close = (html.match(/<\/(div|section|ul|ol|li|p|button|details|summary|blockquote|label|h[1-3]|span|b|i|textarea|select|option|svg|g)>/g) || []).length;
  if (open !== close) throw new Error(where + " : balises ouvertes " + open + " ≠ fermées " + close);
}
function report() {
  print(T.out.join("\n"));
  print("\n" + (T.n - T.fail) + " / " + T.n + " tests réussis" + (T.fail ? " — " + T.fail + " ÉCHEC(S)" : ""));
  return T.fail;
}
