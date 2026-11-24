/* Palestre Orator V2 — cœur logique, sans DOM.
   Chargé par app.js (navigateur) et par tests/run.js (jsc). Tout est pur : pas d'accès au stockage ni à l'écran. */
(function (root) {
  "use strict";
  const Core = { version: "2.0.0", format: "palestre-pack/1", stateVersion: 2 };

  /* ================= Utilitaires ================= */
  let rng = Math.random;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rnd = n => Math.floor(rng() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = a => Array.from(new Set(a));
  const dayNum = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  const dayKey = n => new Date(n * 864e5).toISOString().slice(0, 10);
  const dayFromKey = k => { const p = String(k).split("-").map(Number); return p.length === 3 && p.every(x => !isNaN(x)) ? Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5) : null; };
  const fmtDate = ts => new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const fr = n => String(Math.round(n * 100) / 100).replace(".", ",");
  const q25 = n => Math.round(n * 4) / 4;
  const mmss = ms => { const s = Math.floor(Math.abs(ms) / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const plural = (n, s, p) => n + " " + (n > 1 ? (p || s + "s") : s);
  const words = t => (String(t).toLowerCase().match(/[\p{L}]+(?:['’][\p{L}]+)?/gu) || []);
  const unquote = t => String(t).replace(/«[^»]*»|"[^"]*"|“[^”]*”/g, " ");
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const newId = (p = "p") => p + Date.now().toString(36) + rnd(46656).toString(36);
  const isMulti = t => /\n|\s\/\s|\s\|\s|;/.test(String(t).trim());
  Core.util = { esc, rnd, pick, shuffle, uniq, dayNum, dayKey, dayFromKey, fmtDate, fr, q25, mmss, plural, words, unquote, clamp, newId, isMulti };
  Core.setRng = f => { rng = typeof f === "function" ? f : Math.random; };

  /* ================= Repères méthodologiques publics =================
     Ce qui suit décrit la méthode des épreuves, pas le texte des cours : ces repères sont publics
     et peuvent être remplacés par le pack privé. */
  Core.DEF = {
    MODULES: {
      1: { nom: "Orator 1", sous: "Histoire et théorie de la rhétorique", prof: "A. Rehbinder" },
      2: { nom: "Orator 2", sous: "Lieux communs et discours", prof: "A. Rehbinder" },
      3: { nom: "Orator 3", sous: "Confirmation et réfutation", prof: "C. Bréchet" },
      4: { nom: "Orator 4", sous: "La chrie, antique et moderne", prof: "C. Bréchet" }
    },
    PARTIES: [
      { nom: "la personne", q: "qui agit ?", c: "Pers." }, { nom: "l'action", q: "que fait-elle ?", c: "Action" },
      { nom: "le lieu", q: "où ?", c: "Lieu" }, { nom: "le temps", q: "quand ?", c: "Temps" },
      { nom: "la manière", q: "comment ?", c: "Man." }, { nom: "la cause", q: "pourquoi ?", c: "Cause" }
    ],
    CRITERES: [
      { pos: "le vraisemblable", neg: "l'invraisemblable", c: "Vrais." }, { pos: "l'habituel", neg: "l'inhabituel", c: "Habit." },
      { pos: "le possible", neg: "l'impossible", c: "Poss." }, { pos: "le naturel", neg: "le non-naturel", c: "Natur." },
      { pos: "le juste", neg: "l'injuste", c: "Juste" }, { pos: "l'utile", neg: "l'inutile", c: "Utile" },
      { pos: "le convenable", neg: "l'inconvenant", c: "Conv." }, { pos: "le facile", neg: "le difficile", c: "Facile" },
      { pos: "la cohérence textuelle", neg: "l'incohérence textuelle", c: "Texte" }
    ],
    CATEGORIES: [
      { c: "Simple mot", nom: "Simple(s) mot(s) correspondant au texte" },
      { c: "Expression toute faite", nom: "Expression toute faite, lexicalisée, ou variation" },
      { c: "Latin ou grec", nom: "En latin ou en grec, ou variation sur une expression connue" },
      { c: "Titre d'œuvre", nom: "Titre de film, livre, chanson, émission, jeu, ou variation" },
      { c: "Autre référence connue", nom: "Autre référence connue" },
      { c: "Création sur mesure", nom: "Création sur mesure, jeu de mots" }
    ],
    REGLES_CHRIE: ["Une seule phrase", "Un personnage précis (A)", "Une parole ou une action insigne (B)", "Aucun commentaire personnel"],
    EXAMENS: {
      1: { duree: 60, forme: "QCM d'une heure, questions uniquement sur le cours.", confirme: true },
      2: { duree: null, forme: "Discours employant des lieux communs et des arguments fondés sur les lieux.", confirme: false, note: "Aucun barème chiffré dans les documents du cours : la grille ci-dessous est un repère d'entraînement, non confirmé." },
      3: { duree: 60, forme: "Épreuve écrite d'une heure : confirmation ou réfutation d'un conte. Introduction succincte, trois arguments et seulement trois, conclusion succincte (pas toujours demandées).", confirme: true },
      4: { duree: 60, forme: "Épreuve écrite d'une heure, sur 20 : Q1 définition (3), Q2 chries et fausses chries (2), Q3 comparaison (5), Q4 titres de chries de 1974 (2), Q5 titres Marianne 4 sur 8 (4), Q6 titres Minimares 4 sur 8 (4).", confirme: true, pts: { q1: 3, q2: 2, q3: 5, q4: 2, q5: 4, q6: 4 } }
    },
    MISSIONS: [
      "Repère un « qui peut le plus peut le moins » dans une conversation, une réunion ou une publicité.",
      "Écoute quelqu'un se présenter : quelle qualité met-il en avant pour se concilier son auditoire ?",
      "Devant un récit qu'on te fait, pose-toi en silence les six questions : qui, quoi, où, quand, comment, pourquoi. Laquelle reste sans réponse ?",
      "Prends un fait que tout le monde admet autour de toi et cherche-lui une faille avec un seul critère : l'habituel.",
      "Note une phrase entendue aujourd'hui qui mérite de passer à la postérité. Ce soir, mets-la en chrie.",
      "Lis un titre de presse : dans laquelle des six pistes de titres se range-t-il ?",
      "Avant de demander quelque chose à quelqu'un, prépare ton exorde : parleras-tu de toi, de lui, ou de la cause ?",
      "Repère un moment où quelqu'un croit savoir sans avoir conscience de croire.",
      "Devant un sujet que tu maîtrises mal, effleure-le avec méthode et consulte un expert.",
      "Une fois dans la journée, remplace un « je pense que » par une question qui porte l'argument.",
      "Dans une affaire du jour, distingue ce qui est vraisemblable de ce qui est un indice matériel.",
      "Passe une décision de ta journée au crible de deux critères : l'utile, puis le facile.",
      "Repère un discours contourné, captieux, et nomme la figure qu'il cache.",
      "Confirme au lieu de réfuter : défends la vraisemblance d'un récit qui te semblait douteux.",
      "Cherche un titre en latin pour un événement de ta journée.",
      "Dans un désaccord, repère si l'on discute du juste, de l'utile ou du convenable.",
      "Résume une réunion en une seule phrase : qui, et quelle parole insigne ?",
      "Lis une brève satirique : où bascule-t-elle ? Isole A, B, puis C."
    ]
  };

  /* ================= Répétition espacée ================= */
  const IV = [0, 1, 3, 7, 16, 35, 80, 180];
  const LEVELS = ["À découvrir", "En cours", "Ancré", "Réflexe"];
  const level = b => (b >= 5 ? 3 : b >= 3 ? 2 : b >= 1 ? 1 : 0);
  function grade(cs, ratio, today, examDay) {
    const c = Object.assign({ b: 0, due: 0, n: 0 }, cs || {});
    let iv;
    if (ratio >= 0.85) { c.b = Math.min(7, (c.b || 0) + 1); iv = IV[c.b]; }
    else if (ratio >= 0.5) { c.b = Math.max(1, c.b || 1); iv = Math.max(1, Math.round(IV[c.b] / 2)); }
    else { c.b = 1; iv = 1; }
    c.due = today + iv;
    if (examDay != null && examDay > today && c.due > examDay - 2) c.due = Math.max(today + 1, examDay - 2);
    c.n = (c.n || 0) + 1; c.last = today;
    return c;
  }
  const dueCards = (cards, states, today, mod) => cards.filter(c => (!mod || c.m === mod) && states[c.id] && states[c.id].due <= today).sort((a, b) => states[a.id].due - states[b.id].due);
  function pickCards(cards, states, n, today, examDays, mod) {
    examDays = examDays || {};
    const out = dueCards(cards, states, today, mod).slice(0, n);
    if (out.length < n) {
      const byM = {};
      cards.filter(c => (!mod || c.m === mod) && !states[c.id]).forEach(c => (byM[c.m] = byM[c.m] || []).push(c));
      const ms = Object.keys(byM).sort((a, b) => (examDays[a] || 1e9) - (examDays[b] || 1e9));
      let i = 0;
      while (out.length < n && ms.some(m => byM[m].length)) { const m = ms[i % ms.length]; if (byM[m].length) out.push(byM[m].shift()); i++; }
    }
    if (out.length < n) {
      const st = id => states[id] || { due: 0 };
      const rest = cards.filter(c => (!mod || c.m === mod) && !out.includes(c)).sort((a, b) => st(a.id).due - st(b.id).due);
      out.push(...rest.slice(0, n - out.length));
    }
    return out;
  }
  function mastery(cards, states, mod) { const k = [0, 0, 0, 0]; cards.filter(c => c.m === mod).forEach(c => k[level((states[c.id] || {}).b || 0)]++); return k; }
  Core.srs = { IV, LEVELS, level, grade, dueCards, pickCards, mastery };

  /* ================= Assiduité ================= */
  function streak(days, today) {
    let d = today, n = 0, lastGap = null;
    if (!days[d]) d--;
    for (let guard = 0; guard < 4000; guard++) {
      if (days[d]) { n++; d--; }
      else if (days[d - 1] && (lastGap === null || lastGap - d >= 7)) { lastGap = d; d--; }
      else break;
    }
    return n;
  }
  Core.streak = streak;

  /* ================= Relecteur ================= */
  const firstPerson = t => uniq(words(t).filter(w => /^(je|moi|me|mon|ma|mes)$/.test(w) || /^[jm]['’]/.test(w)));
  const RE_METHODE = /nous (allons|contesterons|montrerons|verrons|examinerons|réfuterons|confirmerons|utiliserons)|argument d[eu'’]|\bcritère|partie de la narration|on appliquera|cet argument|(premier|deuxième|second|troisième|dernier) argument|dans un premier temps|notre (réfutation|confirmation)/i;
  const LINT = {
    arg(t) {
      const out = [], fp = firstPerson(t), m = t.match(RE_METHODE), n = words(t).length;
      out.push(fp.length ? { k: "bad", m: "Première personne repérée : « " + fp.join(", ") + " ». Efface-toi derrière le jeu de l'argumentation." } : { k: "good", m: "Aucun « je »." });
      out.push(m ? { k: "bad", m: "Commentaire de méthode repéré : « " + m[0] + " ». Entre directement dans l'argument : la partie et le critère vont dans le tableau, pas dans le texte." } : { k: "good", m: "Pas de commentaire de méthode." });
      const tours = [];
      if (/\bsi\b[^.?!]*\balors\b/i.test(t)) tours.push("hypothèse");
      if (/ou bien/i.test(t)) tours.push("alternative");
      if (/\?/.test(t)) tours.push("question");
      out.push(tours.length ? { k: "good", m: "Tournure repérée : " + tours.join(", ") + "." } : { k: "info", m: "Pense aux tournures : « si…, alors… », « ou bien…, ou bien… », ou une question qui porte l'argument." });
      out.push(/«[^»]+»/.test(t) ? { k: "good", m: "Citation du texte insérée." } : { k: "info", m: "Appuie l'argument sur le texte : insère une citation entre guillemets." });
      if (n < 25) out.push({ k: "info", m: "C'est court (" + plural(n, "mot") + ") : vise 10 à 15 lignes à l'examen." });
      if (n > 260) out.push({ k: "info", m: "C'est long pour un seul argument (" + n + " mots) : 10 à 15 lignes suffisent." });
      return out;
    },
    chrie(t) {
      const out = [], bare = unquote(t), ends = (bare.match(/[.!?…]+/g) || []).length, fp = firstPerson(bare);
      out.push(ends > 1 ? { k: "bad", m: "Plusieurs phrases repérées : la chrie tient en une seule phrase, un seul système syntaxique." } : { k: "good", m: "Une seule phrase." });
      const caps = bare.trim().split(/\s+/).slice(1).filter(w => /^\p{Lu}\p{L}/u.test(w)).length;
      const starters = /^(à|a|au|aux|en|quand|le|la|les|un|une|lors|comme|pour|dans|celui|celle|quelqu'un|quelqu’un|on|il|elle|interrogé|interrogée|face|devant|un jour)(?=\s|$)/i;
      out.push(caps > 0 || !starters.test(bare.trim()) ? { k: "good", m: "Un personnage nommé (A)." } : { k: "bad", m: "Aucun nom propre repéré : la chrie exige un personnage précis (A)." });
      out.push(/[«"“]/.test(t) || /\b(déclara|répondit|répliqua|lança|dit|rétorqua|s'écria|affirma|frappa|fit)\b/i.test(t) ? { k: "good", m: "Une parole ou une action rapportée (B)." } : { k: "info", m: "Pas de parole rapportée repérée : vérifie que l'action insigne (B) est bien là." });
      const com = bare.match(/ce qui (montre|prouve|reste|est)|c'est pourquoi|quelle leçon|on voit bien|à mon avis/i);
      out.push(fp.length || com ? { k: "bad", m: "Commentaire personnel repéré" + (com ? " : « " + com[0] + " »" : " : « " + fp.join(", ") + " »") + ". La chrie n'en admet aucun." } : { k: "good", m: "Aucun commentaire personnel repéré." });
      const n = words(t).length;
      if (n > 60) out.push({ k: "info", m: "C'est long (" + n + " mots) : ni trop en dire, ni trop peu." });
      return out;
    },
    titre(t, src) {
      const out = [], n = words(t).length;
      out.push(isMulti(t) ? { k: "bad", m: "Plusieurs titres repérés. À l'examen : malus automatique d'1 point." } : { k: "good", m: "Un seul titre." });
      if (n > 9) out.push({ k: "info", m: "Un titre de " + n + " mots : cherche plus bref." });
      if (src) {
        const stem = w => w.replace(/(s|x)$/, "");
        const sw = new Set(words(src).map(stem).filter(w => w.length > 3));
        const commun = uniq(words(t).filter(w => stem(w).length > 3 && sw.has(stem(w))));
        out.push(commun.length ? { k: "bad", m: "Redondant avec le texte : « " + commun.join(", ") + " »." } : { k: "good", m: "Aucun mot repris du texte." });
      }
      return out;
    },
    brique(t, b) {
      const out = [], n = words(t).length;
      if (b === "preuves") {
        [["eikos", /\[\s*eikos\s*\]/i], ["sèmeion", /\[\s*s[èeé]meion\s*\]/i], ["exemple", /\[\s*exemple\s*\]/i]].forEach(x =>
          out.push(x[1].test(t) ? { k: "good", m: "Signalé en marge : [" + x[0] + "]." } : { k: "bad", m: "Il manque la mention [" + x[0] + "]." }));
      }
      if (b === "plusmoins") out.push(/à plus forte raison|a fortiori|peut bien|d'autant plus|encore moins|encore plus|comment (n'|ne )/i.test(t) ? { k: "good", m: "Tournure du plus et du moins repérée." } : { k: "info", m: "Fais entendre le schéma : « s'il a pu…, il a bien pu… », « à plus forte raison »." });
      out.push({ k: "info", m: plural(n, "mot") + "." });
      return out;
    },
    // Trois arguments : chacun une partie différente, au moins deux critères, texte cité, pas de « je ».
    trois(args) {
      const out = [], done = args.filter(a => a.t && a.t.trim());
      const parts = done.map(a => String(a.p)).filter(x => x !== "" && x !== "undefined" && x !== "null");
      out.push(done.length === 3 ? { k: "good", m: "Trois arguments, et seulement trois." } : done.length > 3 ? { k: "bad", m: done.length + " arguments : au-delà de trois, c'est hors sujet et sanctionné." } : { k: "info", m: plural(done.length, "argument rédigé", "arguments rédigés") + " sur 3." });
      out.push(uniq(parts).length === parts.length && parts.length === done.length ? { k: "good", m: "Chaque argument porte sur une partie différente de la narration." } : { k: "bad", m: "Deux arguments portent sur la même partie, ou une partie n'est pas renseignée dans le tableau." });
      const twoCrit = done.every(a => Array.isArray(a.c) ? uniq(a.c.map(String)).length >= 2 : false);
      out.push(twoCrit ? { k: "good", m: "Au moins deux critères par argument." } : { k: "bad", m: "Chaque argument repose sur au moins deux critères différents : complète le tableau." });
      const cit = done.filter(a => /«[^»]+»/.test(a.t)).length;
      out.push(cit === done.length && done.length ? { k: "good", m: "Chaque argument cite le texte." } : { k: "info", m: "Cite le texte dans chaque argument (« … »), avec les procédés d'insertion." });
      const je = done.filter(a => firstPerson(a.t).length).length;
      out.push(je ? { k: "bad", m: "« Je » ou « nous » repéré dans " + plural(je, "argument") + "." } : { k: "good", m: "Aucun « je »." });
      const liens = done.filter(a => /^(tout d'abord|d'abord|ensuite|enfin|de plus|en outre|par ailleurs|puis)\b/i.test(a.t.trim())).length;
      if (done.length >= 2) out.push(liens >= Math.min(2, done.length) ? { k: "good", m: "Les enchaînements sont marqués." } : { k: "info", m: "Marque les enchaînements (tout d'abord, ensuite, enfin) et varie-les : variatio." });
      return out;
    }
  };
  Core.lint = LINT;

  /* ================= Notation ================= */
  // QCM : réponses = index ou tableau d'index. Note sur 20 arrondie au quart, sans point négatif (règle non confirmée : aucun malus).
  function qcmScore(questions, answers) {
    let ok = 0;
    questions.forEach((q, i) => { if (qcmRight(q, answers[i])) ok++; });
    const n = questions.length;
    return { ok, n, note: n ? q25(ok / n * 20) : 0, pct: n ? Math.round(ok / n * 100) : 0 };
  }
  function qcmRight(q, a) {
    const good = Array.isArray(q.a) ? q.a.slice().sort().join(",") : String(q.a);
    const mine = a == null ? "" : Array.isArray(a) ? a.slice().sort().join(",") : String(a);
    return mine !== "" && good === mine;
  }
  // Titres : chaque titre 0 à 1 par quarts ; −1 par proposition au-delà de `need` ; −1 par extrait à plusieurs titres.
  function titresScore(titres, notes, need, ptsTotal) {
    const filled = titres.map((t, k) => (t && t.trim() ? k : -1)).filter(k => k >= 0);
    const kept = filled.slice(0, need), extra = Math.max(0, filled.length - need);
    let sum = 0;
    kept.forEach(k => { sum += notes[k] || 0; });
    const multi = kept.filter(k => isMulti(titres[k])).length;
    const brut = sum * (ptsTotal / need), malus = extra + multi;
    return { kept, extra, multi, brut, malus, pts: Math.max(0, brut - malus) };
  }
  // Orator 3 : barème d'entraînement (non confirmé) : chaque argument sur 5, structure 3, langue 2.
  function o3Score(notes, extras) {
    const args = notes.slice(0, 3).reduce((a, v) => a + (v || 0) * 5, 0);
    const struct = (extras.tableau ? 1 : 0) + (extras.variatio ? 1 : 0) + (extras.citations ? 1 : 0);
    return { args, struct, langue: (extras.langue || 0) * 2, pts: q25(args + struct + (extras.langue || 0) * 2) };
  }
  Core.score = { qcm: qcmScore, qcmRight, titres: titresScore, o3: o3Score };

  /* ================= Pack privé : validation et normalisation ================= */
  const isStr = x => typeof x === "string" && x.trim().length > 0;
  const arr = x => Array.isArray(x) ? x : [];
  function validatePack(p) {
    const errors = [], warnings = [];
    if (!p || typeof p !== "object") return { ok: false, errors: ["Ce fichier n'est pas un pack Palestre."], warnings, stats: {} };
    if (p.format !== Core.format) errors.push("Format attendu : " + Core.format + " (reçu : " + (p.format || "aucun") + ").");
    const ids = new Set();
    const checkIds = (list, nom) => arr(list).forEach((x, i) => { if (!x || !isStr(x.id)) errors.push(nom + "[" + i + "] : identifiant manquant."); else if (ids.has(nom + x.id)) errors.push(nom + " : identifiant en double « " + x.id + " »."); else ids.add(nom + x.id); });
    checkIds(p.fiches, "fiches"); checkIds(p.qcm, "qcm"); checkIds(p.breves, "breves"); checkIds(p.textes, "textes"); checkIds(p.chries, "chries"); checkIds(p.affaires, "affaires");
    arr(p.fiches).forEach((f, i) => { if (![1, 2, 3, 4].includes(f.m)) errors.push("fiches[" + i + "] : module invalide."); if (!isStr(f.q) || !arr(f.p).length) errors.push("fiches[" + i + "] : question ou éléments attendus manquants."); });
    arr(p.qcm).forEach((q, i) => {
      if (!isStr(q.q)) errors.push("qcm[" + i + "] : énoncé manquant.");
      if (arr(q.choix).length < 2) errors.push("qcm[" + i + "] : au moins deux choix.");
      const as = Array.isArray(q.a) ? q.a : [q.a];
      if (!as.length || as.some(a => typeof a !== "number" || a < 0 || a >= arr(q.choix).length)) errors.push("qcm[" + i + "] : réponse hors des choix.");
      if (!isStr(q.why)) warnings.push("qcm[" + i + "] : pas d'explication (why).");
    });
    arr(p.breves).forEach((b, i) => {
      if (!["marianne", "canard", "charlie"].includes(b.src)) errors.push("breves[" + i + "] : source inconnue (marianne, canard, charlie).");
      if (!isStr(b.texte)) errors.push("breves[" + i + "] : texte manquant.");
      if (b.src === "marianne" && !isStr(b.titre)) warnings.push("breves[" + i + "] : brève Marianne sans titre d'origine.");
      arr(b.corrige).forEach((c, j) => { if (typeof c.cat !== "number" || c.cat < 1 || c.cat > 6) errors.push("breves[" + i + "].corrige[" + j + "] : catégorie 1 à 6 attendue."); if (!isStr(c.t)) errors.push("breves[" + i + "].corrige[" + j + "] : titre manquant."); });
    });
    arr(p.textes).forEach((t, i) => { if (!isStr(t.titre)) errors.push("textes[" + i + "] : titre manquant."); if (!arr(t.faits).length && !arr(t.texte).length) errors.push("textes[" + i + "] : ni faits ni texte."); });
    arr(p.enonces).forEach((e, i) => { if (!isStr(e.t) || typeof e.r !== "number") errors.push("enonces[" + i + "] : texte ou règle manquants."); });
    arr(p.titres).forEach((t, i) => { if (!Array.isArray(t) || !isStr(t[0]) || typeof t[1] !== "number" || t[1] < 0 || t[1] > 5) errors.push("titres[" + i + "] : [titre, catégorie 0-5, sujet?] attendu."); });
    if (p.ethos && arr(p.ethos).length !== 8) warnings.push("ethos : 8 qualités attendues (4 valorisées, 4 dévalorisées).");
    const stats = { fiches: arr(p.fiches).length, qcm: arr(p.qcm).length, breves: arr(p.breves).length, corriges: arr(p.breves).filter(b => arr(b.corrige).length).length, textes: arr(p.textes).length, chries: arr(p.chries).length, enonces: arr(p.enonces).length, titres: arr(p.titres).length };
    return { ok: errors.length === 0, errors, warnings, stats };
  }
  function normalizeQuestion(question) {
    const q = { ...question, m: question.m ? +question.m : 1 };
    if (q.cours !== "c6" || !Array.isArray(q.choix)) return q;
    if (q.id === "c6-08" && /responsabilité de Néron/i.test(q.q)) {
      q.q = "Quelle distinction faire à propos de l’incendie de Rome en 64 ?";
      q.choix = ["Le portrait du tyran suffit à établir qui a déclenché l’incendie.", "La mise en cause de Néron relève du récit et ne démontre pas sa responsabilité.", "Le récit de l’incendie prouve que Néron est resté à Rome.", "Les deux historiens décrivent l’incendie en témoins directs."];
      q.a = 1;
      q.why = "Le cours étudie la construction du portrait du tyran. Il présente une interprétation de l’incendie, dont la cause reste incertaine.";
    }
    if (q.id === "c6-18" && /panégyrique de Pline/i.test(q.q)) {
      q.choix = ["Lors de l’éloge funèbre de Trajan", "Lors de l’entrée en charge de Pline comme consul", "Lors d’un triomphe militaire de Trajan", "Lors de l’inauguration du forum de Trajan"];
      q.a = 1;
      q.why = "Le discours de remerciement date de l’an 100 et a été remanié pour la publication. Les références divergent sur le jour donné dans le support.";
    }
    return q;
  }
  function normalizePack(p) {
    p = p || {};
    const D = Core.DEF;
    const out = {
      format: Core.format, titre: p.titre || "Pack de cours", date: p.date || "", source: p.source || "",
      modules: Object.assign({}, D.MODULES, p.modules || {}),
      parties: arr(p.parties).length ? p.parties : D.PARTIES,
      criteres: arr(p.criteres).length ? p.criteres : D.CRITERES,
      categories: arr(p.categories).length === 6 ? p.categories : D.CATEGORIES,
      regles: arr(p.regles).length === 4 ? p.regles : D.REGLES_CHRIE,
      missions: arr(p.missions).length ? p.missions : D.MISSIONS,
      fiches: arr(p.fiches), qcm: arr(p.qcm).map(normalizeQuestion), breves: arr(p.breves), textes: arr(p.textes), modeles: arr(p.modeles),
      chries: arr(p.chries), enonces: arr(p.enonces), titres: arr(p.titres), fautes: arr(p.fautes),
      ethos: arr(p.ethos), captatio: arr(p.captatio), affaires: arr(p.affaires), briques: arr(p.briques),
      termes: arr(p.termes), qui: arr(p.qui), genres: arr(p.genres), lieux: arr(p.lieux),
      devoirs: p.devoirs || {}, notes: p.notes || {}
    };
    out.fiches.forEach(f => { f.m = +f.m; });
    out.empty = !out.fiches.length && !out.qcm.length && !out.breves.length && !out.textes.length;
    return out;
  }
  Core.pack = { validate: validatePack, normalize: normalizePack, empty: () => normalizePack({}) };

  /* ================= État : création, adoption, migration, fusion ================= */
  const fresh = () => ({
    v: Core.stateVersion, updatedAt: 0, cards: {}, grid: {}, drills: {}, qcm: {}, breves: {}, caps: {},
    prods: [], days: {}, mission: null, journal: [], texts: [], exams: [], lastAt: {}, ritualDay: 0,
    settings: { len: 10, dates: {}, son: true, anim: "auto", theme: "auto", qcmN: 20, o3cadre: true }
  });
  function adopt(o) {
    const s = Object.assign(fresh(), o || {});
    s.v = Core.stateVersion;
    s.settings = Object.assign(fresh().settings, s.settings || {});
    s.settings.dates = s.settings.dates || {};
    ["cards", "grid", "drills", "qcm", "breves", "caps", "days", "lastAt"].forEach(k => { if (!s[k] || typeof s[k] !== "object") s[k] = {}; });
    ["prods", "journal", "texts", "exams"].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
    delete s.settings.bareme;
    return s;
  }
  const looksLikeState = o => !!(o && typeof o === "object" && o.cards && typeof o.cards === "object" && Array.isArray(o.prods));
  // Fusion de deux progressions (autre appareil) : on garde le plus avancé de chaque fiche, l'union des textes.
  function merge(a, b) {
    const s = adopt(JSON.parse(JSON.stringify(a)));
    b = adopt(b);
    Object.keys(b.cards).forEach(id => { const x = s.cards[id], y = b.cards[id]; if (!x || (y.last || 0) > (x.last || 0) || (y.last === x.last && (y.b || 0) > (x.b || 0))) s.cards[id] = y; });
    Object.keys(b.qcm).forEach(id => { const x = s.qcm[id], y = b.qcm[id]; if (!x || (y.last || 0) > (x.last || 0)) s.qcm[id] = y; });
    Object.keys(b.grid).forEach(k => { s.grid[k] = Math.max(s.grid[k] || 0, b.grid[k] || 0); });
    Object.keys(b.drills).forEach(k => { const x = s.drills[k] || { best: 0, n: 0 }, y = b.drills[k]; s.drills[k] = { best: Math.max(x.best || 0, y.best || 0), n: Math.max(x.n || 0, y.n || 0) }; });
    Object.keys(b.breves).forEach(k => { const x = s.breves[k], y = b.breves[k]; if (!x || (y.last || 0) > (x.last || 0)) s.breves[k] = y; });
    Object.keys(b.caps).forEach(k => { s.caps[k] = Object.assign({}, b.caps[k], s.caps[k]); });
    Object.keys(b.days).forEach(d => { s.days[d] = Math.max(s.days[d] || 0, b.days[d] || 0); });
    const byId = list => { const m = new Map(); list.forEach(x => m.set(x.id, x)); return m; };
    const pm = byId(s.prods); b.prods.forEach(p => { if (!pm.has(p.id)) s.prods.push(p); });
    s.prods.sort((x, y) => y.t - x.t); if (s.prods.length > 400) s.prods.length = 400;
    const tm = byId(s.texts); b.texts.forEach(t => { if (!tm.has(t.id)) s.texts.push(t); });
    const jk = new Set(s.journal.map(j => j.day + ":" + j.idx)); b.journal.forEach(j => { if (!jk.has(j.day + ":" + j.idx)) s.journal.push(j); });
    s.journal.sort((x, y) => y.day - x.day);
    const ek = new Set(s.exams.map(e => e.t)); b.exams.forEach(e => { if (!ek.has(e.t)) s.exams.push(e); });
    s.exams.sort((x, y) => y.t - x.t);
    Object.keys(b.lastAt).forEach(k => { s.lastAt[k] = Math.max(s.lastAt[k] || 0, b.lastAt[k] || 0); });
    s.ritualDay = Math.max(s.ritualDay || 0, b.ritualDay || 0);
    if ((b.mission && (!s.mission || b.mission.day > s.mission.day))) s.mission = b.mission;
    Object.assign(s.settings.dates, b.settings.dates || {}, a.settings && a.settings.dates || {});
    s.updatedAt = Math.max(s.updatedAt || 0, b.updatedAt || 0);
    return s;
  }
  // Lecture d'une sauvegarde : état seul, ou enveloppe { etat, pack }.
  function parseBackup(raw) {
    let o;
    try { o = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return { ok: false, error: "Ce texte n'est pas un JSON valide." }; }
    if (o && o.palestre === "sauvegarde" && o.etat) return looksLikeState(o.etat) ? { ok: true, state: adopt(o.etat), pack: o.pack || null } : { ok: false, error: "Sauvegarde sans progression valide." };
    if (looksLikeState(o)) return { ok: true, state: adopt(o), pack: null };
    if (o && o.format === Core.format) return { ok: true, state: null, pack: o };
    return { ok: false, error: "Ce fichier n'est ni une sauvegarde ni un pack Palestre." };
  }
  const makeBackup = (state, pack) => ({ palestre: "sauvegarde", v: Core.stateVersion, date: new Date().toISOString(), etat: state, pack: pack || undefined });
  Core.state = { fresh, adopt, merge, parseBackup, makeBackup, looksLikeState };

  /* ================= Plans de séance ================= */
  const ritualPlan = len => ({ cards: len === 5 ? 3 : len === 10 ? 4 : 5, ateliers: len === 5 ? 0 : len === 10 ? 1 : 2, qcm: len === 5 ? 0 : 1 });
  // Variété pour un lot d'arguments : parties et critères distincts.
  function variety(args) {
    const done = args.filter(x => x.t && x.t.trim());
    const dp = uniq(done.map(x => String(x.p)).filter(x => x !== "" && x !== "undefined")).length;
    const dc = uniq(done.flatMap(x => Array.isArray(x.c) ? x.c.map(String) : [String(x.c)]).filter(x => x !== "" && x !== "undefined")).length;
    return { dp, dc };
  }
  // Choisit n questions de QCM : d'abord celles jamais vues, puis les moins réussies, en mélangeant.
  function pickQcm(qcm, states, n, cours) {
    const pool = qcm.filter(q => !cours || q.cours === cours);
    const score = q => { const s = states[q.id]; return s ? (s.ok || 0) / Math.max(1, s.n || 0) + (s.n || 0) * 0.01 : -1; };
    return shuffle(pool).sort((a, b) => score(a) - score(b)).slice(0, n);
  }
  // Les énoncés qui dépendent de la position de leurs choix gardent leur ordre.
  function shuffleQcm(question) {
    const letterPair = /\b[A-H] (?:et|ou) [A-H]\b/;
    const position = /\b(?:(?:choix|option|proposition|réponse)s?\s+(?:[A-H0-9]\b|précédente?s?|suivante?s?|ci-dessus|ci-dessous)|les (?:deux|trois) (?:premi[èe]res|derni[èe]res) (?:propositions|réponses|options))/i;
    const texts = [question.q, question.why, ...question.choix].filter(Boolean);
    if (question.fixedOrder || texts.some(text => letterPair.test(text) || position.test(text))) return question;
    const order = shuffle(question.choix.map((_, index) => index));
    return {
      ...question,
      choix: order.map(index => question.choix[index]),
      a: Array.isArray(question.a) ? question.a.map(index => order.indexOf(index)) : order.indexOf(question.a)
    };
  }
  // Choisit des brèves à titrer : non vues d'abord, puis les plus anciennes.
  function pickBreves(breves, states, n, src, lot) {
    const pool = breves.filter(b => (!src || b.src === src) && (!lot || b.lot === lot));
    const key = b => { const s = states[b.id]; return s ? (s.last || 0) : -1; };
    return shuffle(pool).sort((a, b) => key(a) - key(b)).slice(0, n);
  }
  Core.plan = { ritualPlan, variety, pickQcm, shuffleQcm, pickBreves };

  root.Core = Core;
})(typeof globalThis !== "undefined" ? globalThis : this);
