/* Cas fictifs originaux fondés sur les notions d’Orator 1. */
window.O1_DAILY_CASES = {
  c1: [
    {
      prompt: "Un délégué obtient un vote pour ouvrir un gymnase à une heure où les seuls créneaux de bus sont déjà terminés. En une phrase, distingue la réussite de sa prise de parole et la qualité de son conseil.",
      hint: "Sépare l’adhésion obtenue des conséquences de la proposition.",
      model: "Le délégué a convaincu l’assemblée, mais son conseil néglige l’accès au gymnase pour les personnes qui dépendent du bus.",
      criteria: ["Je relie le vote à l’efficacité du discours.", "J’évalue le conseil à partir d’une conséquence du projet."],
      cap: null
    },
    {
      prompt: "Tu repères comment un commerçant répond à une objection, puis tu construis ta réponse avec un procédé analogue. En une phrase, nomme les deux usages de la rhétorique.",
      hint: "Quel geste porte sur un discours existant et quel geste produit un nouveau discours ?",
      model: "Repérer le procédé du commerçant relève de l’analyse du discours ; l’employer dans ma réponse relève de la composition.",
      criteria: ["J’associe l’observation à l’analyse.", "J’associe la construction de ma réponse à la composition."],
      cap: null
    }
  ],
  c2: [
    {
      prompt: "L’heure d’un vote de club a été avancée sur le calendrier sans autorisation. Malik avait demandé cette avance devant tous les membres. En une phrase, retourne le soupçon dont il fait l’objet.",
      hint: "Qu’est-ce que Malik pouvait prévoir si l’heure du vote changeait après sa demande ?",
      model: "Malik pouvait prévoir que sa demande publique le ferait soupçonner en premier, ce qui pouvait le dissuader de changer l’heure lui-même.",
      criteria: ["Je réutilise le fait que la demande est connue.", "J’explique pourquoi l’anticipation du soupçon rend le geste moins probable."],
      cap: null
    },
    {
      prompt: "Une formatrice doit être payée quand sa stagiaire gagnera son premier procès. Elle poursuit sa stagiaire en justice avant que celle-ci ait plaidé ailleurs. En une phrase, explique comment elle réclame le paiement si sa stagiaire obtient gain de cause.",
      hint: "Compare l’issue de ce procès à la condition de l’accord initial.",
      model: "Si la stagiaire obtient gain de cause, elle remporte son premier procès et la formatrice peut invoquer la clause de paiement.",
      criteria: ["Je relève que ce procès est le premier pour la stagiaire.", "Je relie son succès à la clause de paiement."],
      cap: "corax"
    }
  ],
  c3: [
    {
      prompt: "La remise d’un dossier a pris six minutes de retard sur une réunion de deux heures, mais elle a consommé six des sept minutes réservées à la décision. En une phrase, amplifie le retard sans changer le fait.",
      hint: "Quel point de comparaison rend ces six minutes plus importantes pour l’assemblée ?",
      model: "Le dossier est arrivé avec six minutes de retard, absorbant presque tout le temps prévu pour prendre la décision.",
      criteria: ["Je conserve les six minutes de retard.", "Je choisis un point de comparaison qui en souligne l’effet."],
      cap: null
    },
    {
      prompt: "Un même local semble grand à un artisan seul et exigu à une équipe réunie pour une répétition. En une phrase, explique ce qui varie sans expliquer la divergence par une modification du local.",
      hint: "Rapporte chaque jugement à l’usage prévu par la personne qui le prononce.",
      model: "Le local est jugé grand pour le travail d’une seule personne et exigu pour la répétition d’un groupe, parce que le jugement dépend de l’usage auquel on le rapporte.",
      criteria: ["Je distingue le local de la façon dont on l’évalue.", "Je nomme le rapport qui explique les deux jugements."],
      cap: null
    }
  ],
  c4: [
    {
      prompt: "Une formatrice dit que ses élèves savent reconnaître une citation trompeuse et que certains en emploient quand même. En une phrase, indique quelle prémisse supplémentaire rendrait ces deux affirmations incompatibles.",
      hint: "Il faut un lien entre savoir reconnaître la faute et refuser de la commettre.",
      model: "Si toute personne capable de reconnaître une citation trompeuse refusait d’en employer une, les deux affirmations de la formatrice seraient incompatibles.",
      criteria: ["J’ajoute explicitement un lien entre connaissance et conduite.", "Je présente cette prémisse comme une hypothèse."],
      cap: "socrate"
    },
    {
      prompt: "Quelqu’un promet qu’il apprendra à ses élèves comment agir équitablement et admet qu’ils pourront ensuite agir injustement. En une phrase, dis ce qu’il peut refuser pour défendre la compatibilité de ses deux affirmations.",
      hint: "Dans la réfutation de Gorgias, quel passage de la connaissance à la conduite n’est pas automatique ?",
      model: "Il peut soutenir qu’une personne sait reconnaître ce qui est juste et choisit parfois d’agir autrement, ce qui rend ses deux affirmations compatibles.",
      criteria: ["J’identifie le passage de la connaissance à la conduite.", "J’explique comment son refus permet de maintenir les deux affirmations."],
      cap: "socrate"
    }
  ],
  c5: [
    {
      prompt: "Un sénateur romain respecté parle d’une voix hésitante devant des collègues qui connaissent ses services passés. En une phrase, distingue ce qui soutient d’avance sa parole et ce qui relève de sa prononciation.",
      hint: "À quel moment agit chacun des deux éléments ?",
      model: "Les services connus du Sénat soutiennent son auctoritas avant même son discours, tandis que sa voix hésitante relève de l’actio pendant qu’il parle.",
      criteria: ["J’associe à l’auctoritas une autorité déjà reconnue dans cet auditoire.", "Je distingue cette autorité de l’actio, qui concerne la mise en voix."],
      cap: null
    },
    {
      prompt: "Deux collègues proposent une mesure identique : l’un parle clairement, l’autre est particulièrement estimé pour son action passée. En une phrase, explique ce que cette comparaison aide à comprendre sur l’éloquence romaine.",
      hint: "Distingue le savoir-faire dans le discours et le crédit reconnu à la personne qui parle.",
      model: "Cette comparaison illustre la distinction entre un discours bien conduit et une parole qui bénéficie déjà du crédit de celui qui la prononce.",
      criteria: ["Je nomme les deux formes d’appui à la persuasion.", "Je précise que le crédit est déjà reconnu par le public."],
      cap: null
    }
  ],
  c6: [
    {
      prompt: "Un atelier ferme : on hésite entre une panne et un ordre du directeur. La dernière phrase rapporte qu’un salarié dit avoir entendu le directeur réclamer la fermeture. En une phrase, explique l’effet possible de cette dernière phrase.",
      hint: "Distingue l’effet de sa place dans le récit et la valeur de ce que rapporte le témoin.",
      model: "Le témoignage final rend l’hypothèse d’un ordre plus présente à l’esprit sans établir que le directeur a donné cet ordre.",
      criteria: ["J’explique comment la place du détail oriente le lecteur.", "Je maintiens la distinction entre témoignage et certitude."],
      cap: null
    },
    {
      prompt: "La présidente d’une association a ouvert ses ateliers à de nouveaux bénévoles. Compose un vœu d’une phrase qui prolonge l’éloge en l’ouvrant à l’avenir du groupe, à la manière du mouvement étudié chez Pline.",
      hint: "Souhaite la suite d’un bienfait, puis indique à qui il profitera.",
      model: "Puissions-nous poursuivre l’ouverture que tu as rendue possible, pour que les prochains bénévoles trouvent à leur tour leur place ici.",
      criteria: ["Je formule un vœu pour l’avenir.", "Je relie un mérite individuel à l’intérêt du groupe."],
      cap: null
    }
  ]
};
