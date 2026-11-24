/* Tests de l'interface : chaque vue et chaque type d'étape produit un HTML sain, avec et sans pack. */
const A = Palestre;
const views = Object.keys(A.VIEWS);
section("Vues sans pack");
test("l'appli démarre sans pack ni progression", () => { ok(A.P.empty); eq(A.S.v, 2); });
views.forEach(v => test("vue « " + v + " » sans pack", () => sane(A.VIEWS[v](), v)));
test("sous-vues Apprendre sans pack", () => ["capsules", "fiches", "qcm"].forEach(k => { A.UI.app = k; sane(A.VIEWS.apprendre(), "apprendre/" + k); }));
test("sous-vues Carnet sans pack", () => ["textes", "missions", "pack", "sauvegarde", "reglages"].forEach(k => { A.UI.carnet = k; sane(A.VIEWS.carnet(), "carnet/" + k); }));
test("les ateliers qui manquent de contenu renvoient null sans planter", () => { eq(A.mkArg(), null); eq(A.mkTrois(), null); eq(A.mkBreve(), null); eq(A.mkRecon(), null); eq(A.mkBrique(), null); eq(A.mkTitre(), null); });
test("startFlow sans étape ne lance rien", () => { A.startFlow([null, undefined]); eq(A.R, null); });
test("Orator 1 : examen blanc accessible sans pack et couvrant les six cours", () => {
  ok(A.EXAMS[1].ok());
  A.EXAMS[1].start();
  const R = A.R;
  const questions = R.steps[0].items;
  eq(questions.length, 24);
  eq(new Set(questions.map(q => q.id)).size, 24);
  for (let c = 1; c <= 6; c++) eq(questions.filter(q => q.cours === "c" + c).length, 4);
  ok(questions.every(q => q.why && q.choix.length === 4 && Number.isInteger(q.a)));
  A.ACT.close();
});

section("Capsules");
test("chaque capsule a un SVG, des scènes et des légendes", () => CAPSULES.forEach(c => { ok(c.id && c.titre && c.sous && c.duree, c.id); ok(c.svg.startsWith("<svg") && c.svg.endsWith("</svg>"), c.id); ok(c.scenes.length >= 4, c.id); c.scenes.forEach(s => ok(s.t && s.t.length > 20, c.id)); }));
test("les scènes couvrent tous les data-s du dessin", () => CAPSULES.forEach(c => { const ks = (c.svg.match(/data-s="(\d+)"/g) || []).map(x => +x.match(/\d+/)[0]); ok(ks.length, c.id); ok(Math.max(...ks) <= c.scenes.length - 1, c.id + " : data-s au-delà des scènes"); ok(ks.includes(0), c.id + " : rien à la scène 0"); }));
test("les data-off sont postérieurs aux data-s", () => CAPSULES.forEach(c => { const re = /data-s="(\d+)" data-off="(\d+)"/g; let m; while ((m = re.exec(c.svg))) ok(+m[2] > +m[1], c.id); }));
test("les dessins sont des SVG bien formés (balises équilibrées)", () => CAPSULES.forEach(c => sane(c.svg, "capsule " + c.id)));
test("identifiants de capsules uniques et modules valides", () => { eq(new Set(CAPSULES.map(c => c.id)).size, CAPSULES.length); CAPSULES.forEach(c => ok([1, 2, 3, 4].includes(c.m))); });
test("ouverture d'une capsule dans la vue Apprendre", () => { A.UI.app = "capsules"; A.ACT["cap-open"]({ dataset: { id: CAPSULES[0].id } }); eq(A.UI.cap, CAPSULES[0].id); sane(A.VIEWS.apprendre(), "capsule ouverte"); A.ACT["cap-next"](); eq(A.UI.capK, 1); A.ACT["cap-prev"](); eq(A.UI.capK, 0); A.ACT["cap-close"](); eq(A.UI.cap, null); });
test("étape capsule dans une séance", () => { A.startFlow([{ type: "capsule", id: "bascule" }]); ok(A.R); sane(A.STEP.capsule.view(A.R.steps[0], A.R.st), "étape capsule"); A.ACT["cap-done"](); ok(A.S.caps.bascule && A.S.caps.bascule.done, "capsule marquée vue"); if (A.R) A.ACT.close(); });

