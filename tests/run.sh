#!/bin/sh
# Lance la suite de tests avec JavaScriptCore (présent sur macOS). À exécuter depuis la racine du dépôt :
#   sh tests/run.sh
# Le pack privé cours-prive/pack.json est testé s'il existe ; sinon pack-exemple.json sert de jeu de données.
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
[ -x "$JSC" ] || JSC=$(command -v jsc)
[ -x "$JSC" ] || { echo "jsc introuvable"; exit 2; }
cd "$(dirname "$0")/.." || exit 2
"$JSC" tests/run.js
