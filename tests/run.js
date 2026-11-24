/* Point d'entrée des tests (jsc). Charge le cœur, les capsules, le faux DOM, l'appli, puis les suites. */
load("tests/harness.js");
load("core.js");
load("capsules.js");
load("tests/dom-stub.js");
load("o1-exam.js");
load("app.js");
function readJSON(path) { try { const t = readFile(path); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
const PACK_PRIVE = readJSON("cours-prive/pack.json");
const PACK_EXEMPLE = readJSON("pack-exemple.json");
const PACK = PACK_PRIVE || PACK_EXEMPLE;
print("Pack testé : " + (PACK_PRIVE ? "cours-prive/pack.json (privé)" : PACK_EXEMPLE ? "pack-exemple.json" : "aucun"));
load("tests/core.test.js");
load("tests/pack.test.js");
load("tests/app.test.js");
const fails = report();
quit(fails ? 1 : 0);
