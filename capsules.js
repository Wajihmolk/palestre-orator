/* Palestre Orator V2 — capsules animées.
   Chaque capsule est un dessin SVG dont les éléments portent data-s="k" : ils apparaissent à la scène k
   (et disparaissent à data-off="k"). Les légendes changent à chaque scène. Le texte est écrit pour l'appli :
   il paraphrase des sources antiques ou des contes du domaine public, jamais le texte des cours. */
(function (root) {
  "use strict";
  const card = (x, y, w, h, cls, s, extra) => '<g data-s="' + s + '" class="cap-card ' + (cls || "") + '"' + (extra || "") + '><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/>';
  const txt = (x, y, lines, cls, size) => lines.map((l, i) => '<text x="' + x + '" y="' + (y + i * (size || 12) * 1.25) + '" class="' + (cls || "") + '"' + (size ? ' font-size="' + size + '"' : "") + ">" + l + "</text>").join("");

  const CAPSULES = [
    /* ---------------- Orator 1 : le piège de Socrate ---------------- */
    {
      id: "socrate", m: 1, titre: "Le piège de Socrate", sous: "Platon, Gorgias, fin du premier entretien", duree: "2 min",
      fiches: ["o1-gorgias", "o1-savoir"],
      svg: '<svg viewBox="0 0 360 250" class="cap" aria-hidden="true">'
        + card(14, 14, 156, 78, "g", 0) + txt(24, 34, ["<tspan class=\"who\">Gorgias</tspan> fait l’éloge", "de la rhétorique :", "elle persuade, et son objet", "est le juste et l’injuste."], "", 11) + "</g>"
        + card(190, 14, 156, 78, "g dim", 0) + txt(200, 34, ["Sa réserve : si un élève", "en use injustement,", "ce n’est pas la faute", "du maître."], "", 11) + "</g>"
        + '<g data-s="1" class="cap-lever"><path d="M92 100 v22" class="ln"/><text x="92" y="137" text-anchor="middle" class="tag">la honte devant le public</text></g>'
        + card(14, 146, 156, 50, "s", 1) + txt(24, 164, ["<tspan class=\"who\">Socrate</tspan> : l’orateur connaît-il", "le juste ? — Il le sait, ou", "l’apprendra de moi."], "", 10.5) + "</g>"
        + card(190, 146, 156, 50, "s", 2) + txt(200, 164, ["Et qui connaît le juste", "est juste : Gorgias", "l’accorde aussi."], "", 10.5) + "</g>"
        + card(90, 206, 180, 34, "k", 3) + '<text x="180" y="228" text-anchor="middle" class="strong">Donc l’orateur est forcément juste.</text></g>'
        + '<g data-s="3" class="cap-clash"><path d="M268 92 C 290 120, 300 170, 270 206" class="ln bad"/><text x="300" y="150" class="bad strong" font-size="22">≠</text></g>'
        + '<g data-s="4"><rect x="14" y="14" width="332" height="226" rx="14" class="frame"/></g>'
        + "</svg>",
      scenes: [
        { t: "Gorgias vante son art : la rhétorique persuade, et son objet est le juste et l’injuste. Mais il se réserve une sortie : si un orateur en use mal, le maître n’y est pour rien.", n: "Deux affirmations qui semblent compatibles. Retiens-les : tout le piège tient entre elles." },
        { t: "Socrate demande si l’orateur doit connaître le juste. Devant le public, Gorgias n’ose dire non : l’élève le sait déjà, ou l’apprendra auprès de lui.", n: "Le levier du piège n’est pas la logique : c’est la honte. Avouer qu’on enseigne à persuader sans connaître le juste ferait mauvais effet." },
        { t: "Deuxième accord, en apparence anodin : celui qui connaît le juste est juste, comme celui qui connaît la médecine est médecin.", n: "Socrate fait glisser le savoir technique vers le savoir moral. Gorgias laisse passer l’assimilation." },
        { t: "Conclusion : l’orateur est forcément juste. Or Gorgias avait admis qu’il peut user injustement de son art. Les deux propositions se contredisent.", n: "La réfutation socratique ne prouve pas que Gorgias a tort : elle montre qu’il ne peut tenir ensemble tout ce qu’il a accordé." },
        { t: "Le piège se referme sur une contradiction obtenue pièce par pièce. C’est une technique : faire admettre, puis rapprocher.", n: "À l’examen, sache nommer les trois étapes : connaître le juste, être juste, ne pouvoir vouloir l’injuste." }
      ]
    },

    /* ---------------- Orator 1 : Corax et Tisias ---------------- */
    {
      id: "corax", m: 1, titre: "Le procès de Corax et Tisias", sous: "Les origines siciliennes et le vraisemblable", duree: "2 min",
      fiches: ["o1-corax", "o1-plan"],
      svg: '<svg viewBox="0 0 360 250" class="cap" aria-hidden="true">'
        + '<g data-s="0"><circle cx="70" cy="60" r="26" class="face"/><text x="70" y="104" text-anchor="middle" class="who">Corax</text><circle cx="290" cy="60" r="26" class="face"/><text x="290" y="104" text-anchor="middle" class="who">Tisias</text></g>'
        + '<g data-s="0"><path d="M100 60 H260" class="ln"/><text x="180" y="52" text-anchor="middle" class="tag">leçons de rhétorique</text><text x="180" y="78" text-anchor="middle" font-size="10.5">« Tu paieras après ton premier procès gagné. »</text></g>'
        + card(14, 120, 160, 58, "k", 2) + txt(24, 138, ["<tspan class=\"who\">Corax</tspan> : si tu gagnes,", "tu dois payer : c’est le contrat.", "Si tu perds, tu dois payer :", "c’est le jugement."], "", 10) + "</g>"
        + card(186, 120, 160, 58, "k", 3) + txt(196, 138, ["<tspan class=\"who\">Tisias</tspan> : si je gagne,", "je ne dois rien : c’est le jugement.", "Si je perds, je ne dois rien :", "c’est le contrat."], "", 10) + "</g>"
        + '<g data-s="1"><rect x="150" y="112" width="60" height="18" rx="9" class="pill"/><text x="180" y="125" text-anchor="middle" class="tag">procès</text></g>'
        + card(60, 194, 240, 44, "g", 4) + '<text x="180" y="213" text-anchor="middle" font-size="11">Les juges les chassent tous deux :</text><text x="180" y="229" text-anchor="middle" class="strong" font-size="11">« d’un mauvais corbeau, un mauvais œuf ».</text></g>'
        + "</svg>",
      scenes: [
        { t: "Corax, maître sicilien, enseigne la rhétorique à Tisias. Le contrat : l’élève paiera après avoir gagné son premier procès.", n: "L’anecdote est légendaire ; les Anciens en faisaient le point de départ de la rhétorique fondée sur le vraisemblable." },
        { t: "Tisias ne plaide pas et ne paie pas. Corax le traîne devant les juges : voilà le premier procès.", n: "Le procès porte sur le contrat lui-même : chaque issue se retourne." },
        { t: "Corax : « Si tu gagnes, tu me dois par contrat ; si tu perds, tu me dois par jugement. »", n: "Deux règles s’affrontent : celle du procès et celle du contrat d’apprentissage." },
        { t: "Tisias renverse l’argument mot pour mot : « Si je gagne, je ne dois rien par jugement ; si je perds, je ne dois rien par contrat. »", n: "Le même vraisemblable sert les deux parties. C’est la force, et le scandale, de la technique." },
        { t: "Les juges les chassent : « d’un mauvais corbeau, un mauvais œuf » (korax signifie corbeau).", n: "Retiens le mécanisme : un argument fondé sur le vraisemblable peut toujours être retourné. Platon en fera le reproche aux sophistes." }
      ]
    },

    /* ---------------- Orator 2 : le lieu du plus et du moins ---------------- */
    {
      id: "plusmoins", m: 2, titre: "Le lieu du plus et du moins", sous: "Un lieu commun d’Aristote, à placer dans ton discours", duree: "2 min",
      fiches: ["o2-plusmoins", "o2-communs"],
      svg: '<svg viewBox="0 0 360 250" class="cap" aria-hidden="true">'
        + '<g data-s="0" class="cap-scale"><path d="M180 40 V170" class="ln"/><path d="M120 170 H240" class="ln"/><path d="M70 60 H290" class="ln beam"/><path d="M70 60 V98 M290 60 V98" class="ln"/>'
        + '<path d="M40 98 H100 L95 120 H45 Z" class="pan heavy"/><path d="M260 98 H320 L315 120 H265 Z" class="pan"/>'
        + '<text x="70" y="140" text-anchor="middle" class="strong">le plus</text><text x="290" y="140" text-anchor="middle" class="strong">le moins</text></g>'
        + '<g data-s="0"><text x="70" y="155" text-anchor="middle" font-size="10">courir un marathon</text><text x="290" y="155" text-anchor="middle" font-size="10">courir dix kilomètres</text></g>'
        + '<g data-s="1"><path d="M110 185 H250" class="ln arrow"/><text x="180" y="203" text-anchor="middle" font-size="11">« Qui peut le plus peut le moins. »</text></g>'
        + '<g data-s="2"><path d="M250 215 H110" class="ln arrow bad"/><text x="180" y="233" text-anchor="middle" font-size="11">Si l’on punit le petit vol, à plus forte raison le grand.</text></g>'
        + card(104, 8, 152, 26, "g", 3) + '<text x="180" y="26" text-anchor="middle" font-size="10.5">une catégorie mentale, pas la réalité</text></g>'
        + '<g data-s="4"><rect x="10" y="10" width="340" height="230" rx="14" class="frame"/></g>'
        + "</svg>",
      scenes: [
        { t: "Une balance mentale : d’un côté le plus, de l’autre le moins. Chacun range spontanément les choses dans l’un ou l’autre plateau.", n: "Aristote classe ce lieu parmi les lieux communs : il s’applique à n’importe quel sujet." },
        { t: "Du plus vers le moins : qui a couru un marathon peut bien courir dix kilomètres. La capacité pour le grand prouve la capacité pour le petit.", n: "Formule à retenir : « qui peut le plus peut le moins ». Variantes : « il peut bien », « encore moins », « comment n’aurait-il pas pu »." },
        { t: "Du moins vers le plus, c’est l’a fortiori : si l’on punit le petit vol, à plus forte raison le grand. Ce qui vaut pour le moindre vaut pour le plus grave.", n: "Les deux directions sont le même lieu. Les progymnasmata antiques l’utilisaient pour comparer deux fautes." },
        { t: "Pourquoi cela convainc : l’argument épouse une catégorie de l’esprit, pas la réalité. Le dix kilomètres et le marathon ne demandent pas les mêmes qualités.", n: "Le lieu commun est général et imprécis par nature : il vise l’adhésion, pas la vérité." },
        { t: "Dans ton discours judiciaire : repère un fait admis (le plus), et fais-en découler le fait contesté (le moins). Signale la tournure.", n: "Entraîne-toi dans l’atelier « brique de discours » : il te demande un plus et moins reconnaissable." }
      ]
    },

    /* ---------------- Orator 3 : le château de Barbe bleue ---------------- */
    {
      id: "chateau", m: 3, titre: "Le plan du château de Barbe bleue", sous: "Le lieu comme prise d’argumentation", duree: "3 min",
      fiches: ["o3-lieu", "o3-parties"],
      svg: '<svg viewBox="0 0 360 250" class="cap" aria-hidden="true">'
        + '<g data-s="0"><rect x="30" y="30" width="250" height="190" rx="4" class="wall"/><text x="155" y="22" text-anchor="middle" class="tag">« ouvrez tout, allez partout »</text></g>'
        + '<g data-s="0"><path d="M30 125 H280" class="ln thin"/><text x="40" y="48" class="tag">étage : chambres, garde-meubles</text><text x="40" y="143" class="tag">appartement bas</text></g>'
        + '<g data-s="1"><rect x="40" y="150" width="190" height="34" rx="3" class="room"/><text x="135" y="171" text-anchor="middle" font-size="10">la grande galerie</text>'
        + '<rect x="236" y="150" width="36" height="34" rx="3" class="room dark"/><text x="254" y="171" text-anchor="middle" font-size="9" class="onDark">cabinet</text></g>'
        + '<g data-s="2"><path d="M60 118 l6 6 l-6 6 l6 6 l-6 6" class="ln stair"/><path d="M60 100 V118" class="ln stair"/><text x="68" y="112" class="tag">escalier dérobé</text>'
        + '<path d="M70 150 Q150 200 236 168" class="ln dash"/></g>'
        + '<g data-s="3"><rect x="40" y="56" width="70" height="40" rx="3" class="room"/><text x="75" y="80" text-anchor="middle" font-size="10">sa chambre</text><circle cx="100" cy="66" r="3" class="key"/><text x="118" y="70" class="tag">la clef, « là-haut sur ma table »</text></g>'
        + '<g data-s="4"><rect x="292" y="20" width="40" height="200" rx="3" class="wall"/><text x="312" y="14" text-anchor="middle" class="tag">la Tour</text><circle cx="312" cy="40" r="6" class="face"/><text x="312" y="62" text-anchor="middle" font-size="9">Anne</text><path d="M332 40 h18" class="ln arrow"/></g>'
        + '<g data-s="5"><rect x="150" y="60" width="124" height="50" rx="8" class="cap-card q"/>' + txt(158, 76, ["Combien de temps du cabinet", "à la chambre ? Qui a pu", "la voir descendre ?"], "", 9.5) + "</g>"
        + "</svg>",
      scenes: [
        { t: "Avant de partir, la Barbe bleue remet toutes les clefs : « ouvrez tout, allez partout ». Un château s’ouvre, étage et appartement bas.", n: "La partie « lieu » de la narration demande : où, exactement ? Un conte précise moins qu’il n’y paraît : chaque flou est une prise." },
        { t: "La petite clef ouvre « le cabinet au bout de la grande galerie de l’appartement bas ». Le texte situe la pièce interdite au rez-de-chaussée, tout au fond.", n: "Première prise : un cabinet au bout d’une galerie, donc un trajet long et visible. Vraisemblable qu’on s’y rende sans être vue, avec des invitées dans la maison ?" },
        { t: "Elle y descend « par un petit escalier dérobé », avec tant de hâte qu’elle « pensa se rompre le cou ». Le chemin caché relie l’étage à la galerie.", n: "Deuxième prise : l’escalier dérobé. Possible ou impossible qu’une épouse d’un mois connaisse déjà les passages secrets d’une maison de cette taille ?" },
        { t: "Après la découverte, elle remonte « à sa chambre » et laissera la clef « là-haut sur ma table ». Les pièces du haut deviennent le théâtre du mensonge.", n: "Troisième prise : le temps. Entre le cabinet et la chambre, combien de minutes pour reprendre ses esprits, essuyer la clef, et paraître devant les invitées ?" },
        { t: "Du haut de la Tour, sœur Anne guette les frères : « Anne, ma sœur Anne, ne vois-tu rien venir ? ». Le château a une tour, donc une vue, donc des témoins possibles.", n: "Quatrième prise : la manière. Le délai de prière, l’attente, les frères qui arrivent juste à temps : habituel ou inhabituel ?" },
        { t: "Reconstituer le plan, c’est fabriquer des arguments : chaque pièce, chaque trajet, chaque durée pose une question au récit. Réponds-y par un critère.", n: "À l’examen : repère au fil de la lecture les éléments de lieu, de temps, de manière, et garde les trois meilleurs. Le tableau vient avant la rédaction." }
      ]
    },

    /* ---------------- Orator 4 : la bascule ---------------- */
    {
      id: "bascule", m: 4, titre: "La bascule : de la chrie à la brève", sous: "Où va le centre de gravité ?", duree: "2 min",
      fiches: ["o4-structure", "o4-centre", "o4-titre"],
      svg: '<svg viewBox="0 0 360 250" class="cap" aria-hidden="true">'
        + '<g data-s="3" data-off="4"><rect x="40" y="14" width="280" height="26" rx="8" class="cap-card t"/><text x="180" y="32" text-anchor="middle" class="strong" font-size="11">T · le titre : met sur la piste, sans gâcher la chute</text></g>'
        + '<g data-s="4"><rect x="40" y="14" width="280" height="26" rx="8" class="cap-card q dashed"/><text x="180" y="32" text-anchor="middle" font-size="11">Minimares : pas de titre. À toi de le proposer.</text></g>'
        + '<g data-s="0"><rect x="40" y="56" width="134" height="64" rx="8" class="cap-card a"/>' + txt(48, 74, ["<tspan class=\"who\">A</tspan> · le contexte", "Aristide le Juste, quand", "on lui demanda ce qu’est", "la justice,"], "", 10) + "</g>"
        + '<g data-s="0"><rect x="186" y="56" width="134" height="64" rx="8" class="cap-card b"/>' + txt(194, 74, ["<tspan class=\"who\">B</tspan> · la parole insigne", "déclara : « ne pas envier", "les biens des autres ».", "→ une maxime à méditer"], "", 10) + "</g>"
        + '<g data-s="1" data-off="2"><text x="180" y="140" text-anchor="middle" font-size="10.5">1974 : A, le contexte du débat · B, la pointe : « le monopole du cœur »</text></g>'
        + '<g data-s="2"><rect x="40" y="150" width="280" height="44" rx="8" class="cap-card c"/>' + txt(48, 168, ["<tspan class=\"who\">C</tspan> · le commentaire satirique : la pointe, la chute.", "Le propos (A, B) n’est plus qu’un tremplin."], "", 10.5) + "</g>"
        + '<g data-s="0" class="cap-weight"><circle cx="253" cy="128" r="8" class="weight"/><text x="253" y="131" text-anchor="middle" font-size="9" class="onDark">⬤</text></g>'
        + '<g data-s="2"><path d="M253 128 L 180 202" class="ln arrow"/><circle cx="180" cy="206" r="8" class="weight"/></g>'
        + '<g data-s="2"><text x="180" y="232" text-anchor="middle" class="tag">le centre de gravité bascule vers C</text></g>'
        + "</svg>",
      scenes: [
        { t: "La chrie antique tient en une phrase : A, un personnage et son contexte ; B, sa parole ou son action insigne. Rien d’autre, aucun commentaire.", n: "Le centre de gravité est sur B : la maxime vaut pour tous et passe à la postérité." },
        { t: "La chrie « à l’ancienne » sur un débat moderne garde la même forme : A, le contexte ; B, la réplique. Mais la parole n’a plus de portée morale : c’est un trait d’esprit.", n: "Exercice de la séquence 1 : condenser une petite phrase de débat en une seule phrase équilibrée." },
        { t: "La brève de presse ajoute C : le commentaire satirique. Le poids glisse : A et B ne sont plus qu’un tremplin pour la chute.", n: "Structure de la chrie journalistique : (A, B) suivis de C. C vise le trait, la pointe, la chute." },
        { t: "Au-dessus, T : le titre. Il met le lecteur sur la piste de ce qui se joue, sans reprendre les mots du texte ni gâcher la chute.", n: "Marianne et Charlie Hebdo titrent leurs brèves : T (A, B) C. Les six pistes de titres servent à cela." },
        { t: "Les Minimares du Canard enchaîné n’ont pas de titre : c’est l’exercice de l’examen. Proposer le T qui prépare la lecture.", n: "Un seul titre par extrait, quatre extraits sur huit : au-delà, malus." }
      ]
    }
  ];

  root.CAPSULES = CAPSULES;
})(typeof globalThis !== "undefined" ? globalThis : this);
