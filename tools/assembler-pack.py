#!/usr/bin/env python3
"""Assemble le pack privé : fusionne cours-prive/pack-parts/*.json en cours-prive/pack.json.
Le script est public ; les données qu'il lit et produit restent dans cours-prive/ (hors dépôt).
Usage : python3 tools/assembler-pack.py
"""
import json, sys, glob, os, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = os.path.join(ROOT, "cours-prive", "pack-parts")
OUT = os.path.join(ROOT, "cours-prive", "pack.json")
LISTES = ["fiches", "qcm", "breves", "textes", "modeles", "chries", "enonces", "titres", "fautes", "ethos", "captatio", "affaires", "briques", "termes", "qui", "genres", "lieux", "missions"]
pack = {"format": "palestre-pack/1", "titre": "Cours Orator 1 à 4, 2025-2026", "date": datetime.date.today().isoformat(), "source": "Pack privé construit à partir des documents de cours (A. Rehbinder, C. Bréchet, Université Paris Nanterre). Ne pas diffuser.", "devoirs": {}, "notes": {}}
for k in LISTES: pack[k] = []
for path in sorted(glob.glob(os.path.join(PARTS, "*.json"))):
    with open(path, encoding="utf-8") as f:
        try: part = json.load(f)
        except json.JSONDecodeError as e: sys.exit(f"{os.path.basename(path)} : JSON invalide, {e}")
    for k, v in part.items():
        if k in LISTES: pack[k].extend(v)
        elif k in ("devoirs", "notes"): pack[k].update(v)
        elif k in ("titre", "date", "source", "modules"): pack[k] = v
        else: sys.exit(f"{os.path.basename(path)} : clé inconnue « {k} »")
ids = {}
for k in ("fiches", "qcm", "breves", "textes", "chries", "affaires"):
    for x in pack[k]:
        key = (k, x.get("id"))
        if not x.get("id"): sys.exit(f"{k} : élément sans id : {str(x)[:60]}")
        if key in ids: sys.exit(f"{k} : id en double « {x['id']} »")
        ids[key] = True
with open(OUT, "w", encoding="utf-8") as f: json.dump(pack, f, ensure_ascii=False, indent=1)
stats = {k: len(pack[k]) for k in LISTES if pack[k]}
print(f"pack.json écrit ({os.path.getsize(OUT)//1024} Ko) :", ", ".join(f"{v} {k}" for k, v in stats.items()))
