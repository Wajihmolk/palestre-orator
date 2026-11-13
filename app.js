/* Palestre Orator V2 — interface. Dépend de core.js (logique pure) et capsules.js (dessins).
   Le contenu des cours vient d'un pack privé importé par l'utilisateur et stocké sur l'appareil. */
"use strict";
(function () {
  const U = Core.util;
  const { esc, rnd, pick, shuffle, uniq, dayNum, dayKey, dayFromKey, fmtDate, fr, q25, mmss, plural, words, isMulti, newId } = U;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TODAY = () => dayNum();

  /* ================= Stockage ================= */
  const KEY = "palestre.orator.v2", KEY_V1 = "palestre.orator.v1", KEY_PACK = "palestre.pack";
  let storageOK = true, migrated = false;
  function readLS(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function writeLS(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); storageOK = true; return true; } catch (e) { storageOK = false; return false; } }
  let S = (function () {
    const v2 = readLS(KEY);
    if (v2) return Core.state.adopt(v2);
    const v1 = readLS(KEY_V1);
    if (v1 && Core.state.looksLikeState(v1)) { migrated = true; return Core.state.adopt(v1); }
    return Core.state.fresh();
  })();
  let PRAW = readLS(KEY_PACK);
  let P = Core.pack.normalize(PRAW);
  const UI = { tab: "aujourdhui", wall: "r", mod: 1, app: "capsules", cours: "", carnet: "textes", star: false, cap: null, capK: 0, capPlay: false };
  const has = k => Array.isArray(P[k]) && P[k].length > 0;
  function save() { S.updatedAt = Date.now(); writeLS(KEY, S); }
  function setPack(raw) { PRAW = raw; P = Core.pack.normalize(raw); writeLS(KEY_PACK, raw); }

  /* ================= Préférences d'affichage ================= */
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const noAnim = () => S.settings.anim === "off" || mq.matches;
  function applyPrefs() {
    document.body.classList.toggle("no-anim", noAnim());
    const t = S.settings.theme;
    if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
  }

  /* ================= Retours : son et lumière (pas de vibration sur iOS) ================= */
  let AC = null;
  function beep(kind) {
    if (!S.settings.son) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = AC.currentTime, notes = kind === "ok" ? [[660, 0, .09], [880, .09, .14]] : kind === "ko" ? [[220, 0, .18]] : kind === "end" ? [[523, 0, .12], [659, .13, .12], [784, .26, .22]] : [[440, 0, .06]];
      notes.forEach(([f, d, l]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(0.18, t0 + d + .01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + l); o.connect(g).connect(AC.destination); o.start(t0 + d); o.stop(t0 + d + l + .02); });
    } catch (e) { /* silencieux */ }
  }
  let flashT = null;
  function flash(kind) { const el = $("#flash"); if (!el) return; el.className = kind; clearTimeout(flashT); flashT = setTimeout(() => { el.className = ""; }, 420); }
  const feedback = ok => { beep(ok ? "ok" : "ko"); flash(ok ? "ok" : "ko"); };

  /* ================= Accès au pack ================= */
  const cardOf = id => P.fiches.find(c => c.id === id);
  const textOf = id => P.textes.find(t => t.id === id);
  const breveOf = id => P.breves.find(b => b.id === id);
  const qcmOf = id => P.qcm.find(q => q.id === id);
  const MODULES = () => P.modules;
  const PARTIES = () => P.parties, CRITERES = () => P.criteres, CATEGORIES = () => P.categories;
  const FAUTES_CHOIX = ["Conforme", "Le « je »", "Commentaire de méthode"];
  const SRC_NOM = { marianne: "Marianne", canard: "Le Canard enchaîné", charlie: "Charlie Hebdo" };
  function examDay(m) { const d = S.settings.dates[m]; return d ? dayFromKey(d) : null; }
  const examDays = () => { const o = {}; [1, 2, 3, 4].forEach(m => { const e = examDay(m); if (e != null) o[m] = e; }); return o; };
  const cardState = id => S.cards[id] || { b: 0, due: 0, n: 0 };
  const dueCards = mod => Core.srs.dueCards(P.fiches, S.cards, TODAY(), mod);
  const pickCards = (n, mod) => Core.srs.pickCards(P.fiches, S.cards, n, TODAY(), examDays(), mod);
  const mastery = m => Core.srs.mastery(P.fiches, S.cards, m);
  const streak = () => Core.streak(S.days, TODAY());
  const LEVELS = Core.srs.LEVELS, level = Core.srs.level;
  const lintHtml = l => (l && l.length ? '<ul class="lint">' + l.map(x => '<li class="' + x.k + '">' + esc(x.m) + "</li>").join("") + "</ul>" : "");

  /* ================= Sprints ================= */
  function mk(q, sub, correct, pool, n) {
    const others = shuffle(uniq(pool).filter(x => x !== correct)).slice(0, (n || 4) - 1);
    const choices = shuffle([correct, ...others]);
    return { q, sub, choices, a: choices.indexOf(correct) };
  }
  const DRILLS = {
    ethos: { nom: "Èthos athénien", mod: 2, ok: () => P.ethos.length === 8, gen() {
      const E = P.ethos, k = rnd(4), e = pick(E), noms = E.map(x => x.fr);
      if (k === 0) return mk("<i>" + esc(pick(e.gr.split(" / "))) + "</i>", "Quelle qualité ?", e.fr, noms);
      if (k === 1) return mk(esc(e.def), "Quelle qualité ?", e.fr, noms);
      if (k === 2) return { q: esc(e.fr), sub: "À Athènes, cette qualité est…", choices: ["Valorisée", "Dévalorisée"], a: e.val ? 0 : 1 };
      return mk(esc(e.fr), "Quel est son contraire dans le tableau ?", E[e.opp].fr, E.filter(x => x.val !== e.val).map(x => x.fr));
    } },
    genres: { nom: "Genres et lieux", mod: 2, ok: () => has("genres") && has("lieux"), gen() {
      if (rnd(2)) { const g = pick(P.genres), ch = uniq(P.genres.map(x => x[1])); return { q: esc(g[0]), sub: "Quel genre ?", choices: ch, a: ch.indexOf(g[1]) }; }
      const l = pick(P.lieux), ch = uniq(P.lieux.map(x => x[1]));
      return { q: esc(l[0]), sub: "Quel type de lieu chez Aristote ?", choices: ch, a: ch.indexOf(l[1]) };
    } },
    fautes: { nom: "Repère la faute", mod: 3, ok: () => has("fautes"), gen() { const f = pick(P.fautes); return { q: esc(f.t), sub: "Règles de rédaction d'Orator 3", choices: FAUTES_CHOIX, a: f.a }; } },
    chries: { nom: "Chrie ou fausse chrie", mod: 4, ok: () => has("enonces"), gen() { const e = pick(P.enonces); return { q: esc(e.t), sub: "", choices: ["Chrie", "Fausse chrie"], a: e.r < 0 ? 0 : 1, why: e.why }; } },
    titres: { nom: "Pistes de titres", mod: 4, ok: () => has("titres"), gen() { const t = pick(P.titres); return { q: "« " + esc(t[0]) + " »", sub: t[2] ? "Sujet : " + t[2] : "Quelle piste de titre ?", choices: CATEGORIES().map(c => c.c), a: t[1] }; } },
    termes: { nom: "Grec et latin", mod: 0, ok: () => has("termes"), gen() {
      const t = pick(P.termes);
      return rnd(2) ? mk("<i>" + esc(t[0]) + "</i>", "Que désigne ce terme ?", t[1], P.termes.map(x => x[1])) : mk(esc(t[1]), "Quel est le terme ?", t[0], P.termes.map(x => x[0]));
    } },
    qui: { nom: "Qui ?", mod: 1, ok: () => has("qui"), gen() { const x = pick(P.qui); return mk(esc(x[0]), "Qui ?", x[1], P.qui.map(y => y[1])); } },
    qcm: { nom: "QCM éclair", mod: 1, ok: () => has("qcm"), gen() { const q = pick(P.qcm.filter(x => !Array.isArray(x.a))); if (!q) return { q: "Aucune question à réponse unique.", choices: ["Continuer"], a: 0 }; return { q: esc(q.q), sub: q.cours ? "Cours " + q.cours.replace(/^c/, "") : "", choices: q.choix, a: q.a, why: q.why, id: q.id }; } }
  };
  const drillList = () => Object.keys(DRILLS).filter(k => DRILLS[k].ok());

  /* ================= Fabrique d'ateliers ================= */
  const gk = (mode, p, c) => mode + p + "_" + c;
  const SUJETS = () => uniq(P.titres.filter(t => t[2]).map(t => t[2]));
  const textesFaits = () => P.textes.filter(t => Array.isArray(t.faits) && t.faits.length);
  function mkArg(o) {
    o = o || {};
    const pool = textesFaits(); if (!pool.length) return null;
    const tx = o.tx ? textOf(o.tx) : pick(pool);
    const mode = o.mode || (Math.random() < 0.65 ? "r" : "c");
    let p = o.p, c = o.c;
    if (p == null || c == null) {
      const cells = [];
      for (let i = 0; i < PARTIES().length; i++) for (let j = 0; j < CRITERES().length; j++) cells.push([i, j, S.grid[gk(mode, i, j)] || 0]);
      const min = Math.min(...cells.map(x => x[2])), ch = pick(cells.filter(x => x[2] === min));
      p = ch[0]; c = ch[1];
    }
    return { type: "write", kind: "arg", tx: tx.id, mode, p, c, fait: rnd(tx.faits.length) };
  }
  function mkTitre() {
    const mine = S.texts.filter(t => t.kind !== "note"), suj = SUJETS();
    if (mine.length && (Math.random() < 0.5 || !suj.length)) return { type: "write", kind: "titre", src: { text: pick(mine).text, cours: false, known: [] }, cat: rnd(6) };
    if (!suj.length) return null;
    const sujet = pick(suj), known = P.titres.filter(t => t[2] === sujet), used = known.map(t => t[1]);
    const free = [0, 1, 2, 3, 4, 5].filter(i => !used.includes(i));
    return { type: "write", kind: "titre", src: { text: sujet, cours: true, known: known.map(t => t[0]) }, cat: pick(free.length ? free : [0, 1, 2, 3, 4, 5]) };
  }
  const mkBrique = (aff, role, b, pts) => (has("affaires") && has("briques") ? { type: "write", kind: "brique", aff: aff || pick(P.affaires).id, role: role == null ? rnd(2) : role, b: b || pick(P.briques).id, x: rnd(4), pts } : null);
  const mkRecon = () => (has("chries") ? { type: "write", kind: "recon", ch: rnd(P.chries.length) } : null);
  function mkBreve(src, cat) {
    const b = Core.plan.pickBreves(P.breves, S.breves, 1, src)[0];
    return b ? { type: "breve", id: b.id, cat: cat == null ? null : cat } : null;
  }
  function mkTrois(o) {
    o = o || {};
    const pool = P.textes.filter(t => Array.isArray(t.texte) && t.texte.length) ; if (!pool.length && !textesFaits().length) return null;
    const tx = o.tx ? textOf(o.tx) : pick(pool.length ? pool : textesFaits());
    const dev = P.devoirs && P.devoirs.o3 && P.devoirs.o3.texte === tx.id ? P.devoirs.o3 : null;
    return { type: "trois", tx: tx.id, mode: o.mode || null, cadre: S.settings.o3cadre, pts: o.pts || 20, modele: !!dev };
  }
  function pickEnonces(n) {
    const vraies = shuffle(P.enonces.filter(e => e.r < 0)), fausses = shuffle(P.enonces.filter(e => e.r >= 0));
    const nv = Math.min(vraies.length, n > 2 ? 1 + rnd(2) : rnd(2));
    return shuffle([...vraies.slice(0, nv), ...fausses.slice(0, n - nv)]);
  }
  function rewritable() {
    const kids = new Set(S.prods.map(p => p.parent).filter(Boolean)), lim = Date.now() - 3 * 864e5;
    return S.prods.filter(p => ["arg", "chrieday", "brique", "titre"].includes(p.kind) && p.src && p.t < lim && !kids.has(p.id)).sort((a, b) => a.score - b.score);
  }

  // Chaque atelier d'écriture décrit sa consigne, son relecteur et sa grille d'auto-évaluation.
  const SPEC = {
    arg(s) {
      const tx = textOf(s.tx), ref = s.mode === "r", crit = ref ? CRITERES()[s.c].neg : CRITERES()[s.c].pos, part = PARTIES()[s.p];
      if (!tx) return SPEC.missing("Texte introuvable dans le pack.");
      return {
        mod: 3, name: tx.titre + " · " + part.nom + " × " + crit, eyebrow: "Orator 3 · " + (ref ? "Réfutation" : "Confirmation"),
        title: ref ? "Ouvre l'espace du doute" : "Défends la vraisemblance du récit",
        html: '<p class="src">' + esc(tx.titre) + ", " + esc(tx.auteur || "") + "</p><blockquote>" + esc(tx.faits[s.fait]) + '</blockquote><div class="prise"><span>' + esc(part.nom) + " : " + esc(part.q) + "</span>×<span>" + esc(crit) + '</span></div><p class="hint">Un seul argument. Entre directement, sans « je », sans annoncer ta méthode ; cite le texte.</p>',
        secs: 300, lint: t => Core.lint.arg(t), reroll: "Autre prise",
        check: ["J'entre directement dans l'argument", "Aucun « je »", "Le critère est bien mobilisé : " + crit, "L'argument porte sur " + part.nom, "Le texte est cité", "Ni trop évident, ni tiré par les cheveux"]
      };
    },
    chrieday() {
      return {
        mod: 4, name: "Chrie du jour", eyebrow: "Orator 4 · Chrie à l'ancienne", title: "La chrie du jour",
        html: "<p>Pense à une parole ou une action remarquable, entendue ou lue récemment. Mets-la en chrie.</p><p class=\"hint\">Une seule phrase. Un personnage précis (A). Sa parole ou son action insigne (B). Aucun commentaire.</p>",
        secs: 180, rows: 4, lint: t => Core.lint.chrie(t), check: [...P.regles, "Équilibre : ni trop en dire, ni trop peu"]
      };
    },
    recon(s) {
      const c = P.chries[s.ch]; if (!c) return SPEC.missing("Chrie introuvable dans le pack.");
      return {
        mod: 4, name: "Reconstitution · " + (c.antique ? "chrie antique" : "débat présidentiel"), eyebrow: "Orator 4 · Reconstitution", title: "Refais la chrie du cours",
        html: '<p class="src">A, le contexte</p><p>' + esc(c.A) + '</p><p class="src">B, la parole</p><p>' + esc(c.B) + '</p><p class="hint">Condense A et B en une seule phrase équilibrée.</p>',
        secs: 120, rows: 4, lint: t => Core.lint.chrie(t), model: "<blockquote>" + esc(c.full) + "</blockquote>",
        check: ["Une seule phrase", "A et B sont tous deux présents", "Fidèle à la formulation du cours", "Aucun commentaire personnel"]
      };
    },
    titre(s) {
      const cat = CATEGORIES()[s.cat];
      return {
        mod: 4, name: "Titre · " + cat.c, eyebrow: "Orator 4 · Titre sous contrainte", title: "Trouve le titre",
        html: '<p class="src">' + (s.src.cours ? "Sujet noté dans ton cours" : "Ton texte") + "</p><blockquote>" + esc(s.src.text) + '</blockquote><div class="prise"><span>Piste ' + (s.cat + 1) + "</span>" + esc(cat.nom) + '</div><p class="hint">Un seul titre. Il met sur la piste sans reprendre les mots du texte ni gâcher la chute.</p>',
        secs: 120, rows: 2, lint: (t, st) => Core.lint.titre(t, st.src.cours ? "" : st.src.text), scale: "quarter", reroll: "Autre sujet",
        rubric: "Note ton titre de 0 à 1, comme à l'examen : piste subtile, pas de redondance, chute préservée.",
        model: s.src.known && s.src.known.length ? "<p>" + s.src.known.map(t => "« " + esc(t) + " »").join(", ") + "</p>" : ""
      };
    },
    brique(s) {
      const a = P.affaires.find(x => x.id === s.aff), b = P.briques.find(x => x.id === s.b);
      if (!a || !b) return SPEC.missing("Affaire ou brique introuvable dans le pack.");
      let consigne = b.consigne || "";
      if (s.b === "captatio" && P.captatio[s.x]) consigne = "Concilie-toi la bienveillance en parlant de : " + P.captatio[s.x].nom + ". " + P.captatio[s.x].aide;
      if (s.b === "ethos" && P.ethos.length === 8) { const v = P.ethos[s.x], d = P.ethos[v.opp]; consigne = "Peins ton èthos par " + v.fr.toLowerCase() + " (" + v.gr + ") et celui de l'adversaire par " + d.fr.toLowerCase() + " (" + d.gr + ")."; }
      return {
        mod: 2, name: a.nom + " · " + b.nom, eyebrow: "Orator 2 · " + b.nom + (s.pts != null ? " · " + s.pts + " points (repère)" : ""), title: a.roles[s.role],
        html: '<p class="src">' + esc(a.nom) + "</p><blockquote>" + esc(a.resume) + "</blockquote><p>" + esc(consigne) + "</p>",
        secs: 300, rows: 8, lint: t => Core.lint.brique(t, s.b), check: b.check
      };
    },
    rewrite(s) {
      const p = S.prods.find(x => x.id === s.pid);
      if (!p || !SPEC[p.kind] || !p.src) return SPEC.missing("Ce texte a été supprimé.");
      const base = SPEC[p.kind](p.src);
      return Object.assign({}, base, {
        eyebrow: "Réécriture · " + base.eyebrow, title: "Fais mieux que la première fois", reroll: null, secs: 300,
        html: '<p class="src">Ta version du ' + fmtDate(p.t) + '</p><blockquote class="mine">' + esc(p.text) + "</blockquote>" + base.html
      });
    },
    q1() {
      const f = cardOf("o4-def"), dev = P.devoirs && P.devoirs.o4;
      return { mod: 4, name: "Q1 · Définition et fonction", eyebrow: "Question 1 · 3 points", title: "La chrie antique", html: "<p>Qu'est-ce qu'une « chrie », dans l'Antiquité gréco-romaine ? Quelle est sa fonction ?</p>", rows: 8,
        model: dev && dev.q1 ? "<p>" + esc(dev.q1) + "</p>" : "", check: f ? f.p : ["Exercice préparatoire et forme brève", "Une seule phrase", "Un personnage précis (A)", "Une parole ou une action insigne (B)", "Sans commentaire", "Visée le plus souvent morale"] };
    },
    q3(s) {
      const a = P.chries.find(c => c.id === s.antique), dev = P.devoirs && P.devoirs.o4;
      return {
        mod: 4, name: "Q3 · Comparaison", eyebrow: "Question 3 · 5 points", title: "Points communs et différences",
        html: '<p class="src">Texte 1 · chrie issue de l\'Antiquité</p><blockquote>' + esc(a ? a.full : "") + "</blockquote>" + s.modernes.map((m, i) => '<p class="src">Texte ' + (i + 2) + " · " + esc(m.label) + "</p><blockquote class=\"small\">" + (m.titre ? "<b>" + esc(m.titre) + "</b><br>" : "") + esc(m.text) + "</blockquote>").join("") + "<p>Quels sont les principaux points communs et les principales différences entre le texte 1 et les textes 2, 3 et 4 ? Renvoie aux textes par leur numéro.</p>",
        rows: 10, model: dev && dev.q3 ? "<p>" + esc(dev.q3) + "</p>" : "",
        check: ["Texte 1 : A (contexte, question) et B (réponse) en une seule phrase, portée morale", "Texte 2 : même forme A, B ; mais un art de la pointe, sans portée morale", "Texte 3 : A, B puis un commentaire C orienté, satirique", "Texte 4 : comme le 3, avec un titre T qui prépare la lecture", "Le format binaire antique est étoffé pour la satire de l'actualité"]
      };
    },
    missing(msg) { return { mod: 0, name: "Atelier", eyebrow: "Atelier", title: "Contenu indisponible", html: "<p>" + esc(msg) + "</p>", check: ["Passer"] }; }
  };
  const KINDS = { arg: "Arguments", chrieday: "Chries", recon: "Chries", titre: "Titres", brique: "Discours", q1: "Examens", q3: "Examens", trois: "Trois arguments", breve: "Brèves titrées" };

  function saveProd(s, text, ratio, extra) {
    let kind = s.kind, src = s, parent = null;
    if (s.kind === "rewrite") { const p = S.prods.find(x => x.id === s.pid); if (!p) return; kind = p.kind; src = p.src; parent = p.id; }
    const sp = SPEC[kind] ? SPEC[kind](src) : { mod: 0, name: kind };
    S.prods.unshift(Object.assign({ id: newId("p"), t: Date.now(), kind, mod: sp.mod, title: sp.name, text, score: Math.round(ratio * 100) / 100, src: JSON.parse(JSON.stringify(src)), parent }, extra || {}));
    if (S.prods.length > 400) S.prods.length = 400;
    if (kind === "arg") S.grid[gk(src.mode, src.p, src.c)] = (S.grid[gk(src.mode, src.p, src.c)] || 0) + 1;
    S.lastAt[s.kind] = Date.now();
  }

  /* ================= Capsules ================= */
  const capOf = id => CAPSULES.find(c => c.id === id);
  let capTimer = null;
  function capAuto(on) {
    clearInterval(capTimer); capTimer = null; UI.capPlay = !!on;
    if (on && !noAnim()) capTimer = setInterval(() => { const cap = capOf(UI.cap); if (!cap) return capAuto(false); if (UI.capK < cap.scenes.length - 1) { UI.capK++; capRefresh(); } else capAuto(false), capRefresh(); }, 4600);
  }
  function playerHtml(cap, k) {
    const last = k >= cap.scenes.length - 1, sc = cap.scenes[k];
    return '<div class="player" data-cap="' + cap.id + '"><div class="stage">' + cap.svg + '</div><div class="legend-box"><p id="cap-t">' + esc(sc.t) + '</p><p class="hint" id="cap-n">' + esc(sc.n || "") + '</p></div><div class="dots" id="cap-dots">' + cap.scenes.map((_, i) => '<i class="' + (i === k ? "on" : i < k ? "d" : "") + '"></i>').join("") + '</div>' +
      '<div class="actions"><button class="btn ghost" data-act="cap-prev"' + (k === 0 ? " disabled" : "") + '>Précédent</button>' + (noAnim() ? "" : '<button class="btn quiet" data-act="cap-play" id="cap-play">' + (UI.capPlay ? "Pause" : "Lecture") + "</button>") + '<button class="btn primary" data-act="' + (last ? "cap-done" : "cap-next") + '">' + (last ? "Terminé" : "Suivant") + "</button></div></div>";
  }
  function capRefresh() {
    const cap = capOf(UI.cap), root = $(".player"); if (!cap || !root) return;
    const k = UI.capK;
    $$("[data-s]", root).forEach(el => { const from = +el.dataset.s, off = el.dataset.off != null ? +el.dataset.off : Infinity; el.classList.toggle("vis", k >= from && k < off); });
    const sc = cap.scenes[k]; $("#cap-t", root).textContent = sc.t; $("#cap-n", root).textContent = sc.n || "";
    $$("#cap-dots i", root).forEach((d, i) => { d.className = i === k ? "on" : i < k ? "d" : ""; });
    const prev = $('[data-act="cap-prev"]', root), nxt = $('[data-act="cap-next"],[data-act="cap-done"]', root), pl = $("#cap-play", root);
    if (prev) prev.disabled = k === 0;
    if (nxt) { const last = k >= cap.scenes.length - 1; nxt.dataset.act = last ? "cap-done" : "cap-next"; nxt.textContent = last ? "Terminé" : "Suivant"; }
    if (pl) pl.textContent = UI.capPlay ? "Pause" : "Lecture";
    S.caps[cap.id] = Object.assign({}, S.caps[cap.id], { seen: Math.max((S.caps[cap.id] || {}).seen || 0, k + 1) });
  }
  function capMount() { requestAnimationFrame(() => requestAnimationFrame(capRefresh)); }
  function capDone() {
    const cap = capOf(UI.cap); if (!cap) return;
    S.caps[cap.id] = { seen: cap.scenes.length, done: (S.caps[cap.id] || {}).done || TODAY() }; S.days[TODAY()] = (S.days[TODAY()] || 0) + 1; save();
    capAuto(false);
  }

  /* ================= Moteur de séance ================= */
  let R = null;
  const chk = (id, label) => '<label class="chk"><input type="checkbox" id="' + id + '"><span>' + esc(label) + "</span></label>";
  const quarter = name => '<div class="quarter" role="radiogroup">' + [0, 0.25, 0.5, 0.75, 1].map(v => '<label><input type="radio" name="' + name + '" id="' + name + "-" + v * 100 + '" value="' + v + '"><span>' + fr(v) + "</span></label>").join("") + "</div>";
  const qval = name => { const el = $('#r-body input[name="' + name + '"]:checked'); return el ? +el.value : null; };
  const letters = "ABCDEFGH";

  function startFlow(steps, opt) {
    steps = steps.filter(Boolean);
    if (!steps.length) return toast("Rien à lancer : importe d'abord ton pack de cours.");
    R = { steps, i: 0, res: [], opt: opt || {}, st: {} };
    if (R.opt.minutes) R.deadline = Date.now() + R.opt.minutes * 60000;
    document.body.classList.add("running");
    $("#runner").hidden = false;
    stepEnter();
  }
  function stepEnter() {
    const s = R.steps[R.i];
    R.st = { phase: 0, t0: Date.now() };
    if (STEP[s.type].enter) STEP[s.type].enter(s, R.st);
    drawRunner();
  }
  function drawRunner() {
    $("#r-prog").innerHTML = R.steps.map((_, i) => '<i class="' + (R.done || i < R.i ? "d" : i === R.i ? "c" : "") + '"></i>').join("");
    const body = $("#r-body");
    body.innerHTML = R.done ? summaryHtml() : STEP[R.steps[R.i].type].view(R.steps[R.i], R.st);
    body.scrollTop = 0;
    if (!R.done && R.steps[R.i].type === "capsule") capMount();
    tick();
  }
  function nextStep(result) {
    if (result) { R.res.push(Object.assign({ step: R.steps[R.i] }, result)); S.days[TODAY()] = (S.days[TODAY()] || 0) + 1; save(); }
    R.i++;
    if (R.i >= R.steps.length) finishFlow(); else stepEnter();
  }
  function finishFlow() {
    R.done = true;
    if (R.opt.ritual && R.res.length) S.ritualDay = TODAY();
    if (R.opt.exam) { R.total = examTotal(); S.exams.unshift({ t: Date.now(), mod: R.opt.exam, score: R.total }); S.exams.length = Math.min(S.exams.length, 60); }
    beep("end");
    save();
    drawRunner();
  }
  function closeFlow() { R = null; capAuto(false); document.body.classList.remove("running"); $("#runner").hidden = true; render(); }
  function examTotal() {
    if (R.opt.exam === 1) { const q = R.res.find(r => r.kind === "qcm"); return q ? q.note : 0; }
    return q25(R.res.reduce((a, r) => a + (r.pts || 0), 0));
  }
  function stepLabel(s) {
    if (s.type === "write") return SPEC[s.kind](s).name;
    if (s.type === "faux") return "Q2 · Chries et fausses chries";
    if (s.type === "titres") return s.label;
    if (s.type === "trois") return "Trois arguments";
    if (s.type === "qcm") return "QCM · " + s.items.length + " questions";
    if (s.type === "rate") return s.label;
    if (s.type === "card") { const c = cardOf(s.id); return c ? c.q : ""; }
    if (s.type === "breve") { const b = breveOf(s.id); return b ? "Brève · " + SRC_NOM[b.src] : "Brève"; }
    if (s.type === "capsule") { const c = capOf(s.id); return c ? "Capsule · " + c.titre : "Capsule"; }
    return "";
  }
  function summaryHtml() {
    const res = R.res, cards = res.filter(r => r.kind === "card"), sp = res.filter(r => r.kind === "sprint"), wr = res.filter(r => r.kind === "write" || r.kind === "breve");
    if (R.opt.exam) {
      const lines = R.steps.map(s => { const r = res.find(x => x.step === s); const max = s.pts != null ? s.pts : null; return "<li><span>" + esc(stepLabel(s)) + "</span><b>" + (R.opt.exam === 1 ? (r ? r.ok + " / " + r.n : "non traité") : (r ? fr(q25(r.pts || 0)) : "0") + (max != null ? " / " + max : "")) + "</b></li>"; }).join("");
      return '<p class="eyebrow">' + esc(R.opt.title) + '</p><div class="score">' + fr(R.total) + "<small> / 20</small></div>" +
        (R.opt.note ? '<p class="hint">' + esc(R.opt.note) + "</p>" : "") + '<ul class="recap">' + lines + '</ul><button class="btn primary" data-act="close">Terminer</button>';
    }
    const li = [];
    if (cards.length) li.push("<li><span>Rappels</span><b>" + cards.filter(c => c.ratio >= 0.85).length + " sur " + cards.length + " consolidés</b></li>");
    sp.forEach(r => li.push("<li><span>Sprint · " + esc(DRILLS[r.step.drill].nom) + "</span><b>" + r.ok + " sur " + r.n + "</b></li>"));
    res.filter(r => r.kind === "qcm").forEach(r => li.push("<li><span>QCM</span><b>" + r.ok + " sur " + r.n + "</b></li>"));
    if (wr.length) li.push("<li><span>" + plural(wr.length, "texte") + " dans ton carnet</span><b>" + Math.round(wr.reduce((a, r) => a + r.ratio, 0) / wr.length * 100) + " %</b></li>");
    res.filter(r => r.kind === "faux").forEach(r => li.push("<li><span>Chries et fausses chries</span><b>" + Math.round(r.ratio * 100) + " %</b></li>"));
    res.filter(r => r.kind === "trois").forEach(r => li.push("<li><span>Trois arguments</span><b>" + fr(r.pts) + " / 20</b></li>"));
    res.filter(r => r.kind === "capsule").forEach(r => li.push("<li><span>" + esc(stepLabel(r.step)) + "</span><b>vue</b></li>"));
    const m = S.mission && S.mission.day === TODAY() ? P.missions[S.mission.idx] : null;
    return '<p class="eyebrow">' + (R.opt.ritual ? "Rituel accompli" : "Atelier terminé") + "</p><h2>" + (res.length ? "Séance terminée." : "Rien d'enregistré cette fois.") + "</h2>" +
      (li.length ? '<ul class="recap">' + li.join("") + "</ul>" : "") +
      (m ? '<div class="model"><p class="eyebrow">Ta mission d\'ici demain</p><p>' + esc(m) + "</p></div>" : "") +
      '<p class="hint">Chaîne : ' + plural(streak(), "jour") + '.</p><button class="btn primary" data-act="close">Terminer</button>';
  }

  // Corrigé d'une brève : titre paru et propositions du cours, rangées par piste.
  function corrigeHtml(b) {
    let h = "";
    if (b.titre) h += '<p><span class="src">Titre paru dans ' + esc(SRC_NOM[b.src]) + " : </span><span class=\"paru\">" + esc(b.titre) + "</span></p>";
    if (b.corrige && b.corrige.length) {
      const byCat = {}; b.corrige.forEach(c => (byCat[c.cat] = byCat[c.cat] || []).push(c));
      h += '<div class="corr">' + Object.keys(byCat).sort().map(k => '<div class="cat"><b>' + k + " · " + esc(CATEGORIES()[k - 1].c) + "</b><div>" + byCat[k].map(c => "<span>" + esc(c.t) + (c.note ? " <small>(" + esc(c.note) + ")</small>" : "") + "</span>").join("") + "</div></div>").join("") + "</div>";
      if (b.commentaire) h += '<p class="hint">' + esc(b.commentaire) + "</p>";
    } else if (!b.titre) h += '<p class="hint">Pas de corrigé pour ce texte dans ton cours : juge ton titre aux trois critères.</p>';
    return h ? '<div class="model"><p class="eyebrow">Dans ton cours</p>' + h + "</div>" : "";
  }
  const titreCritere = "Piste subtile sans redondance avec les mots du texte, chute préservée, bref.";

  const STEP = {
    card: {
      view(s, st) {
        const c = cardOf(s.id); if (!c) return "<p>Fiche introuvable.</p><button class=\"btn ghost\" data-act=\"skip\">Passer</button>";
        const cs = cardState(c.id);
        if (st.phase === 0) return '<p class="eyebrow">Rappel · ' + MODULES()[c.m].nom + " · " + LEVELS[level(cs.b)] + '</p><h2 class="q">' + esc(c.q) + '</h2><textarea id="c-text" rows="5" placeholder="Écris ta réponse de mémoire, ou dis-la à voix haute.">' + esc(st.text || "") + '</textarea><div class="actions"><button class="btn primary" data-act="card-show">Voir les éléments attendus</button></div>';
        return '<p class="eyebrow">Corrige-toi</p><h2 class="q">' + esc(c.q) + "</h2>" + (st.text ? '<blockquote class="mine">' + esc(st.text) + "</blockquote>" : "") + '<p class="hint">Coche chaque élément que tu avais restitué.</p><div class="checks">' + c.p.map((p, i) => chk("cp" + i, p)).join("") + "</div>" + (c.src ? '<p class="hint">Source : ' + esc(c.src) + "</p>" : "") + '<div class="actions"><button class="btn primary" data-act="card-ok">Valider</button></div>';
      }
    },
    sprint: {
      enter(s, st) { st.limit = 60; st.hard = true; st.ok = 0; st.n = 0; st.q = DRILLS[s.drill].gen(); st.fb = null; },
      view(s, st) {
        const d = DRILLS[s.drill];
        if (st.phase === 1) return '<p class="eyebrow">Sprint · ' + esc(d.nom) + '</p><div class="score">' + st.ok + "<small> sur " + st.n + "</small></div><p>" + (st.record ? "Nouveau record." : "Ton record : " + ((S.drills[s.drill] || {}).best || 0) + ".") + '</p><div class="actions"><button class="btn primary" data-act="sprint-next">Continuer</button></div>';
        const q = st.q;
        return '<p class="eyebrow">Sprint de 60 secondes · ' + esc(d.nom) + '</p><p class="count">' + plural(st.ok, "bonne réponse", "bonnes réponses") + '</p><div class="sq">' + q.q + '</div><p class="hint">' + esc(q.sub || "") + '</p><div class="choices' + (q.choices.length === 2 || q.choices.length === 6 ? " two" : "") + '">' +
          q.choices.map((c, i) => '<button class="choice ' + (st.fb ? (i === q.a ? "ok" : i === st.fb.i ? "ko" : "dim") : "") + '" data-act="ans" data-i="' + i + '"' + (st.fb ? " disabled" : "") + ">" + esc(c) + "</button>").join("") + "</div>" +
          (st.fb ? '<div class="fb">' + (q.why ? "<p>" + esc(q.why) + "</p>" : "") + '<button class="btn primary" data-act="sprint-go">Continuer</button></div>' : "");
      }
    },
    write: {
      enter(s, st) { st.limit = R.opt.exam ? null : SPEC[s.kind](s).secs || null; },
      view(s, st) {
        const sp = SPEC[s.kind](s);
        if (st.phase === 0) return '<p class="eyebrow">' + esc(sp.eyebrow) + "</p><h2>" + esc(sp.title) + '</h2><div class="prompt">' + sp.html + '</div><textarea id="w-text" rows="' + (sp.rows || 7) + '" placeholder="Écris ici.">' + esc(st.text || "") + '</textarea><div class="actions"><button class="btn primary" id="w-done" data-act="w-done"' + (st.text ? "" : " disabled") + ">J'ai terminé</button>" + (sp.reroll && !R.opt.exam ? '<button class="btn ghost" data-act="w-reroll">' + sp.reroll + "</button>" : "") + (R.steps.length > 1 ? '<button class="btn quiet" data-act="skip">Passer</button>' : "") + "</div>";
        return '<p class="eyebrow">Relecture</p><h2>' + esc(sp.title) + '</h2><blockquote class="mine">' + esc(st.text) + "</blockquote>" + lintHtml(sp.lint ? sp.lint(st.text, s) : []) +
          (sp.model ? '<div class="model"><p class="eyebrow">Dans ton cours</p>' + sp.model + "</div>" : "") +
          (sp.scale === "quarter" ? '<p class="hint">' + esc(sp.rubric) + "</p>" + quarter("qw") : '<p class="hint">Évalue-toi : coche ce qui est réussi.</p><div class="checks">' + sp.check.map((p, i) => chk("wc" + i, p)).join("") + "</div>") +
          '<div class="actions"><button class="btn primary" data-act="w-ok">Valider</button><button class="btn ghost" data-act="w-back">Reprendre mon texte</button></div>';
      }
    },
    faux: {
      enter(s, st) { st.v = s.items.map(() => null); st.j = s.items.map(() => ""); },
      view(s, st) {
        const head = '<p class="eyebrow">' + (s.pts ? "Question 2 · " + s.pts + " points" : "Orator 4 · Chrie ou fausse chrie") + "</p>";
        if (st.phase === 0) return head + "<h2>Lesquels ne sont pas des chries ?</h2><p class=\"hint\">Tranche, puis justifie en une ou deux phrases : « L'énoncé X n'est pas une chrie, parce que… ». À l'examen, ne perds pas de temps à justifier les vraies chries.</p>" + s.items.map((e, k) => '<div class="item"><p class="enonce">' + (k + 1) + ". " + esc(e.t) + '</p><div class="seg"><button data-act="fx" data-k="' + k + '" data-v="1" class="' + (st.v[k] === 1 ? "on" : "") + '">Chrie</button><button data-act="fx" data-k="' + k + '" data-v="0" class="' + (st.v[k] === 0 ? "on" : "") + '">Fausse chrie</button></div><textarea id="fx' + k + '" rows="2" placeholder="Ta justification">' + esc(st.j[k]) + "</textarea></div>").join("") + '<div class="actions"><button class="btn primary" data-act="fx-done">J\'ai terminé</button></div>';
        return head + "<h2>Corrige-toi</h2>" + s.items.map((e, k) => { const ok = st.v[k] === (e.r < 0 ? 1 : 0); return '<div class="item"><p class="enonce">' + (k + 1) + ". " + esc(e.t) + '</p><p class="verdict ' + (ok ? "ok" : "ko") + '">' + (e.r < 0 ? "C'est une chrie" : "Ce n'est pas une chrie") + " : ton verdict est " + (ok ? "juste" : st.v[k] == null ? "manquant" : "faux") + ".</p><p>" + esc(e.why) + "</p>" + (st.j[k] ? '<blockquote class="mine">' + esc(st.j[k]) + "</blockquote>" : "") + (e.r >= 0 ? chk("fj" + k, "Ma justification dit l'essentiel") : "") + "</div>"; }).join("") + '<div class="actions"><button class="btn primary" data-act="fx-ok">Valider</button></div>';
      }
    },
    titres: {
      enter(s, st) { st.t = s.items.map(() => ""); },
      view(s, st) {
        const head = '<p class="eyebrow">' + esc(s.label) + " · " + s.pts + " points</p>";
        if (st.phase === 0) return head + "<h2>" + (s.need < s.items.length ? "Choisis " + s.need + " extraits sur " + s.items.length + " et donne-leur un titre" : "Donne un titre à chaque extrait") + '</h2><p class="hint">' + (s.need < s.items.length ? "Un point de malus par proposition au-delà de " + s.need + ", et " : "") + "un point de malus si tu proposes plusieurs titres pour un même extrait.</p>" + s.items.map((it, k) => '<div class="item"><p class="src">' + (k + 1) + (it.src ? " · " + esc(SRC_NOM[it.src] || it.src) : "") + '</p><p class="enonce">' + (it.titre && s.showTitre ? "<b>" + esc(it.titre) + "</b><br>" : "") + esc(it.text) + '</p><input type="text" id="tt' + k + '" placeholder="Ton titre" autocomplete="off" value="' + esc(st.t[k]) + '"></div>').join("") + '<div class="actions"><button class="btn primary" data-act="tt-done">J\'ai terminé</button></div>';
        const sc = Core.score.titres(st.t, [], s.need, s.pts);
        return head + "<h2>Note tes titres</h2><p class=\"hint\">De 0 à 1 par paliers de 0,25. " + titreCritere + "</p>" + (sc.kept.length ? "" : "<p>Aucun titre proposé.</p>") + sc.kept.map(k => { const it = s.items[k]; return '<div class="item"><p class="enonce">' + (k + 1) + ". " + esc(it.text) + '</p><blockquote class="mine">' + esc(st.t[k]) + "</blockquote>" + lintHtml(Core.lint.titre(st.t[k], it.text)) + (it.corrige || it.titre ? corrigeHtml(it) : "") + quarter("qt" + k) + "</div>"; }).join("") + (sc.extra ? '<ul class="lint"><li class="bad">Malus : ' + plural(sc.extra, "proposition") + " au-delà de " + s.need + " (−" + sc.extra + ").</li></ul>" : "") + (sc.multi ? '<ul class="lint"><li class="bad">Malus : plusieurs titres pour un même extrait (−' + sc.multi + ").</li></ul>" : "") + '<div class="actions"><button class="btn primary" data-act="tt-ok">Valider</button></div>';
      }
    },
    breve: {
      enter(s, st) { st.t = ""; st.limit = R.opt.exam ? null : 150; },
      view(s, st) {
        const b = breveOf(s.id); if (!b) return "<p>Brève introuvable.</p><button class=\"btn ghost\" data-act=\"skip\">Passer</button>";
        const cat = s.cat != null ? CATEGORIES()[s.cat] : null;
        const head = '<p class="eyebrow">Orator 4 · ' + (b.src === "marianne" ? "Brève à retitrer" : "Minimare à titrer") + " · " + esc(SRC_NOM[b.src]) + (b.date ? " · " + esc(b.date) : "") + "</p>";
        if (st.phase === 0) return head + "<h2>" + (b.src === "marianne" ? "Propose un titre meilleur que celui du journal" : "Propose le titre qui prépare la lecture") + '</h2><blockquote class="small">' + esc(b.texte) + "</blockquote>" + (cat ? '<div class="prise"><span>Piste ' + (s.cat + 1) + "</span>" + esc(cat.nom) + "</div>" : '<p class="hint">Six pistes : mot juste, expression toute faite, latin ou grec, titre d\'œuvre, autre référence, création.</p>') + '<input type="text" id="tt0" placeholder="Ton titre, un seul" autocomplete="off" value="' + esc(st.t) + '"><div class="actions"><button class="btn primary" data-act="bv-done">J\'ai terminé</button><button class="btn ghost" data-act="bv-reroll">Autre texte</button>' + (R.steps.length > 1 ? '<button class="btn quiet" data-act="skip">Passer</button>' : "") + "</div>";
        return head + "<h2>Compare et note-toi</h2>" + (st.t ? '<blockquote class="mine">' + esc(st.t) + "</blockquote>" + lintHtml(Core.lint.titre(st.t, b.texte)) : "<p class=\"hint\">Aucun titre proposé.</p>") + corrigeHtml(b) + '<p class="hint">' + titreCritere + "</p>" + quarter("qb") + '<div class="actions"><button class="btn primary" data-act="bv-ok">Valider</button><button class="btn ghost" data-act="bv-back">Reprendre</button></div>';
      }
    },
    trois: {
      enter(s, st) { st.mode = s.mode || "r"; st.a = [0, 1, 2].map(() => ({ p: "", c: ["", ""], t: "" })); st.intro = ""; st.concl = ""; st.limit = null; },
      view(s, st) {
        const tx = textOf(s.tx); if (!tx) return "<p>Texte introuvable.</p><button class=\"btn ghost\" data-act=\"skip\">Passer</button>";
        const ref = st.mode === "r", CR = CRITERES(), PA = PARTIES();
        const head = '<p class="eyebrow">Orator 3 · ' + (ref ? "Réfutation" : "Confirmation") + (s.pts ? " · " + s.pts + " points" : "") + "</p>";
        if (st.phase === 0) {
          const corps = tx.texte && tx.texte.length ? '<details class="plain" open><summary>Le texte · ' + esc(tx.titre) + ", " + esc(tx.auteur || "") + '</summary><div class="body"><div class="texte">' + tx.texte.map(p => "<p>" + esc(p) + "</p>").join("") + "</div></div></details>" : '<ol class="pts">' + tx.faits.map(f => "<li>" + esc(f) + "</li>").join("") + "</ol>";
          const critOpts = (sel) => '<option value="">Critère…</option>' + CR.map((c, i) => '<option value="' + i + '"' + (String(sel) === String(i) ? " selected" : "") + ">" + esc(ref ? c.neg : c.pos) + "</option>").join("");
          return head + "<h2>" + esc(tx.titre) + '</h2><p class="hint">' + (s.mode ? "" : "Choisis : ") + "une introduction succincte" + (s.cadre ? "" : " (facultative ici)") + ", trois arguments et seulement trois, une conclusion succincte. Chaque argument : une partie différente de la narration, au moins deux critères, le texte cité. Pas de « je », pas de commentaire de méthode.</p>" +
            (s.mode ? "" : '<div class="seg"><button data-act="tr-mode" data-v="r" class="' + (ref ? "on" : "") + '">Réfutation</button><button data-act="tr-mode" data-v="c" class="' + (ref ? "" : "on") + '">Confirmation</button></div>') + corps +
            '<div class="tableau"><p class="eyebrow">Tableau, avant de rédiger</p>' + st.a.map((a, k) => '<div class="row"><b>Argument ' + (k + 1) + '</b><div class="cell"><select id="op' + k + '" aria-label="Partie de la narration"><option value="">Partie…</option>' + PA.map((p, i) => '<option value="' + i + '"' + (String(a.p) === String(i) ? " selected" : "") + ">" + esc(p.nom) + "</option>").join("") + '</select><select id="oc' + k + 'a" aria-label="Premier critère">' + critOpts(a.c[0]) + '</select><select id="oc' + k + 'b" aria-label="Second critère">' + critOpts(a.c[1]) + "</select></div></div>").join("") + "</div>" +
            (s.cadre ? '<div class="item"><h3>Introduction</h3><textarea id="tintro" rows="2" placeholder="Une phrase ou deux pour introduire.">' + esc(st.intro) + "</textarea></div>" : "") +
            st.a.map((a, k) => '<div class="item"><h3>Argument ' + (k + 1) + '</h3><textarea id="ot' + k + '" rows="7" placeholder="10 à 15 lignes. Entre directement dans l\'argument.">' + esc(a.t) + "</textarea></div>").join("") +
            (s.cadre ? '<div class="item"><h3>Conclusion</h3><textarea id="tconcl" rows="2" placeholder="Une phrase ou deux, sans résumer ce qui précède.">' + esc(st.concl) + "</textarea></div>" : "") +
            '<div class="actions"><button class="btn primary" data-act="tr-done">J\'ai terminé</button>' + (R.steps.length > 1 ? '<button class="btn quiet" data-act="skip">Passer</button>' : "") + "</div>";
        }
        const lab = a => (a.p !== "" ? esc(PA[a.p].nom) : "partie ?") + " × " + a.c.filter(x => x !== "").map(x => esc(ref ? CR[x].neg : CR[x].pos)).join(", ");
        const dev = s.modele && P.devoirs && P.devoirs.o3 ? P.devoirs.o3 : null;
        return head + "<h2>Relecture</h2>" + lintHtml(Core.lint.trois(st.a)) +
          (st.intro ? '<div class="item"><h3>Introduction</h3><blockquote class="mine">' + esc(st.intro) + "</blockquote></div>" : "") +
          st.a.map((a, k) => '<div class="item"><h3>Argument ' + (k + 1) + " · " + lab(a) + "</h3>" + (a.t ? '<blockquote class="mine">' + esc(a.t) + "</blockquote>" + lintHtml(Core.lint.arg(a.t)) + '<p class="hint">Note l\'argument de 0 à 1 : ingénieux, étayé par le texte, ni évident ni tiré par les cheveux.</p>' + quarter("qa" + k) : "<p class=\"hint\">Non rédigé.</p>") + "</div>").join("") +
          (st.concl ? '<div class="item"><h3>Conclusion</h3><blockquote class="mine">' + esc(st.concl) + "</blockquote></div>" : "") +
          '<div class="checks">' + chk("trTab", "Le tableau est rempli et correspond aux arguments rédigés") + chk("trVar", "Variatio : tournures et enchaînements variés") + chk("trCit", "Chaque argument cite le texte avec les procédés d'insertion") + '</div><p class="hint">Correction de la langue, de 0 à 1.</p>' + quarter("ql") +
          (dev ? '<details class="plain"><summary>Dans ton cours : proposition de ' + esc(dev.corrige && dev.corrige.mode === "c" ? "confirmation" : "réfutation") + '</summary><div class="body">' + (dev.corrige ? '<div class="tableau">' + (dev.corrige.tableau || []).map((r, i) => '<div class="row"><b>Argument ' + (i + 1) + "</b><div>" + esc(r.partie) + " · " + esc(r.critere) + "</div></div>").join("") + "</div>" + (dev.corrige.intro ? "<blockquote class=\"small\">" + esc(dev.corrige.intro) + "</blockquote>" : "") + (dev.corrige.args || []).map(a => '<blockquote class="small">' + esc(a) + "</blockquote>").join("") + (dev.corrige.conclusion ? "<blockquote class=\"small\">" + esc(dev.corrige.conclusion) + "</blockquote>" : "") : "") + (dev.conseils && dev.conseils.length ? "<ul>" + dev.conseils.map(c => "<li>" + esc(c) + "</li>").join("") + "</ul>" : "") + "</div></details>" : "") +
          '<p class="hint">Barème d\'entraînement, non confirmé : 5 points par argument, 3 pour la structure, 2 pour la langue.</p><div class="actions"><button class="btn primary" data-act="tr-ok">Valider</button><button class="btn ghost" data-act="tr-back">Reprendre</button></div>';
      }
    },
    qcm: {
      enter(s, st) { st.i = 0; st.ans = s.items.map(() => null); st.fb = null; },
      view(s, st) {
        const qs = s.items, n = qs.length;
        const head = '<p class="eyebrow">' + (s.train ? "QCM d'entraînement" : "QCM · Orator 1 · " + n + " questions") + "</p>";
        if (st.phase === 1) {
          const sc = Core.score.qcm(qs, st.ans);
          return head + '<div class="score">' + sc.ok + "<small> / " + n + (s.train ? "" : " · " + fr(sc.note) + " / 20") + "</small></div>" + qs.map((q, i) => { const ok = Core.score.qcmRight(q, st.ans[i]); const mine = st.ans[i]; const fmt = a => a == null ? "sans réponse" : (Array.isArray(a) ? a : [a]).map(x => letters[x] + ". " + q.choix[x]).join(" ; "); return '<div class="item"><p class="qnum">Question ' + (i + 1) + (q.cours ? " · cours " + esc(q.cours.replace(/^c/, "")) : "") + '</p><p class="enonce">' + esc(q.q) + '</p><p class="verdict ' + (ok ? "ok" : "ko") + '">' + (ok ? "Juste" : "Faux") + " : " + esc(fmt(mine)) + "</p>" + (ok ? "" : "<p>Bonne réponse : " + esc(fmt(q.a)) + "</p>") + (q.why ? '<p class="hint">' + esc(q.why) + "</p>" : "") + "</div>"; }).join("") + '<div class="actions"><button class="btn primary" data-act="qcm-ok">Valider</button></div>';
        }
        const q = qs[st.i], multi = Array.isArray(q.a), mine = st.ans[st.i];
        const sel = i => multi ? Array.isArray(mine) && mine.includes(i) : mine === i;
        const nav = s.train ? "" : '<div class="qgrid">' + qs.map((_, i) => '<button data-act="qcm-go" data-i="' + i + '" class="' + (i === st.i ? "c " : "") + (st.ans[i] != null ? "a" : "") + '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + "</button>").join("") + "</div>";
        const fb = st.fb;
        return head + nav + '<p class="qnum">Question ' + (st.i + 1) + " / " + n + (q.cours ? " · cours " + esc(q.cours.replace(/^c/, "")) : "") + (multi ? " · plusieurs réponses possibles" : "") + '</p><div class="sq">' + esc(q.q) + '</div><div class="choices">' +
          q.choix.map((c, i) => { let cls = sel(i) ? "sel" : ""; if (fb) cls = Core.score.qcmRight(q, i) || (multi && q.a.includes(i)) ? "ok" : sel(i) ? "ko" : "dim"; return '<button class="choice ' + cls + '" data-act="qcm-pick" data-i="' + i + '"' + (fb ? " disabled" : "") + '><span class="k">' + letters[i] + "</span><span>" + esc(c) + "</span></button>"; }).join("") + "</div>" +
          (fb ? '<div class="fb">' + (q.why ? "<p>" + esc(q.why) + "</p>" : "") + '<button class="btn primary" data-act="qcm-next">' + (st.i + 1 < n ? "Question suivante" : "Voir le résultat") + "</button></div>" :
            '<div class="actions">' + (s.train ? (multi ? '<button class="btn primary" data-act="qcm-check"' + (mine == null ? " disabled" : "") + ">Vérifier</button>" : "") : '<button class="btn ghost" data-act="qcm-prev"' + (st.i === 0 ? " disabled" : "") + '>Précédent</button><button class="btn primary" data-act="qcm-next">' + (st.i + 1 < n ? "Suivant" : "Terminer") + "</button>") + "</div>");
      }
    },
    capsule: {
      enter(s, st) { UI.cap = s.id; UI.capK = 0; UI.capPlay = false; st.limit = null; },
      view(s) { const c = capOf(s.id); if (!c) return "<p>Capsule introuvable.</p><button class=\"btn ghost\" data-act=\"skip\">Passer</button>"; return '<p class="eyebrow">Capsule · ' + esc(MODULES()[c.m].nom) + "</p><h2>" + esc(c.titre) + '</h2><p class="hint">' + esc(c.sous) + "</p>" + playerHtml(c, UI.capK); }
    },
    rate: {
      view(s) { return '<p class="eyebrow">' + esc(s.label) + " · " + s.pts + " points</p><h2>" + esc(s.title) + '</h2><p class="hint">' + esc(s.hint) + "</p>" + quarter("qr") + '<div class="actions"><button class="btn primary" data-act="rate-ok">Valider</button></div>'; }
    },
    mission: {
      enter(s, st) { const recent = S.journal.slice(0, 8).map(j => j.idx); const free = P.missions.map((_, i) => i).filter(i => !recent.includes(i)); st.idx = pick(free.length ? free : P.missions.map((_, i) => i)); },
      view(s, st) { return '<p class="eyebrow">Vivre</p><h2>Ta mission d\'ici demain</h2><blockquote>' + esc(P.missions[st.idx]) + '</blockquote><p class="hint">Demain, Palestre te demandera ce que tu as remarqué.</p><div class="actions"><button class="btn primary" data-act="mission-ok">Je la prends</button><button class="btn ghost" data-act="mission-other">Une autre</button></div>'; }
    }
  };

  function tick() {
    const el = $("#clock");
    if (!R || !el) return;
    const now = Date.now();
    el.classList.remove("over", "warnt");
    if (R.done) { el.textContent = ""; return; }
    if (R.deadline) { const r = R.deadline - now; el.textContent = (r < 0 ? "+" : "") + mmss(r); el.classList.toggle("over", r < 0); el.classList.toggle("warnt", r >= 0 && r < 5 * 60000); if (r < 0 && !R.warned) { R.warned = true; beep("end"); toast("Temps écoulé : termine et valide."); } return; }
    const st = R.st;
    if (!st.limit) { el.textContent = ""; return; }
    const r = st.t0 + st.limit * 1000 - now;
    if (st.hard) { if (r <= 0 && st.phase === 0) { sprintEnd(); return; } el.textContent = mmss(Math.max(0, r)); }
    else { el.textContent = (r < 0 ? "+" : "") + mmss(r); el.classList.toggle("over", r < 0); }
  }
  setInterval(tick, 250);
  function newQ() { const d = DRILLS[R.steps[R.i].drill]; let q, k = 0; do { q = d.gen(); } while (q.q === R.st.q.q && ++k < 6); R.st.q = q; }
  function sprintEnd() {
    const st = R.st, id = R.steps[R.i].drill, d = S.drills[id] || (S.drills[id] = { best: 0, n: 0 });
    st.phase = 1; st.limit = null; st.record = st.ok > d.best && st.ok > 0;
    d.best = Math.max(d.best, st.ok); d.n++;
    beep("end"); save(); drawRunner();
  }
  function recordQcm(q, right) { const s = S.qcm[q.id] || { ok: 0, n: 0 }; s.n++; if (right) s.ok++; s.last = Date.now(); S.qcm[q.id] = s; }

  /* ================= Parcours ================= */
  function nextDrill() { const l = drillList(); return l.sort((a, b) => ((S.drills[a] || {}).n || 0) - ((S.drills[b] || {}).n || 0))[0]; }
  function soon(m) { const e = examDay(m); return e != null && e >= TODAY() && e - TODAY() <= 21; }
  function nextAteliers(n) {
    const defs = [["arg", 3, () => mkArg()], ["titre", 4, mkTitre], ["brique", 2, () => mkBrique()], ["chrieday", 4, () => ({ type: "write", kind: "chrieday" })], ["faux", 4, () => (has("enonces") ? { type: "faux", items: pickEnonces(2) } : null)], ["recon", 4, mkRecon], ["breve", 4, () => mkBreve()]];
    const rw = rewritable();
    if (rw.length) defs.push(["rewrite", 0, () => ({ type: "write", kind: "rewrite", pid: rw[0].id })]);
    const key = d => (S.lastAt[d[0]] || 0) - (d[1] && soon(d[1]) ? 1e13 : 0);
    const out = [];
    defs.map((d, i) => [d, key(d), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).forEach(x => { if (out.length >= n) return; const st = x[0][2](); if (st) { S.lastAt[x[0][0]] = Date.now(); out.push(st); } });
    return out;
  }
  function startRitual() {
    const pl = Core.plan.ritualPlan(S.settings.len), steps = [];
    if (has("fiches")) steps.push(...pickCards(pl.cards).map(c => ({ type: "card", id: c.id })));
    const d = nextDrill(); if (d) steps.push({ type: "sprint", drill: d });
    if (pl.qcm && has("qcm")) steps.push({ type: "qcm", items: Core.plan.pickQcm(P.qcm, S.qcm, 5), train: true });
    steps.push(...nextAteliers(pl.ateliers));
    if (S.settings.len === 15) { const c = CAPSULES.find(x => !(S.caps[x.id] || {}).done); if (c) steps.push({ type: "capsule", id: c.id }); }
    if (!(S.mission && S.mission.day === TODAY())) steps.push({ type: "mission" });
    if (!steps.some(s => s.type !== "mission")) return toast("Importe ton pack de cours pour lancer le rituel.");
    startFlow(steps, { ritual: true });
  }
  const EXAMS = {
    1: { titre: "Orator 1", ok: () => has("qcm"), format: () => ["QCM d'une heure, questions uniquement sur le cours", S.settings.qcmN >= 999 ? "Toutes les questions du pack" : S.settings.qcmN + " questions tirées au sort, les moins réussies d'abord", "Correction et explications à la fin"], note: "Note sur 20 proportionnelle au nombre de bonnes réponses : le barème officiel du QCM n'est pas dans les documents du cours.", start() {
      const n = S.settings.qcmN >= 999 ? P.qcm.length : Math.min(S.settings.qcmN, P.qcm.length);
      startFlow([{ type: "qcm", items: Core.plan.pickQcm(P.qcm, S.qcm, n), pts: 20 }], { exam: 1, minutes: 60, title: "Examen blanc · Orator 1", note: this.note });
    } },
    2: { titre: "Orator 2", ok: () => has("affaires") && has("briques"), format: () => ["Un discours judiciaire complet, brique par brique", "Exorde, narration, èthos, lieux, preuves"], note: Core.DEF.EXAMENS[2].note, start() {
      const a = pick(P.affaires), role = rnd(2), pts = Math.floor(18 / P.briques.length * 4) / 4;
      const steps = P.briques.map(b => mkBrique(a.id, role, b.id, pts));
      steps.push({ type: "rate", label: "Correction de la langue", pts: 20 - pts * P.briques.length, title: "Relis ton discours en entier", hint: "Note la correction de la langue de 0 à 1 : orthographe, syntaxe, ponctuation." });
      startFlow(steps, { exam: 2, title: "Examen blanc · Orator 2", note: this.note });
    } },
    3: { titre: "Orator 3", ok: () => P.textes.length > 0, format: () => ["1 heure, un conte à confirmer ou à réfuter", "Tableau, puis " + (S.settings.o3cadre ? "introduction, " : "") + "trois arguments" + (S.settings.o3cadre ? ", conclusion" : ""), "Chaque argument : une partie différente, deux critères, le texte cité"], note: "Barème d'entraînement, non confirmé : 5 points par argument, 3 pour la structure, 2 pour la langue.", start() {
      const st = mkTrois({ pts: 20 }); if (!st) return toast("Aucun texte dans le pack.");
      startFlow([st], { exam: 3, minutes: 60, title: "Examen blanc · Orator 3", note: this.note });
    } },
    4: { titre: "Orator 4", ok: () => has("enonces") && has("chries"), format: () => ["1 heure, 20 points", "Partie 1 : définition (3), chries et fausses chries (2), comparaison (5)", "Partie 2 : titres pour deux chries de 1974 (2), 4 brèves Marianne sur 8 (4), 4 Minimares sur 8 (4)"], start() {
      const dev = P.devoirs && P.devoirs.o4 || {};
      const mar = P.breves.filter(b => b.src === "marianne"), can = P.breves.filter(b => b.src === "canard");
      const mine = S.texts.filter(t => t.kind === "breve").map(t => ({ text: t.text, src: "marianne" })), mineM = S.texts.filter(t => t.kind === "minimare").map(t => ({ text: t.text, src: "canard" }));
      const item = b => ({ id: b.id, text: b.texte, titre: b.titre, corrige: b.corrige, src: b.src, commentaire: b.commentaire });
      const antique = P.chries.filter(c => c.antique), moderne = P.chries.filter(c => !c.antique);
      const q2 = dev.q2 && dev.q2.length ? dev.q2 : pickEnonces(4);
      const q3m = [];
      if (moderne.length) { const c = pick(moderne); q3m.push({ label: "chrie composée à partir d'un débat présidentiel", text: c.full }); }
      if (can.length) { const b = pick(can); q3m.push({ label: SRC_NOM.canard + (b.date ? ", " + b.date : ""), text: b.texte }); }
      if (mar.length) { const b = pick(mar); q3m.push({ label: SRC_NOM.marianne + (b.date ? ", " + b.date : ""), text: b.texte, titre: b.titre }); }
      const q4 = (moderne.filter(c => c.corrige && c.corrige.length).length >= 2 ? shuffle(moderne.filter(c => c.corrige && c.corrige.length)) : shuffle(moderne)).slice(0, 2).map(c => ({ text: c.full, corrige: c.corrige }));
      const q5 = mar.length >= 8 ? shuffle(mar).slice(0, 8).map(item) : [...shuffle(mar).map(item), ...shuffle(mine)].slice(0, 8);
      const q6 = can.length >= 8 ? shuffle(can).slice(0, 8).map(item) : [...shuffle(can).map(item), ...shuffle(mineM)].slice(0, 8);
      startFlow([
        { type: "write", kind: "q1", pts: 3 },
        { type: "faux", items: q2, pts: 2 },
        antique.length && q3m.length ? { type: "write", kind: "q3", antique: pick(antique).id, modernes: q3m, pts: 5 } : null,
        q4.length ? { type: "titres", label: "Question 4 · Chries de débats présidentiels", items: q4, need: q4.length, pts: 2 } : null,
        q5.length ? { type: "titres", label: "Question 5 · Brèves de Marianne", items: q5, need: Math.min(4, q5.length), pts: 4, showTitre: true } : null,
        q6.length ? { type: "titres", label: "Question 6 · Minimares", items: q6, need: Math.min(4, q6.length), pts: 4 } : null
      ], { exam: 4, minutes: 60, title: "Examen blanc · Orator 4" });
    } }
  };
  const ATELIERS = {
    arg: () => startFlow([mkArg()]),
    trois: () => startFlow([mkTrois()]),
    brique: () => startFlow([mkBrique()]),
    faux: () => startFlow([has("enonces") ? { type: "faux", items: pickEnonces(2) } : null]),
    recon: () => startFlow([mkRecon()]),
    chrieday: () => startFlow([{ type: "write", kind: "chrieday" }]),
    titre: () => startFlow([mkTitre()]),
    marianne: () => startFlow([mkBreve("marianne")]),
    canard: () => startFlow([mkBreve("canard")]),
    qcm10: () => startFlow([has("qcm") ? { type: "qcm", items: Core.plan.pickQcm(P.qcm, S.qcm, Math.min(10, P.qcm.length), UI.cours || null), train: true } : null]),
    rewrite: () => { const r = rewritable(); if (r.length) startFlow([{ type: "write", kind: "rewrite", pid: r[0].id }]); else toast("Rien à réécrire pour l'instant : tes textes reviennent après 3 jours."); }
  };

  /* ================= Actions ================= */
  const ACT = {
    quit() {
      if (R.done || !R.res.length && R.st.phase === 0 && !($("#w-text") || {}).value && !R.deadline) return closeFlow();
      sheet("<h2>Quitter la séance ?</h2><p>Les étapes validées sont enregistrées. L'étape en cours sera perdue.</p>" + '<div class="actions"><button class="btn primary" data-act="sheet-close">Continuer la séance</button><button class="btn danger" data-act="quit-yes">Quitter</button></div>');
    },
    "quit-yes"() { closeSheet(); closeFlow(); },
    close() { closeFlow(); },
    skip() { nextStep(null); },
    "card-show"() { R.st.text = $("#c-text").value.trim(); R.st.phase = 1; drawRunner(); },
    "card-ok"() {
      const c = cardOf(R.steps[R.i].id), ratio = $$("#r-body .checks input:checked").length / c.p.length, cs = Core.srs.grade(cardState(c.id), ratio, TODAY(), examDay(c.m));
      S.cards[c.id] = cs; feedback(ratio >= 0.85);
      toast(LEVELS[level(cs.b)] + " · revient dans " + (cs.due - TODAY()) + " j");
      nextStep({ kind: "card", ratio });
    },
    ans(el) { const st = R.st, i = +el.dataset.i; if (st.fb) return; st.n++; const ok = i === st.q.a; if (st.q.id) recordQcm({ id: st.q.id }, ok); feedback(ok); if (ok) { st.ok++; newQ(); } else st.fb = { i }; drawRunner(); },
    "sprint-go"() { R.st.fb = null; newQ(); drawRunner(); },
    "sprint-next"() { nextStep({ kind: "sprint", ok: R.st.ok, n: R.st.n }); },
    "w-done"() { const t = $("#w-text").value.trim(); if (!t) return; R.st.text = t; R.st.phase = 1; R.st.limit = null; drawRunner(); },
    "w-back"() { R.st.phase = 0; drawRunner(); },
    "w-reroll"() { const s = R.steps[R.i]; const n = s.kind === "arg" ? mkArg({ tx: s.tx, mode: s.mode }) : mkTitre(); if (n) { R.steps[R.i] = n; stepEnter(); } },
    "w-ok"() {
      const s = R.steps[R.i], sp = SPEC[s.kind](s);
      let ratio;
      if (sp.scale === "quarter") { ratio = qval("qw"); if (ratio == null) return toast("Choisis une note de 0 à 1."); }
      else ratio = $$("#r-body .checks input:checked").length / sp.check.length;
      saveProd(s, R.st.text, ratio);
      nextStep({ kind: "write", ratio, pts: s.pts != null ? ratio * s.pts : undefined });
    },
    fx(el) { fxCapture(); R.st.v[+el.dataset.k] = +el.dataset.v; drawRunner(); },
    "fx-done"() { fxCapture(); R.st.phase = 1; drawRunner(); },
    "fx-ok"() {
      const s = R.steps[R.i], st = R.st, n = s.items.length, nf = s.items.filter(e => e.r >= 0).length;
      const okV = s.items.filter((e, k) => st.v[k] === (e.r < 0 ? 1 : 0)).length, okJ = $$("#r-body .chk input:checked").length;
      const ratio = (okV + okJ) / (n + nf);
      S.lastAt.faux = Date.now();
      nextStep({ kind: "faux", ratio, pts: s.pts ? ratio * s.pts : undefined });
    },
    "tt-done"() {
      const s = R.steps[R.i], st = R.st;
      s.items.forEach((_, k) => { st.t[k] = $("#tt" + k).value.trim(); });
      const filled = st.t.filter(t => t).length;
      if (filled > s.need) toast("Seules les " + s.need + " premières propositions sont notées ; les autres comptent en malus.");
      st.phase = 1; drawRunner();
    },
    "tt-ok"() {
      const s = R.steps[R.i], st = R.st, sc0 = Core.score.titres(st.t, [], s.need, s.pts), notes = [];
      for (const k of sc0.kept) { const v = qval("qt" + k); if (v == null) return toast("Note chaque titre."); notes[k] = v; if (s.items[k].id) { const b = S.breves[s.items[k].id] || { n: 0, titres: [] }; b.n++; b.last = Date.now(); b.titres = (b.titres || []).concat([{ t: st.t[k], note: v, d: Date.now() }]).slice(-6); S.breves[s.items[k].id] = b; } }
      const sc = Core.score.titres(st.t, notes, s.need, s.pts);
      nextStep({ kind: "titres", pts: sc.pts });
    },
    "bv-done"() { R.st.t = $("#tt0").value.trim(); R.st.phase = 1; R.st.limit = null; drawRunner(); },
    "bv-back"() { R.st.phase = 0; drawRunner(); },
    "bv-reroll"() { const s = R.steps[R.i], b = breveOf(s.id); const n = mkBreve(b ? b.src : null, s.cat); if (n && n.id !== s.id) { R.steps[R.i] = n; stepEnter(); } else toast("Pas d'autre texte disponible."); },
    "bv-ok"() {
      const s = R.steps[R.i], st = R.st, v = qval("qb"); if (v == null) return toast("Note ton titre de 0 à 1.");
      const b = S.breves[s.id] || { n: 0, titres: [] }; b.n++; b.last = Date.now(); if (st.t) b.titres = (b.titres || []).concat([{ t: st.t, note: v, d: Date.now() }]).slice(-6); S.breves[s.id] = b;
      const br = breveOf(s.id);
      if (st.t) { S.prods.unshift({ id: newId("p"), t: Date.now(), kind: "breve", mod: 4, title: "Titre · " + SRC_NOM[br.src] + (br.titre ? " · " + br.titre : ""), text: st.t, score: v, src: null, parent: null, breve: s.id }); if (S.prods.length > 400) S.prods.length = 400; }
      S.lastAt.breve = Date.now();
      nextStep({ kind: "breve", ratio: v, pts: s.pts ? v * s.pts : undefined });
    },
    "tr-mode"(el) { trCapture(); R.st.mode = el.dataset.v; drawRunner(); },
    "tr-done"() { trCapture(); if (!R.st.a.some(a => a.t)) return toast("Rédige au moins un argument."); R.st.phase = 1; drawRunner(); },
    "tr-back"() { R.st.phase = 0; drawRunner(); },
    "tr-ok"() {
      const s = R.steps[R.i], st = R.st, notes = [];
      for (let k = 0; k < 3; k++) { if (!st.a[k].t) { notes[k] = 0; continue; } const v = qval("qa" + k); if (v == null) return toast("Note chaque argument."); notes[k] = v; }
      const langue = qval("ql"); if (langue == null) return toast("Note la correction de la langue.");
      const sc = Core.score.o3(notes, { tableau: $("#trTab").checked, variatio: $("#trVar").checked, citations: $("#trCit").checked, langue });
      st.a.forEach(a => { if (a.t && a.p !== "") a.c.filter(c => c !== "").forEach(c => { S.grid[gk(st.mode, a.p, c)] = (S.grid[gk(st.mode, a.p, c)] || 0) + 1; }); });
      const tx = textOf(s.tx), parts = [];
      if (st.intro) parts.push(st.intro);
      st.a.forEach((a, i) => { if (a.t) parts.push((i + 1) + ". " + a.t); });
      if (st.concl) parts.push(st.concl);
      S.prods.unshift({ id: newId("p"), t: Date.now(), kind: "trois", mod: 3, title: (st.mode === "r" ? "Réfutation" : "Confirmation") + " · " + tx.titre, text: parts.join("\n\n"), score: sc.pts / 20, src: null, parent: null });
      S.lastAt.trois = Date.now();
      const ratio = sc.pts / 20;
      nextStep({ kind: "trois", pts: s.pts ? ratio * s.pts : sc.pts, ratio });
    },
    "qcm-pick"(el) {
      const s = R.steps[R.i], st = R.st, q = s.items[st.i], i = +el.dataset.i;
      if (st.fb) return;
      if (Array.isArray(q.a)) { const cur = Array.isArray(st.ans[st.i]) ? st.ans[st.i].slice() : []; const k = cur.indexOf(i); if (k >= 0) cur.splice(k, 1); else cur.push(i); st.ans[st.i] = cur.length ? cur : null; drawRunner(); return; }
      st.ans[st.i] = i;
      if (s.train) ACT["qcm-check"](); else drawRunner();
    },
    "qcm-check"() { const s = R.steps[R.i], st = R.st, q = s.items[st.i]; if (st.ans[st.i] == null) return; const ok = Core.score.qcmRight(q, st.ans[st.i]); st.fb = { ok }; feedback(ok); drawRunner(); },
    "qcm-go"(el) { R.st.i = +el.dataset.i; R.st.fb = null; drawRunner(); },
    "qcm-prev"() { if (R.st.i > 0) R.st.i--; drawRunner(); },
    "qcm-next"() {
      const s = R.steps[R.i], st = R.st;
      st.fb = null;
      if (st.i + 1 < s.items.length) { st.i++; drawRunner(); return; }
      if (!s.train) { const left = st.ans.filter(a => a == null).length; if (left && !st.confirmEnd) { st.confirmEnd = true; return toast(plural(left, "question") + " sans réponse : appuie encore pour terminer."); } }
      st.phase = 1; drawRunner();
    },
    "qcm-ok"() {
      const s = R.steps[R.i], st = R.st, sc = Core.score.qcm(s.items, st.ans);
      s.items.forEach((q, i) => recordQcm(q, Core.score.qcmRight(q, st.ans[i])));
      S.lastAt.qcm = Date.now();
      nextStep({ kind: "qcm", ok: sc.ok, n: sc.n, note: sc.note, ratio: sc.n ? sc.ok / sc.n : 0 });
    },
    "cap-prev"() { if (UI.capK > 0) UI.capK--; capAuto(false); capRefresh(); },
    "cap-next"() { const c = capOf(UI.cap); if (c && UI.capK < c.scenes.length - 1) UI.capK++; capRefresh(); save(); },
    "cap-play"() { capAuto(!UI.capPlay); capRefresh(); },
    "cap-done"() { capDone(); if (R) nextStep({ kind: "capsule" }); else { toast("Capsule vue. Les fiches liées sont prêtes à être rappelées."); UI.cap = null; render(); } },
    "cap-open"(el) { UI.cap = el.dataset.id; UI.capK = 0; capAuto(false); render(); capMount(); },
    "cap-close"() { UI.cap = null; capAuto(false); save(); render(); },
    "cap-fiches"() { const c = capOf(UI.cap); const ids = (c.fiches || []).filter(id => cardOf(id)); if (!ids.length) return toast("Aucune fiche liée dans ton pack."); startFlow(ids.map(id => ({ type: "card", id }))); },
    "rate-ok"() { const v = qval("qr"); if (v == null) return toast("Choisis une note de 0 à 1."); nextStep({ kind: "rate", pts: v * R.steps[R.i].pts }); },
    "mission-ok"() {
      if (S.mission && S.mission.done == null && S.mission.day < TODAY()) S.journal.unshift({ day: S.mission.day, idx: S.mission.idx, done: false, note: "" });
      S.mission = { day: TODAY(), idx: R.st.idx, done: null }; nextStep({ kind: "mission" });
    },
    "mission-other"() { let i; do { i = rnd(P.missions.length); } while (i === R.st.idx && P.missions.length > 1); R.st.idx = i; drawRunner(); },

    // Accueil
    len(el) { S.settings.len = +el.dataset.v; save(); render(); },
    ritual() { startRitual(); },
    wall(el) { UI.wall = el.dataset.v; render(); },
    cell(el) { startFlow([mkArg({ mode: UI.wall, p: +el.dataset.p, c: +el.dataset.c })]); },
    "mission-done"(el) {
      const note = ($("#m-note") || {}).value || "";
      S.journal.unshift({ day: S.mission.day, idx: S.mission.idx, done: el.dataset.v === "1", note: note.trim() });
      S.journal.length = Math.min(S.journal.length, 200);
      S.mission = null; save(); render();
      toast(el.dataset.v === "1" ? "Noté dans ton carnet." : "Une autre viendra aujourd'hui.");
    },
    "hide-install"() { S.settings.hideInstall = true; save(); render(); },
    goto(el) { UI.tab = el.dataset.v; if (el.dataset.sub) UI[el.dataset.sub] = el.dataset.subv; try { location.hash = UI.tab; } catch (e) { /* sans hash */ } render(); window.scrollTo(0, 0); },
    // Apprendre, ateliers, examens
    app(el) { UI.app = el.dataset.v; UI.cap = null; capAuto(false); render(); },
    cours(el) { UI.cours = el.dataset.v; render(); },
    atelier(el) { if (ATELIERS[el.dataset.k]) ATELIERS[el.dataset.k](); },
    sprint(el) { startFlow([{ type: "sprint", drill: el.dataset.k }]); },
    mod(el) { UI.mod = +el.dataset.v; render(); },
    revise() { startFlow(pickCards(8, UI.mod).map(c => ({ type: "card", id: c.id }))); },
    exam(el) { const e = EXAMS[el.dataset.m]; if (!e.ok()) return toast("Le pack ne contient pas encore ce qu'il faut pour cette épreuve."); e.start(); },
    qcmn(el) { S.settings.qcmN = +el.dataset.v; save(); render(); },
    o3cadre(el) { S.settings.o3cadre = el.dataset.v === "1"; save(); render(); },
    // Carnet
    carnet(el) { UI.carnet = el.dataset.v; render(); },
    star(el) { const p = S.prods.find(x => x.id === el.dataset.id); if (p) { p.star = !p.star; save(); render(); } },
    onlystar() { UI.star = !UI.star; render(); },
    redo(el) { startFlow([{ type: "write", kind: "rewrite", pid: el.dataset.id }]); },
    delprod(el) { S.prods = S.prods.filter(x => x.id !== el.dataset.id); save(); render(); },
    addtext() { const t = $("#nt-text").value.trim(); if (!t) return toast("Colle d'abord un texte."); S.texts.unshift({ id: newId("t"), kind: $("#nt-kind").value, text: t }); save(); render(); toast("Ajouté à tes sujets."); },
    deltext(el) { S.texts = S.texts.filter(x => x.id !== el.dataset.id); save(); render(); },
    export(el) { exportData(el.dataset.v === "pack"); },
    copy() { const ta = $("#exp"); ta.select(); try { navigator.clipboard.writeText(ta.value).then(() => toast("Copié."), () => toast("Sélectionne le texte et copie-le.")); } catch (e) { toast("Sélectionne le texte et copie-le."); } },
    importpaste() { sheet('<h2>Restaurer ou fusionner</h2><p class="hint">Colle ici le contenu d\'une sauvegarde Palestre (ou d\'un pack de cours).</p><textarea id="imp" rows="6" placeholder="{ … }"></textarea><div class="actions"><button class="btn primary" data-act="import-go">Lire</button><button class="btn ghost" data-act="sheet-close">Annuler</button></div>'); },
    "import-go"() { importData($("#imp").value); },
    "imp-replace"() { if (PENDING && PENDING.state) { S = PENDING.state; save(); } finishImport(); },
    "imp-merge"() { if (PENDING && PENDING.state) { S = Core.state.merge(S, PENDING.state); save(); } finishImport(); },
    "pack-paste"() { const t = ($("#pk-paste") || {}).value || ""; if (!t.trim()) return toast("Colle d'abord le contenu du pack."); importPack(t); },
    "pack-remove"() { sheet('<h2>Retirer le pack de cours ?</h2><p>Les textes du cours seront effacés de cet appareil. Ta progression est conservée.</p><div class="actions"><button class="btn danger" data-act="pack-remove-yes">Retirer</button><button class="btn primary" data-act="sheet-close">Annuler</button></div>'); },
    "pack-remove-yes"() { setPack(null); closeSheet(); render(); toast("Pack retiré."); },
    son(el) { S.settings.son = el.dataset.v === "1"; save(); render(); if (S.settings.son) beep("ok"); },
    anim(el) { S.settings.anim = el.dataset.v; save(); applyPrefs(); render(); },
    theme(el) { S.settings.theme = el.dataset.v; save(); applyPrefs(); render(); },
    reset() { sheet('<h2>Tout effacer ?</h2><p>Ta progression, tes textes et ton carnet seront supprimés de cet appareil. Le pack de cours reste. Exporte une sauvegarde avant si tu veux la garder.</p><div class="actions"><button class="btn danger" data-act="reset-yes">Tout effacer</button><button class="btn primary" data-act="sheet-close">Annuler</button></div>'); },
    "reset-yes"() { S = Core.state.fresh(); save(); closeSheet(); applyPrefs(); render(); toast("Remis à zéro."); },
    "sheet-close"() { closeSheet(); }
  };
  function fxCapture() { R.steps[R.i].items.forEach((_, k) => { const el = $("#fx" + k); if (el) R.st.j[k] = el.value.trim(); }); }
  function trCapture() {
    const st = R.st;
    st.a.forEach((a, k) => { const p = $("#op" + k), ca = $("#oc" + k + "a"), cb = $("#oc" + k + "b"), t = $("#ot" + k); if (p) a.p = p.value; if (ca && cb) a.c = [ca.value, cb.value]; if (t) a.t = t.value.trim(); });
    const i = $("#tintro"), c = $("#tconcl"); if (i) st.intro = i.value.trim(); if (c) st.concl = c.value.trim();
  }

  /* ================= Sauvegarde : export, import, fusion, pack ================= */
  let PENDING = null;
  function download(name, data) {
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return true; } catch (e) { return false; }
  }
  function exportData(withPack) {
    const data = JSON.stringify(Core.state.makeBackup(S, withPack ? PRAW : null)), name = "palestre-" + (withPack ? "complet-" : "progression-") + dayKey(TODAY()) + ".json";
    if (download(name, data)) return toast("Sauvegarde prête : garde-la dans Fichiers ou envoie-la à ton autre appareil.");
    sheet('<h2>Ta sauvegarde</h2><p class="hint">Copie ce texte et garde-le dans Notes ou Fichiers. Pour restaurer, colle-le dans « Restaurer en collant ».</p><textarea id="exp" rows="6" readonly>' + esc(data) + '</textarea><div class="actions"><button class="btn primary" data-act="copy">Copier</button><button class="btn ghost" data-act="sheet-close">Fermer</button></div>');
  }
  function importData(raw) {
    const r = Core.state.parseBackup(raw);
    if (!r.ok) return toast(r.error);
    if (!r.state && r.pack) { closeSheet(); return importPack(r.pack); }
    PENDING = r;
    const n = r.state.prods.length, c = Object.keys(r.state.cards).length;
    sheet("<h2>Progression trouvée</h2><p>" + plural(c, "fiche travaillée", "fiches travaillées") + ", " + plural(n, "texte") + (r.pack ? ", et un pack de cours" : "") + ".</p><p class=\"hint\">Fusionner garde le meilleur des deux appareils. Remplacer efface la progression de celui-ci.</p>" +
      '<div class="actions"><button class="btn primary" data-act="imp-merge">Fusionner</button><button class="btn danger" data-act="imp-replace">Remplacer</button><button class="btn ghost" data-act="sheet-close">Annuler</button></div>');
  }
  function finishImport() {
    if (PENDING && PENDING.pack && (!PRAW || confirmPack(PENDING.pack))) setPack(PENDING.pack);
    PENDING = null; closeSheet(); applyPrefs(); render(); toast("Progression importée.");
  }
  const confirmPack = p => { const v = Core.pack.validate(p); return v.ok && (!PRAW || (p.date || "") >= (PRAW.date || "")); };
  function importPack(raw) {
    let o;
    try { o = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return toast("Ce texte n'est pas un JSON valide."); }
    if (o && o.palestre === "sauvegarde") return importData(o);
    const v = Core.pack.validate(o);
    if (!v.ok) { sheet("<h2>Pack refusé</h2><ul>" + v.errors.slice(0, 12).map(e => "<li>" + esc(e) + "</li>").join("") + (v.errors.length > 12 ? "<li>… et " + (v.errors.length - 12) + " autres</li>" : "") + '</ul><div class="actions"><button class="btn primary" data-act="sheet-close">Fermer</button></div>'); return; }
    setPack(o); closeSheet(); UI.carnet = "pack"; render();
    toast("Pack installé : " + plural(v.stats.fiches, "fiche") + ", " + plural(v.stats.qcm, "question") + ", " + plural(v.stats.breves, "brève") + ".");
  }
  function readFileInput(file, cb) { const r = new FileReader(); r.onload = () => cb(String(r.result)); r.onerror = () => toast("Lecture du fichier impossible."); r.readAsText(file); }

  /* ================= Vues ================= */
  const seg = (act, cur, opts, extra) => '<div class="seg">' + opts.map(o => '<button data-act="' + act + '" data-v="' + o[0] + '" class="' + (String(cur) === String(o[0]) ? "on" : "") + '"' + (extra || "") + ">" + esc(o[1]) + "</button>").join("") + "</div>";
  const rowb = (act, k, title, sub, tag, dis) => '<button class="rowb" data-act="' + act + '" data-k="' + k + '"' + (dis ? " disabled" : "") + '><span class="grow"><b>' + esc(title) + '</b><span class="sub">' + esc(sub) + "</span></span>" + (tag ? '<span class="tag">' + esc(tag) + "</span>" : "") + "</button>";
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = () => window.navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  const packCta = () => '<section class="hero"><p class="eyebrow">Pack de cours</p><h2>Importe tes cours pour tout débloquer.</h2><p class="hint">L\'appli est publique ; les textes des cours restent sur ton appareil. Importe le fichier <b>pack.json</b> préparé depuis le dossier privé.</p><div class="actions"><button class="btn primary" data-act="goto" data-v="carnet" data-sub="carnet" data-subv="pack">Importer le pack</button><button class="btn ghost" data-act="goto" data-v="apprendre" data-sub="app" data-subv="capsules">Voir les capsules</button></div></section>';

  const VIEWS = {
    aujourdhui() {
      const t = TODAY(), pl = Core.plan.ritualPlan(S.settings.len), done = S.ritualDay === t, due = has("fiches") ? dueCards().length : 0;
      const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      let h = '<header class="top"><p class="eyebrow">' + esc(date) + "</p><h1>Palestre</h1></header>";
      let mission = "";
      if (S.mission && S.mission.day < t && S.mission.done == null) {
        mission = '<section class="card"><p class="eyebrow">Ta mission d\'hier</p><blockquote>' + esc(P.missions[S.mission.idx] || "") + '</blockquote><textarea id="m-note" rows="2" placeholder="Ce que tu as remarqué"></textarea><div class="actions"><button class="btn primary" data-act="mission-done" data-v="1">Je l\'ai vécue</button><button class="btn ghost" data-act="mission-done" data-v="0">Pas cette fois</button></div></section>';
      } else if (S.mission && S.mission.day === t) {
        mission = '<section class="card"><p class="eyebrow">Ta mission d\'ici demain</p><blockquote>' + esc(P.missions[S.mission.idx] || "") + "</blockquote></section>";
      }
      const install = isIOS && !standalone() && !S.settings.hideInstall ? '<section class="card soft"><p class="eyebrow">Sur l\'écran d\'accueil</p><p class="hint">Dans Safari : bouton Partager, puis « Sur l\'écran d\'accueil ». L\'appli s\'ouvre alors en plein écran et fonctionne hors ligne.</p><div class="actions"><button class="btn small ghost" data-act="hide-install">Compris</button></div></section>' : "";
      const ritual = '<section class="card ritual"><p class="eyebrow">' + (done ? "Rituel accompli aujourd'hui" : "Rituel du jour") + "</p><h2>Rappeler, réagir, produire, vivre.</h2>" +
        seg("len", S.settings.len, [[5, "5 min"], [10, "10 min"], [15, "15 min"]]) +
        '<p class="hint">' + plural(pl.cards, "rappel") + " · 1 sprint" + (pl.qcm && has("qcm") ? " · 5 questions de QCM" : "") + (pl.ateliers ? " · " + plural(pl.ateliers, "atelier") : "") + (S.settings.len === 15 ? " · 1 capsule" : "") + " · 1 mission" + (due ? " · " + plural(due, "fiche") + " à revoir" : "") + '</p><button class="btn primary" data-act="ritual">' + (done ? "Refaire une séance" : "Commencer") + "</button></section>";
      const dow = (new Date().getDay() + 6) % 7, st = streak();
      const week = '<section class="card"><div class="head"><p class="eyebrow">Assiduité</p><p class="big">' + st + "<small>" + (st > 1 ? "jours de suite" : "jour de suite") + '</small></p></div><div class="week">' + ["L", "M", "M", "J", "V", "S", "D"].map((l, i) => { const d = t - dow + i; return '<div class="' + (S.days[d] ? "done " : "") + (d === t ? "today" : "") + '"><i></i>' + l + "</div>"; }).join("") + '</div><p class="hint">Un jour de relâche par semaine ne casse pas la chaîne.</p></section>';
      const ds = [1, 2, 3, 4].map(m => { const e = examDay(m); return e == null ? "" : "<div><b>" + (e - t >= 0 ? "J-" + (e - t) : "passé") + "</b><span>" + esc(MODULES()[m].nom) + "</span></div>"; }).join("");
      const dates = ds ? '<section class="card"><p class="eyebrow">Échéances</p><div class="dates">' + ds + '</div></section>' : "";
      const CR = CRITERES(), PA = PARTIES();
      const held = Object.keys(S.grid).filter(k => k.startsWith(UI.wall) && S.grid[k] > 0).length, total = PA.length * CR.length;
      let wall = '<div class="wall" style="--nc:' + CR.length + '"><span></span>' + CR.map(c => '<span class="ch">' + esc(c.c) + "</span>").join("");
      PA.forEach((p, i) => { wall += '<span class="rh">' + esc(p.c) + "</span>" + CR.map((c, j) => { const n = S.grid[gk(UI.wall, i, j)] || 0; return '<button class="v' + (n >= 4 ? 3 : n >= 2 ? 2 : n) + '" data-act="cell" data-p="' + i + '" data-c="' + j + '" aria-label="' + esc(p.nom + " × " + (UI.wall === "r" ? c.neg : c.pos) + " : " + n + " fois") + '"' + (textesFaits().length ? "" : " disabled") + "></button>"; }).join(""); });
      wall += "</div>";
      const mur = '<section class="card"><div class="head"><div><p class="eyebrow">Le Mur · Orator 3</p><h2>' + held + " prises tenues sur " + total + "</h2></div>" + seg("wall", UI.wall, [["r", "Réfutation"], ["c", "Confirmation"]]) + "</div>" + wall + '<p class="hint">' + PA.length + " parties de la narration, " + CR.length + " critères. Touche une prise pour t'y entraîner.</p></section>";
      const mods = [1, 2, 3, 4].map(m => { const k = mastery(m), n = k[0] + k[1] + k[2] + k[3] || 1, e = examDay(m), j = e != null ? e - t : null; return '<div class="mod"><div class="head"><h3>' + esc(MODULES()[m].nom) + " · " + esc(MODULES()[m].sous) + "</h3><span>" + (j != null && j >= 0 ? "J-" + j + " · " : "") + (k[2] + k[3]) + " sur " + (k[0] + k[1] + k[2] + k[3]) + ' ancrées</span></div><div class="bar"><i class="b3" style="width:' + k[3] / n * 100 + '%"></i><i class="b2" style="width:' + k[2] / n * 100 + '%"></i><i class="b1" style="width:' + k[1] / n * 100 + '%"></i></div></div>'; }).join("");
      const mait = '<section class="card"><p class="eyebrow">Maîtrise des savoirs</p>' + mods + '<p class="legend"><span style="--k:var(--accent)">Réflexe</span><span style="--k:color-mix(in srgb, var(--accent) 55%, transparent)">Ancré</span><span style="--k:var(--gold)">En cours</span></p></section>';
      const nextCap = CAPSULES.find(c => !(S.caps[c.id] || {}).done);
      const capsule = nextCap ? '<section class="card soft"><div class="head"><div><p class="eyebrow">Capsule à voir</p><h3>' + esc(nextCap.titre) + '</h3></div><span class="pill gold">' + esc(nextCap.duree) + '</span></div><p class="hint">' + esc(nextCap.sous) + '</p><div class="actions"><button class="btn ghost" data-act="cap-open" data-id="' + nextCap.id + '">Regarder</button></div></section>' : "";
      return h + (P.empty ? packCta() : "") + '<div class="cols"><div class="col">' + mission + ritual + install + dates + week + '</div><div class="col">' + mur + mait + capsule + "</div></div>";
    },
    apprendre() {
      let body = "";
      const tabs = seg("app", UI.app, [["capsules", "Capsules"], ["fiches", "Fiches"], ["qcm", "QCM"]]);
      if (UI.app === "capsules") {
        if (UI.cap) {
          const c = capOf(UI.cap);
          body = '<section class="card"><div class="head"><div><p class="eyebrow">' + esc(MODULES()[c.m].nom) + " · " + esc(c.duree) + "</p><h2>" + esc(c.titre) + '</h2><p class="hint">' + esc(c.sous) + '</p></div><button class="btn small ghost" data-act="cap-close">Fermer</button></div>' + playerHtml(c, UI.capK) + ((c.fiches || []).some(id => cardOf(id)) ? '<div class="actions"><button class="btn ghost" data-act="cap-fiches">Rappeler les fiches liées</button></div>' : "") + "</section>";
        } else {
          body = '<section class="card"><p class="eyebrow">Voir le mécanisme</p><p class="hint">Chaque capsule montre un raisonnement du cours en quelques scènes. Touche-la, puis avance à ton rythme ou lance la lecture.</p></section><div class="capgrid">' + CAPSULES.map(c => { const s = S.caps[c.id] || {}; return '<button class="capcard" data-act="cap-open" data-id="' + c.id + '"><div class="thumb">' + c.svg + '</div><div class="head"><span class="eyebrow">' + esc(MODULES()[c.m].nom) + '</span><span class="pill ' + (s.done ? "l3" : s.seen ? "l1" : "") + '">' + (s.done ? "vue" : s.seen ? s.seen + "/" + c.scenes.length : c.duree) + "</span></div><b>" + esc(c.titre) + '</b><span class="sub">' + esc(c.sous) + "</span></button>"; }).join("") + "</div>";
        }
      } else if (UI.app === "fiches") {
        if (!has("fiches")) body = packCta();
        else {
          const m = UI.mod, t = TODAY(), due = dueCards(m).length, M = MODULES()[m];
          const list = P.fiches.filter(c => c.m === m).map(c => { const cs = cardState(c.id), l = level(cs.b), d = cs.due - t; return "<details><summary><span>" + esc(c.q) + '</span><span class="pill l' + l + '">' + LEVELS[l] + "</span></summary><ul>" + c.p.map(p => "<li>" + esc(p) + "</li>").join("") + '</ul><p class="hint">' + (cs.n ? (d <= 0 ? "À revoir aujourd'hui." : "Revient dans " + plural(d, "jour") + ".") + " Vue " + cs.n + " fois." : "Pas encore travaillée.") + (c.src ? " Source : " + esc(c.src) + "." : "") + "</p></details>"; }).join("");
          body = seg("mod", m, [1, 2, 3, 4].map(k => [k, MODULES()[k].nom])) + '<section class="card"><div><p class="eyebrow">' + esc(M.prof || "") + "</p><h2>" + esc(M.sous) + '</h2></div><button class="btn primary" data-act="revise">Réviser ce module' + (due ? " · " + due + " à revoir" : "") + '</button><p class="hint">Essaie de répondre avant d\'ouvrir une fiche : c\'est l\'effort de rappel qui ancre.</p><div>' + (list || '<p class="hint">Aucune fiche pour ce module dans ton pack.</p>') + "</div></section>";
        }
      } else {
        if (!has("qcm")) body = packCta();
        else {
          const cours = uniq(P.qcm.map(q => q.cours).filter(Boolean)).sort();
          const pool = P.qcm.filter(q => !UI.cours || q.cours === UI.cours);
          const seen = pool.filter(q => S.qcm[q.id]).length, okN = pool.reduce((a, q) => a + ((S.qcm[q.id] || {}).ok || 0), 0), nN = pool.reduce((a, q) => a + ((S.qcm[q.id] || {}).n || 0), 0);
          const list = pool.map(q => { const s = S.qcm[q.id]; const pct = s && s.n ? Math.round(s.ok / s.n * 100) : null; return "<details><summary><span>" + esc(q.q) + '</span><span class="pill ' + (pct == null ? "" : pct >= 80 ? "l3" : pct >= 50 ? "l2" : "l1") + '">' + (pct == null ? "jamais vue" : pct + " %") + "</span></summary><ul>" + q.choix.map((c, i) => "<li>" + (Core.score.qcmRight(q, i) || (Array.isArray(q.a) && q.a.includes(i)) ? "<b>" + letters[i] + ". " + esc(c) + " ✓</b>" : letters[i] + ". " + esc(c)) + "</li>").join("") + "</ul>" + (q.why ? '<p class="hint">' + esc(q.why) + (q.src ? " Source : " + esc(q.src) + "." : "") + "</p>" : "") + "</details>"; }).join("");
          body = seg("cours", UI.cours, [["", "Tout"], ...cours.map(c => [c, "Cours " + c.replace(/^c/, "")])]) + '<section class="card"><div class="head"><div><p class="eyebrow">Orator 1 · QCM</p><h2>' + plural(pool.length, "question") + '</h2></div><div class="stats"><div><b>' + seen + '</b><span>vues</span></div><div><b>' + (nN ? Math.round(okN / nN * 100) + " %" : "–") + '</b><span>réussite</span></div></div></div><div class="actions"><button class="btn primary" data-act="atelier" data-k="qcm10">10 questions, correction immédiate</button><button class="btn ghost" data-act="goto" data-v="examens">Examen blanc</button></div><p class="hint">Les questions les moins réussies reviennent en premier. Ouvre une question pour voir la réponse et l\'explication.</p><div>' + list + "</div></section>";
        }
      }
      return '<header class="top"><p class="eyebrow">Comprendre et rappeler</p><h1>Apprendre</h1></header>' + tabs + body;
    },
    ateliers() {
      const rw = rewritable().length;
      const grp = (m, rows) => '<section class="card"><div><p class="eyebrow">' + esc(m ? MODULES()[m].nom : "Transversal") + "</p>" + (m ? "<h3>" + esc(MODULES()[m].sous) + "</h3>" : "") + '</div><div class="rows">' + rows.join("") + "</div></section>";
      const best = k => { const d = S.drills[k]; return d && d.best ? "record " + d.best : "60 s"; };
      const sp = (k, title, sub) => rowb("sprint", k, title, sub, best(k), !DRILLS[k].ok());
      const nMar = P.breves.filter(b => b.src === "marianne").length, nCan = P.breves.filter(b => b.src === "canard").length;
      return '<header class="top"><p class="eyebrow">Produire et réagir</p><h1>Ateliers</h1></header>' + (P.empty ? packCta() : "") +
        grp(3, [rowb("atelier", "trois", "Trois arguments", "Le format de l'examen : tableau, puis trois arguments sur un conte.", "25 min", !P.textes.length), rowb("atelier", "arg", "Un argument sur la grille", "Un fait, une partie, un critère : réfute ou confirme.", "5 min", !textesFaits().length), sp("fautes", "Repère la faute", "Le « je », le commentaire de méthode, ou conforme ?")]) +
        grp(4, [rowb("atelier", "marianne", "Retitrer une brève de Marianne", nMar ? nMar + " brèves avec le titre paru et les propositions du cours." : "Aucune brève Marianne dans le pack.", "3 min", !nMar), rowb("atelier", "canard", "Titrer une Minimare", nCan ? nCan + " Minimares du Canard enchaîné, corrigés quand ils existent." : "Aucune Minimare dans le pack.", "3 min", !nCan), rowb("atelier", "titre", "Un titre sous contrainte", "Un sujet, une piste imposée, un seul titre.", "2 min", !SUJETS().length && !S.texts.length), rowb("atelier", "chrieday", "La chrie du jour", "Une parole entendue, en une seule phrase.", "3 min"), rowb("atelier", "recon", "Reconstitution", "Refais une chrie du cours à partir de A et de B.", "2 min", !has("chries")), rowb("atelier", "faux", "Chrie ou fausse chrie", "Tranche et justifie en une ou deux phrases.", "3 min", !has("enonces")), sp("chries", "Sprint : chrie ou fausse chrie", "Le verdict seul, au réflexe."), sp("titres", "Sprint : pistes de titres", "Les six pistes du cours.")]) +
        grp(1, [rowb("atelier", "qcm10", "Dix questions de QCM", "Correction immédiate, les moins réussies d'abord.", "6 min", !has("qcm")), sp("qcm", "Sprint : QCM éclair", "Autant de questions que possible en 60 secondes."), sp("qui", "Sprint : qui ?", "Corax, Socrate, Gorgias, Cicéron…"), '<button class="rowb" data-act="goto" data-v="apprendre" data-sub="app" data-subv="capsules"><span class="grow"><b>Capsules</b><span class="sub">Le piège de Socrate, Corax et Tisias.</span></span><span class="tag">2 min</span></button>']) +
        grp(2, [rowb("atelier", "brique", "Une brique de discours", "Exorde, narration, èthos, lieux, preuves.", "5 min", !has("affaires") || !has("briques")), sp("ethos", "Sprint : èthos athénien", "Qualités valorisées et dévalorisées."), sp("genres", "Sprint : genres et lieux", "Les trois genres, les trois types de lieux.")]) +
        grp(0, [sp("termes", "Sprint : grec et latin", "Anaskeuè, eikos, chreia…"), rowb("atelier", "rewrite", "Réécriture", rw ? plural(rw, "texte") + " à améliorer." : "Tes textes reviennent ici après 3 jours.", rw ? "5 min" : "")]);
    },
    examens() {
      const card = m => { const e = EXAMS[m], last = S.exams.find(x => x.mod === m), d = S.settings.dates[m] || "", D = Core.DEF.EXAMENS[m]; return '<section class="card"><div class="head"><div><p class="eyebrow">Examen blanc' + (D.confirme ? "" : " · format non confirmé") + "</p><h2>" + e.titre + "</h2></div>" + (last ? '<p class="big">' + fr(last.score) + "<small>/ 20, le " + fmtDate(last.t) + "</small></p>" : "") + '</div><ul class="pts">' + e.format().map(f => "<li>" + esc(f) + "</li>").join("") + "</ul>" + (e.note ? '<p class="hint">' + esc(e.note) + "</p>" : "") +
        (m === 1 ? '<div class="field">Nombre de questions' + seg("qcmn", S.settings.qcmN, [[20, "20"], [30, "30"], [40, "40"], [999, "Toutes"]]) + "</div>" : "") +
        (m === 3 ? '<div class="field">Introduction et conclusion' + seg("o3cadre", S.settings.o3cadre ? 1 : 0, [[1, "Demandées"], [0, "Non demandées"]]) + "</div>" : "") +
        '<label class="field" for="date' + m + '">Date de l\'épreuve<input type="date" id="date' + m + '" data-date="' + m + '" value="' + esc(d) + '"></label><button class="btn primary" data-act="exam" data-m="' + m + '"' + (e.ok() ? "" : " disabled") + ">Commencer</button>" + (e.ok() ? "" : '<p class="hint">Le pack ne contient pas encore le nécessaire pour cette épreuve.</p>') + "</section>"; };
      return '<header class="top"><p class="eyebrow">Se mesurer</p><h1>Examens</h1></header><p class="hint">Indique tes dates : les révisions se resserrent avant chaque épreuve.</p><div class="cols"><div class="col">' + card(1) + card(3) + '</div><div class="col">' + card(4) + card(2) + "</div></div>";
    },
    carnet() {
      const tabs = seg("carnet", UI.carnet, [["textes", "Mes textes"], ["missions", "Missions"], ["pack", "Pack de cours"], ["sauvegarde", "Sauvegarde"], ["reglages", "Réglages"]]);
      let body = "";
      if (UI.carnet === "textes") {
        const list = S.prods.filter(p => !UI.star || p.star);
        body = '<section class="card"><div class="head"><p class="eyebrow">' + plural(S.prods.length, "texte") + '</p><button class="btn small ghost" data-act="onlystar">' + (UI.star ? "Tout afficher" : "Florilège seul") + "</button></div>" +
          (list.length ? "<div>" + list.slice(0, 80).map(p => '<div class="prod"><div class="head"><div><p class="src">' + esc(KINDS[p.kind] || "Texte") + " · " + fmtDate(p.t) + (p.parent ? " · réécriture" : "") + "</p><h3>" + esc(p.title) + '</h3></div><span class="pill l' + (p.score >= 0.85 ? 3 : p.score >= 0.5 ? 2 : 1) + '">' + Math.round(p.score * 100) + ' %</span></div><blockquote class="mine">' + esc(p.text) + '</blockquote><div class="actions"><button class="btn small ghost" data-act="star" data-id="' + p.id + '">' + (p.star ? "Retirer du florilège" : "Garder au florilège") + "</button>" + (p.src && SPEC[p.kind] ? '<button class="btn small ghost" data-act="redo" data-id="' + p.id + '">Réécrire</button>' : "") + '<button class="btn small quiet" data-act="delprod" data-id="' + p.id + '">Supprimer</button></div></div>').join("") + "</div>" : '<p class="hint">' + (UI.star ? "Ton florilège est vide : garde ici tes meilleurs textes." : "Tes arguments, chries, titres et briques de discours s'enregistrent ici après chaque atelier.") + "</p>") + "</section>";
      } else if (UI.carnet === "missions") {
        const ok = S.journal.filter(j => j.done).length;
        body = '<section class="card"><p class="eyebrow">' + plural(ok, "réflexe vécu", "réflexes vécus") + "</p>" + (S.journal.length ? "<div>" + S.journal.map(j => '<div class="prod"><p class="src">' + new Date(j.day * 864e5).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " · " + (j.done ? "vécue" : "manquée") + "</p><p>" + esc(P.missions[j.idx] || "") + "</p>" + (j.note ? '<blockquote class="mine">' + esc(j.note) + "</blockquote>" : "") + "</div>").join("") + "</div>" : '<p class="hint">Chaque rituel se termine par une mission à vivre dans ta journée. Tes observations s\'écrivent ici.</p>') + "</section>";
      } else if (UI.carnet === "pack") {
        const v = PRAW ? Core.pack.validate(PRAW) : null;
        const st = v ? '<div class="stats"><div><b>' + v.stats.fiches + '</b><span>fiches</span></div><div><b>' + v.stats.qcm + '</b><span>questions QCM</span></div><div><b>' + v.stats.breves + '</b><span>brèves</span></div><div><b>' + v.stats.corriges + '</b><span>corrigées</span></div><div><b>' + v.stats.textes + '</b><span>textes</span></div><div><b>' + v.stats.chries + '</b><span>chries</span></div></div>' : "";
        body = '<section class="card"><p class="eyebrow">Pack de cours</p>' + (PRAW ? "<h2>" + esc(P.titre) + '</h2><p class="hint">' + (P.date ? "Version du " + esc(P.date) + ". " : "") + "Stocké sur cet appareil seulement, jamais dans le dépôt public.</p>" + st + (v && v.warnings.length ? '<details class="plain"><summary>' + plural(v.warnings.length, "avertissement") + '</summary><div class="body"><ul>' + v.warnings.slice(0, 20).map(w => "<li>" + esc(w) + "</li>").join("") + "</ul></div></details>" : "") : "<h2>Aucun pack installé.</h2><p class=\"hint\">Sans pack, l'appli propose les capsules, la chrie du jour et les sprints génériques. Importe <b>pack.json</b> pour les fiches, le QCM, les contes et les brèves.</p>") +
          '<label class="field" for="pk-file">Importer un fichier (pack.json ou sauvegarde)<input type="file" id="pk-file" accept=".json,application/json,text/plain"></label><details class="plain"><summary>Ou coller le contenu</summary><div class="body"><textarea id="pk-paste" rows="4" placeholder="{ &quot;format&quot;: &quot;palestre-pack/1&quot;, … }"></textarea><button class="btn ghost" data-act="pack-paste">Lire ce texte</button></div></details>' + (PRAW ? '<div class="actions"><button class="btn small quiet" data-act="pack-remove">Retirer le pack de cet appareil</button></div>' : "") + "</section>" +
          '<section class="card"><p class="eyebrow">Mes sujets</p><p class="hint">Ajoute à la main des brèves ou des Minimares (par exemple distribuées plus tard en cours). Elles complètent les questions 5 et 6 de l\'examen blanc et l\'atelier des titres.</p><label class="field" for="nt-kind">Type<select id="nt-kind"><option value="breve">Brève de presse (Marianne, Charlie Hebdo)</option><option value="minimare">Minimare (Canard enchaîné)</option></select></label><label class="field" for="nt-text">Texte<textarea id="nt-text" rows="4" placeholder="Colle le texte sans son titre."></textarea></label><button class="btn primary" data-act="addtext">Ajouter</button>' +
          (S.texts.length ? '<div>' + S.texts.map(x => '<div class="prod"><p class="src">' + (x.kind === "minimare" ? "Minimare" : "Brève de presse") + '</p><p class="clamp">' + esc(x.text) + '</p><div class="actions"><button class="btn small quiet" data-act="deltext" data-id="' + x.id + '">Supprimer</button></div></div>').join("") + "</div>" : "") + "</section>";
      } else if (UI.carnet === "sauvegarde") {
        body = '<section class="card"><p class="eyebrow">Entre tes appareils</p><p class="status ' + (storageOK ? "" : "err") + '">' + (storageOK ? "Enregistrement automatique sur cet appareil." : "Cet appareil refuse l'enregistrement local : exporte ta sauvegarde avant de fermer.") + '</p><p class="hint">Exporte depuis l\'iPhone, envoie-toi le fichier (AirDrop, Fichiers, Mail), puis importe-le sur l\'iPad en choisissant « Fusionner » : le meilleur des deux progressions est conservé.</p><div class="actions"><button class="btn primary" data-act="export" data-v="etat">Exporter la progression</button>' + (PRAW ? '<button class="btn ghost" data-act="export" data-v="pack">Exporter progression et pack</button>' : "") + '</div><label class="field" for="imp-file">Importer un fichier<input type="file" id="imp-file" accept=".json,application/json,text/plain"></label><div class="actions"><button class="btn ghost" data-act="importpaste">Restaurer en collant</button></div></section>' +
          '<section class="card"><p class="eyebrow">Remise à zéro</p><p class="hint">Efface la progression, le carnet et tes sujets. Le pack de cours reste.</p><div class="actions"><button class="btn danger" data-act="reset">Tout effacer</button></div></section>';
      } else {
        body = '<section class="card"><p class="eyebrow">Confort</p><div class="field">Son de retour (iOS n\'a pas de vibration pour le web)' + seg("son", S.settings.son ? 1 : 0, [[1, "Activé"], [0, "Coupé"]]) + '</div><div class="field">Animations' + seg("anim", S.settings.anim, [["auto", "Selon l'appareil"], ["off", "Réduites"]]) + '</div><p class="hint">' + (mq.matches ? "Ton appareil demande des animations réduites : les capsules avancent sans transition et sans lecture automatique." : "Les capsules enchaînent les scènes en douceur ; choisis « Réduites » pour des changements instantanés.") + '</p><div class="field">Thème' + seg("theme", S.settings.theme, [["auto", "Automatique"], ["light", "Clair"], ["dark", "Sombre"]]) + "</div></section>" +
          '<section class="card"><p class="eyebrow">À propos</p><p class="hint">Palestre Orator ' + Core.version + " · " + (standalone() ? "installée sur l'écran d'accueil" : "ouverte dans le navigateur") + (SW.state ? " · " + SW.state : "") + '.</p><p class="hint">Le code de l\'appli est public ; les textes des cours (A. Rehbinder, C. Bréchet) restent dans ton pack privé, sur tes appareils. Les barèmes marqués « non confirmé » ne figurent pas dans les documents du cours.</p></section>';
      }
      return '<header class="top"><p class="eyebrow">Relire et garder</p><h1>Carnet</h1></header>' + tabs + body;
    }
  };

  const TABS = Object.keys(VIEWS);
  function render() {
    const raw = location.hash.replace("#", ""), h = raw.split("?")[0], qs = raw.split("?")[1];
    if (TABS.includes(h)) UI.tab = h;
    if (qs) { const q = {}; qs.split("&").forEach(kv => { const [k, v] = kv.split("="); q[k] = decodeURIComponent(v || ""); }); if (q.cap && capOf(q.cap)) { UI.app = "capsules"; UI.cap = q.cap; UI.capK = 0; } if (q.app) UI.app = q.app; if (q.carnet) UI.carnet = q.carnet; if (q.mod) UI.mod = +q.mod; }
    $$("#nav a").forEach(a => a.classList.toggle("on", a.dataset.tab === UI.tab));
    $("#view").innerHTML = VIEWS[UI.tab]();
    if (UI.tab === "apprendre" && UI.app === "capsules" && UI.cap) capMount();
  }

  /* ================= Feuille, toast, événements ================= */
  function sheet(html) { $("#sheet-box").innerHTML = html; $("#sheet").hidden = false; }
  function closeSheet() { $("#sheet").hidden = true; $("#sheet-box").innerHTML = ""; }
  let toastT;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 3000); }

  document.addEventListener("click", ev => {
    const nav = ev.target.closest("#nav a");
    if (nav) { ev.preventDefault(); UI.tab = nav.dataset.tab; UI.cap = null; capAuto(false); try { location.hash = nav.dataset.tab; } catch (e) { /* sans hash */ } render(); window.scrollTo(0, 0); return; }
    if (ev.target.id === "sheet") return closeSheet();
    const el = ev.target.closest("[data-act]");
    if (el && !el.disabled && ACT[el.dataset.act]) ACT[el.dataset.act](el, ev);
  });
  document.addEventListener("input", ev => { if (ev.target.id === "w-text") { const b = $("#w-done"); if (b) b.disabled = !ev.target.value.trim(); } });
  document.addEventListener("change", ev => {
    const t = ev.target;
    if (t.dataset && t.dataset.date) { if (t.value) S.settings.dates[t.dataset.date] = t.value; else delete S.settings.dates[t.dataset.date]; save(); toast(t.value ? "Date enregistrée." : "Date retirée."); }
    if (t.id === "imp-file" && t.files && t.files[0]) readFileInput(t.files[0], importData);
    if (t.id === "pk-file" && t.files && t.files[0]) readFileInput(t.files[0], importPack);
  });
  window.addEventListener("hashchange", () => { if (!R) render(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !R) render(); });
  if (mq.addEventListener) mq.addEventListener("change", () => { applyPrefs(); if (!R) render(); });

  /* ================= Hors ligne ================= */
  const SW = { state: "" };
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").then(reg => {
      SW.state = "hors ligne prête";
      reg.addEventListener("updatefound", () => { const w = reg.installing; if (!w) return; w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) toast("Nouvelle version prête : ferme et rouvre l'appli."); }); });
    }).catch(() => { SW.state = "hors ligne indisponible"; });
  }

  applyPrefs();
  render();
  if (migrated) { save(); toast("Progression de la V1 récupérée."); }
  window.Palestre = { get S() { return S; }, get P() { return P; }, VIEWS, STEP, ACT, startFlow, render, importPack, importData, DRILLS, SPEC, EXAMS, ATELIERS, mkArg, mkTrois, mkBreve, mkTitre, mkBrique, mkRecon, pickEnonces, UI, get R() { return R; } };
})();
