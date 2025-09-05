import json
import os
from rapidfuzz import fuzz

# Caminho para o platform.json
PLATFORM_PATH = os.path.join(os.path.dirname(__file__), "datasets", "platform.json")

# Carrega o dataset de plataformas
with open(PLATFORM_PATH, encoding="utf-8") as f:
    platforms = json.load(f)

def match_platform(text: str, threshold: int = 80) -> str | None:
    """
    Faz fuzzy match do texto com todos os aliases do platform.json.
    Retorna o nome da plataforma se encontrar, senão None.
    """
    text = text.lower()
    best_score = 0
    best_platform = None
    for entry in platforms:
        platform_name = entry.get("Platform", entry["Alias"][0])
        for alias in entry["Alias"]:
            score = fuzz.partial_ratio(text, alias.lower())
            if score > best_score and score >= threshold:
                best_score = score
                best_platform = platform_name
    return best_platform