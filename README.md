# Palestre Orator

Application de révision pour le DU Orator (Université Paris Nanterre), modules Orator 1 à 4. Elle s'installe sur iPhone et iPad comme une appli (PWA) et fonctionne hors ligne.

## Principe

Le code de l'appli est public. Les textes des cours, les corrigés et les corpus (A. Rehbinder, C. Bréchet) ne sont **jamais** dans le dépôt : ils vivent dans un **pack privé** (`pack.json`) que chacun importe sur son appareil. Sans pack, l'appli propose les capsules, la chrie du jour et les mécaniques ; avec le pack, elle propose les fiches, le QCM d'Orator 1, les contes d'Orator 3, les brèves et Minimares d'Orator 4 avec leurs corrigés.

## Installer sur iPhone ou iPad

1. Ouvrir l'adresse GitHub Pages du dépôt dans Safari.
2. Bouton Partager, puis « Sur l'écran d'accueil ».
3. Ouvrir l'appli depuis l'écran d'accueil : elle est alors en plein écran et disponible hors ligne.
4. Carnet → Pack de cours → Importer un fichier : choisir `pack.json` (depuis Fichiers, iCloud, AirDrop).

## Passer d'un appareil à l'autre

Carnet → Sauvegarde → Exporter la progression (ou progression et pack). Envoyer le fichier à l'autre appareil, puis l'importer et choisir **Fusionner** : le meilleur des deux progressions est conservé.

## Construire le pack privé

Les sources restent dans `cours-prive/` (ignoré par git). Les données sont découpées en morceaux dans `cours-prive/pack-parts/*.json`, puis assemblées :

```sh
python3 tools/assembler-pack.py
```

Le fichier `pack-exemple.json` montre le schéma attendu avec des contenus fictifs.

## Tests

La suite tourne avec JavaScriptCore, présent sur macOS, sans rien installer :

```sh
sh tests/run.sh
```

Elle teste le cœur logique fonction par fonction (répétition espacée, relecteur, notation, fusion de sauvegardes, validation du pack), chaque vue et chaque type d'étape avec et sans pack, et la cohérence du pack privé s'il est présent.

## Fichiers

- `index.html`, `app.css`, `app.js` : interface.
- `core.js` : logique pure, sans DOM, partagée avec les tests.
- `capsules.js` : les capsules animées (dessins SVG et légendes).
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et hors ligne. Pour publier une mise à jour, changer `VERSION` dans `sw.js`.
- `v1/` : la première version, conservée pour mémoire.
