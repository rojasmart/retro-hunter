import json
import re
from pathlib import Path
from rapidfuzz import process, fuzz

# Caminho do catálogo PS2
CATALOG_PATH = Path(__file__).parent / "datasets" / "ps2.json"

# Carrega o catálogo PS2 uma vez
with open(CATALOG_PATH, encoding="utf-8") as f:
    catalog = json.load(f)

# Extrai lista de títulos
titles = [row["Title"] for row in catalog if "Title" in row]

def normalize_text(s):
    s = s.upper()
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def fuzzy_match(ocr_text, titles, limit=3):
    norm_ocr = normalize_text(ocr_text)
    norm_titles = [normalize_text(t) for t in titles]
    result = process.extractOne(norm_ocr, norm_titles, scorer=fuzz.WRatio)
    # Recupera o título original pelo índice
    if result:
        idx = norm_titles.index(result[0])
        return {"title": titles[idx], "score": result[1]}
    return None

# Exemplo de uso
if __name__ == "__main__":
    ocr_text = "PlayStation&2 PlayStation.2 THOMAS &FRIENDS Thomas & Friends:A Day at the Races ADAYATTHERACES THOMAS ADAYATTHERACES THOMAS &FRIENDS ADAY AT THERACES PlayStation.2"
    match = fuzzy_match(ocr_text, titles)
    print(match)
