/* Tests du pack : schéma, cohérence interne, références croisées avec les capsules. */
section("Pack chargé");
test("un pack est disponible pour les tests", () => ok(PACK, "ni cours-prive/pack.json ni pack-exemple.json"));
if (PACK) {
  const V = Core.pack.validate(PACK);
  test("le pack passe la validation", () => ok(V.ok, V.errors.slice(0, 5).join(" | ")));
  test("aucun avertissement bloquant", () => { if (V.warnings.length) print("    avertissements : " + V.warnings.length + " (ex. " + V.warnings[0] + ")"); ok(true); });
  const N = Core.pack.normalize(PACK);
  test("chaque fiche a entre 1 et 12 éléments attendus", () => N.fiches.forEach(f => ok(f.p.length >= 1 && f.p.length <= 12, f.id)));
  test("chaque question de QCM a 2 à 6 choix distincts", () => N.qcm.forEach(q => { ok(q.choix.length >= 2 && q.choix.length <= 6, q.id); eq(new Set(q.choix).size, q.choix.length, q.id + " : choix en double"); }));
  test("les questions de QCM sont toutes du module 1", () => N.qcm.forEach(q => eq(q.m, 1, q.id)));
  test("les brèves Marianne ont un titre paru", () => N.breves.filter(b => b.src === "marianne").forEach(b => ok(b.titre, b.id)));
  test("les Minimares n'ont pas de titre", () => N.breves.filter(b => b.src === "canard").forEach(b => ok(!b.titre, b.id)));
  test("les corrigés ont des catégories 1 à 6 et un titre", () => N.breves.forEach(b => (b.corrige || []).forEach(c => { ok(c.cat >= 1 && c.cat <= 6, b.id); ok(c.t && c.t.trim(), b.id); })));
  test("les textes O3 ont un identifiant, un titre et des faits ou un texte", () => N.textes.forEach(t => { ok(t.id && t.titre, "texte sans id/titre"); ok((t.faits && t.faits.length) || (t.texte && t.texte.length), t.id); }));
  test("le devoir O3 renvoie à un texte existant", () => { if (N.devoirs.o3) ok(N.textes.some(t => t.id === N.devoirs.o3.texte), "texte " + N.devoirs.o3.texte + " absent"); });
  test("les énoncés chrie/fausse chrie : r entre -1 et 3, avec explication", () => N.enonces.forEach(e => { ok(e.r >= -1 && e.r <= 3, e.t); ok(e.why, e.t); }));
  test("au moins une vraie et une fausse chrie si des énoncés existent", () => { if (N.enonces.length) { ok(N.enonces.some(e => e.r < 0)); ok(N.enonces.some(e => e.r >= 0)); } });
  test("les chries ont A, B et full", () => N.chries.forEach(c => ok(c.A && c.B && c.full, c.id)));
  test("les chries de 1974 avec corrigé ont des catégories valides", () => N.chries.forEach(c => (c.corrige || []).forEach(x => ok(x.cat >= 1 && x.cat <= 6 && x.t, c.id))));
  test("l'èthos est complet et symétrique", () => { if (N.ethos.length) { eq(N.ethos.length, 8); N.ethos.forEach((e, i) => { eq(N.ethos[e.opp].opp, i, e.fr); ok(N.ethos[e.opp].val !== e.val, e.fr); }); } });
  test("les fautes O3 pointent dans les trois choix", () => N.fautes.forEach(f => ok(f.a >= 0 && f.a <= 2, f.t)));
  test("les termes, qui, genres, lieux sont des paires", () => ["termes", "qui", "genres", "lieux"].forEach(k => N[k].forEach(x => ok(Array.isArray(x) && x.length === 2 && x[0] && x[1], k))));
  test("les briques ont un identifiant et une grille", () => N.briques.forEach(b => ok(b.id && b.nom && Array.isArray(b.check) && b.check.length, b.id)));
  test("les affaires ont deux rôles", () => N.affaires.forEach(a => eq((a.roles || []).length, 2, a.id)));
  test("les fiches citées par les capsules existent (sinon, signalé)", () => { const miss = []; CAPSULES.forEach(c => (c.fiches || []).forEach(id => { if (!N.fiches.some(f => f.id === id)) miss.push(c.id + "→" + id); })); if (miss.length) print("    fiches absentes du pack : " + miss.join(", ")); ok(true); });
  test("aucun identifiant de brève en double entre sources", () => eq(new Set(N.breves.map(b => b.id)).size, N.breves.length));
  test("les dates des brèves sont des textes", () => N.breves.forEach(b => { if (b.date != null) ok(typeof b.date === "string", b.id); }));
  if (PACK_PRIVE) {
    test("pack privé : au moins 30 questions de QCM Orator 1", () => ok(N.qcm.length >= 30, N.qcm.length + " questions"));
    test("pack privé : les 6 cours d'Orator 1 sont couverts", () => eq(Core.util.uniq(N.qcm.map(q => q.cours)).sort(), ["c1", "c2", "c3", "c4", "c5", "c6"]));
    test("pack privé : brèves Marianne et Minimares avec corrigés", () => { ok(N.breves.filter(b => b.src === "marianne" && b.corrige && b.corrige.length).length >= 8); ok(N.breves.filter(b => b.src === "canard" && b.corrige && b.corrige.length).length >= 8); });
    test("pack privé : un texte complet pour l'épreuve d'Orator 3", () => ok(N.textes.some(t => t.texte && t.texte.length >= 3)));
  }
}