if (PACK) {
  section("Avec le pack");
  test("import du pack via l'interface", () => { A.importPack(PACK); ok(!A.P.empty); });
  views.forEach(v => test("vue « " + v + " » avec pack", () => { A.UI.cap = null; sane(A.VIEWS[v](), v); }));
  test("sous-vues Apprendre avec pack, chaque module et chaque cours", () => {
    ["capsules", "fiches", "qcm"].forEach(k => { A.UI.app = k; sane(A.VIEWS.apprendre(), "apprendre/" + k); });
    A.UI.app = "fiches"; [1, 2, 3, 4].forEach(m => { A.UI.mod = m; sane(A.VIEWS.apprendre(), "fiches module " + m); });
    A.UI.app = "qcm"; Core.util.uniq(A.P.qcm.map(q => q.cours)).forEach(c => { A.UI.cours = c; sane(A.VIEWS.apprendre(), "qcm " + c); }); A.UI.cours = "";
  });
  test("sous-vues Carnet avec pack", () => ["textes", "missions", "pack", "sauvegarde", "reglages"].forEach(k => { A.UI.carnet = k; sane(A.VIEWS.carnet(), "carnet/" + k); }));
  test("le Mur, en réfutation et en confirmation", () => { ["r", "c"].forEach(w => { A.UI.wall = w; sane(A.VIEWS.aujourdhui(), "mur " + w); }); });

  section("Étapes de séance avec le pack");
  const run = (steps, opt) => { A.startFlow(steps, opt); ok(A.R, "séance non lancée"); return A.R; };
  const viewNow = where => sane(A.STEP[A.R.steps[A.R.i].type].view(A.R.steps[A.R.i], A.R.st), where);
  if (A.P.fiches.length) test("rappel : question puis correction", () => { const R = run([{ type: "card", id: A.P.fiches[0].id }]); viewNow("card/0"); R.st.text = "ma réponse"; R.st.phase = 1; viewNow("card/1"); A.ACT.close(); });
  Object.keys(A.DRILLS).filter(k => A.DRILLS[k].ok()).forEach(k => test("sprint « " + k + " » : 30 tirages cohérents", () => {
    for (let i = 0; i < 30; i++) { const q = A.DRILLS[k].gen(); ok(q.q, k); ok(q.choices.length >= 2, k); ok(q.a >= 0 && q.a < q.choices.length, k + " : index de réponse"); eq(new Set(q.choices).size, q.choices.length, k + " : choix en double"); }
    const R = run([{ type: "sprint", drill: k }]); viewNow("sprint " + k); R.st.fb = { i: 0 }; viewNow("sprint feedback"); R.st.phase = 1; viewNow("sprint fin"); A.ACT.close();
  }));
  const writeKinds = [];
  if (A.mkArg()) writeKinds.push(A.mkArg());
  if (A.mkTitre()) writeKinds.push(A.mkTitre());
  if (A.mkBrique()) writeKinds.push(A.mkBrique());
  if (A.mkRecon()) writeKinds.push(A.mkRecon());
  writeKinds.push({ type: "write", kind: "chrieday" }, { type: "write", kind: "q1", pts: 3 });
  if (A.P.chries.some(c => c.antique)) writeKinds.push({ type: "write", kind: "q3", antique: A.P.chries.find(c => c.antique).id, modernes: [{ label: "test", text: "texte moderne" }], pts: 5 });
  writeKinds.forEach(s => test("atelier d'écriture « " + s.kind + " » : consigne puis relecture", () => {
    const sp = A.SPEC[s.kind](s); ok(sp.name && sp.eyebrow && sp.title && sp.html, s.kind); sane(sp.html, "consigne " + s.kind);
    const R = run([s]); viewNow("write/0 " + s.kind); R.st.text = "Tout d'abord, « citation » : un texte de test assez long pour la relecture, qui pose une question ?"; R.st.phase = 1; viewNow("write/1 " + s.kind); A.ACT.close();
  }));
  if (A.P.enonces.length >= 2) test("chrie ou fausse chrie : les deux phases", () => { const R = run([{ type: "faux", items: A.pickEnonces(Math.min(4, A.P.enonces.length)), pts: 2 }]); viewNow("faux/0"); R.st.v = R.st.v.map(() => 1); R.st.phase = 1; viewNow("faux/1"); A.ACT.close(); });
  if (A.P.breves.length) {
    test("titres : 8 extraits, 4 à titrer, corrigés affichés", () => { const items = A.P.breves.slice(0, 8).map(b => ({ id: b.id, text: b.texte, titre: b.titre, corrige: b.corrige, src: b.src })); const R = run([{ type: "titres", label: "Test", items, need: Math.min(4, items.length), pts: 4, showTitre: true }]); viewNow("titres/0"); R.st.t = items.map((_, i) => (i % 2 ? "" : "Titre " + i)); R.st.phase = 1; const h = A.STEP.titres.view(R.steps[0], R.st); sane(h, "titres/1"); ok(h.includes("quarter"), "notation présente"); A.ACT.close(); });
    test("brève seule : consigne, puis corrigé", () => { const s = A.mkBreve(); ok(s); const R = run([s]); viewNow("breve/0"); R.st.t = "Mon titre"; R.st.phase = 1; const h = A.STEP.breve.view(R.steps[0], R.st); sane(h, "breve/1"); ok(h.includes("Dans ton cours") || h.includes("Pas de corrigé"), "corrigé ou mention"); A.ACT.close(); });
    ["marianne", "canard"].forEach(src => { if (A.P.breves.some(b => b.src === src)) test("brève " + src + " : la source est respectée", () => { const s = A.mkBreve(src); eq(A.P.breves.find(b => b.id === s.id).src, src); }); });
  }
  if (A.P.textes.length) test("trois arguments : saisie, mode, relecture, modèle", () => {
    const s = A.mkTrois({ pts: 20 }); ok(s); const R = run([s], { exam: 3, minutes: 60 }); viewNow("trois/0");
    R.st.mode = "c"; viewNow("trois/0 confirmation");
    R.st.a = [{ p: "0", c: ["1", "2"], t: "Tout d'abord, « citation » un." }, { p: "2", c: ["0", "3"], t: "Ensuite, « citation » deux." }, { p: "4", c: ["5", "1"], t: "Enfin, « citation » trois." }]; R.st.intro = "Intro."; R.st.concl = "Fin."; R.st.phase = 1;
    const h = A.STEP.trois.view(R.steps[0], R.st); sane(h, "trois/1"); ok(h.includes("Trois arguments, et seulement trois"), "relecteur global"); if (s.modele) ok(h.includes("Dans ton cours"), "modèle du cours affiché"); A.ACT.close();
  });
  if (A.P.qcm.length) {
    test("QCM d'examen : navigation, correction", () => { const items = Core.plan.pickQcm(A.P.qcm, {}, Math.min(5, A.P.qcm.length)); const R = run([{ type: "qcm", items, pts: 20 }], { exam: 1, minutes: 60 }); viewNow("qcm/0"); A.ACT["qcm-pick"]({ dataset: { i: 0 } }); eq(R.st.ans[0] === 0 || Array.isArray(R.st.ans[0]), true); A.ACT["qcm-next"](); eq(R.st.i, Math.min(1, items.length - 1)); A.ACT["qcm-prev"](); eq(R.st.i, 0); R.st.phase = 1; viewNow("qcm/correction"); A.ACT["qcm-ok"](); ok(A.R === null || A.R.done, "séance terminée"); ok(A.S.exams.length >= 1 && A.S.exams[0].mod === 1, "examen enregistré"); if (A.R) A.ACT.close(); });
    test("QCM d'entraînement : retour immédiat après mélange des choix", () => { const items = Core.plan.pickQcm(A.P.qcm, {}, 3).filter(q => !Array.isArray(q.a)); if (!items.length) return; const R = run([{ type: "qcm", items, train: true }]); A.ACT["qcm-pick"]({ dataset: { i: R.steps[0].items[0].a } }); ok(R.st.fb && R.st.fb.ok, "bonne réponse reconnue"); viewNow("qcm train feedback"); A.ACT.close(); });
    test("Orator 1 : le temps écoulé ouvre la correction", () => {
      const R = run([{ type: "qcm", items: A.P.qcm.slice(0, 2) }], { exam: 1, minutes: 60 });
      const q = R.steps[0].items[0];
      for (const i of [q.a].flat()) A.ACT["qcm-pick"]({ dataset: { i } });
      R.deadline = Date.now() - 1;
      A.ACT["qcm-prev"]();
      eq(R.st.phase, 1); eq(R.deadline, null);
      A.ACT["qcm-ok"]();
      eq(R.total, R.steps[0].items.length === 2 ? 10 : 20);
      A.ACT.close();
    });
    test("chaque question du pack s'affiche dans le QCM", () => { const R = run([{ type: "qcm", items: A.P.qcm.slice(), pts: 20 }]); A.P.qcm.forEach((q, i) => { R.st.i = i; viewNow("question " + q.id); }); R.st.phase = 1; viewNow("correction complète"); A.ACT.close(); });
  }
  test("mission et notation libre", () => { const R = run([{ type: "mission" }, { type: "rate", label: "Langue", pts: 2, title: "t", hint: "h" }]); viewNow("mission"); A.ACT["mission-ok"](); ok(A.S.mission && A.S.mission.day, "mission prise"); viewNow("rate"); A.ACT.close(); });

  section("Examens blancs et rituel");
  [1, 2, 3, 4].forEach(m => test("examen blanc Orator " + m + (A.EXAMS[m].ok() ? "" : " (indisponible avec ce pack)"), () => { if (!A.EXAMS[m].ok()) return; A.EXAMS[m].start(); ok(A.R && A.R.opt.exam === m, "examen lancé"); A.R.steps.forEach((s, i) => { A.R.i = i; A.R.st = { phase: 0, t0: Date.now() }; if (A.STEP[s.type].enter) A.STEP[s.type].enter(s, A.R.st); viewNow("exam " + m + " étape " + i + " (" + s.type + ")"); }); A.R.i = 0; A.ACT.close(); }));
  test("examen Orator 4 : six questions dans l'ordre officiel quand le pack le permet", () => { if (!A.EXAMS[4].ok()) return; A.EXAMS[4].start(); const types = A.R.steps.map(s => s.type + (s.kind ? ":" + s.kind : "")); ok(types[0] === "write:q1" && types[1] === "faux", types.join(",")); if (A.P.breves.some(b => b.src === "marianne") && A.P.breves.some(b => b.src === "canard") && A.P.chries.some(c => !c.antique)) eq(types.length, 6, types.join(",")); A.ACT.close(); });
  test("rituel : 5, 10 et 15 minutes", () => [5, 10, 15].forEach(len => { A.S.settings.len = len; A.ACT.ritual(); ok(A.R && A.R.steps.length >= 1, "rituel " + len); ok(A.R.steps[A.R.steps.length - 1].type === "mission" || A.S.mission, "mission en fin de rituel"); A.R.steps.forEach((s, i) => { A.R.i = i; A.R.st = { phase: 0, t0: Date.now() }; if (A.STEP[s.type].enter) A.STEP[s.type].enter(s, A.R.st); viewNow("rituel " + len + " étape " + s.type); }); A.R.i = 0; A.ACT.close(); }));
  test("résumé de fin de séance", () => { A.startFlow([{ type: "mission" }]); A.ACT["mission-other"](); A.ACT["mission-ok"](); ok(A.R.done, "séance terminée"); A.ACT.close(); });

  section("Sauvegarde et fusion via l'interface");
  test("export puis import fusionné ne perd rien", () => { A.S.cards.test1 = { b: 3, due: 5, n: 2, last: 4 }; const backup = Core.state.makeBackup(A.S, null); const r = Core.state.parseBackup(JSON.stringify(backup)); ok(r.ok); const merged = Core.state.merge(Core.state.fresh(), r.state); eq(merged.cards.test1.b, 3); delete A.S.cards.test1; });
  test("importData avec une sauvegarde propose la fusion sans planter", () => { A.importData(JSON.stringify(Core.state.makeBackup(Core.state.fresh(), null))); A.ACT["imp-merge"](); ok(true); });
  test("un pack invalide est refusé sans écraser le pack installé", () => { const avant = A.P.fiches.length; A.importPack({ format: "faux" }); eq(A.P.fiches.length, avant); A.importPack("pas du json"); eq(A.P.fiches.length, avant); });
}
