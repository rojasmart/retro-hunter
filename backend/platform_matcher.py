import json
import os
import re
from rapidfuzz import fuzz

# Caminho para o platform.json
PLATFORM_PATH = os.path.join(os.path.dirname(__file__), "datasets", "platform.json")

# Carrega o dataset de plataformas
with open(PLATFORM_PATH, encoding="utf-8") as f:
    platforms = json.load(f)

def normalize(s: str) -> str:
    """Remove espaços, pontuação e deixa maiúsculo para comparação robusta."""
    return re.sub(r"[^A-Z0-9]", "", s.upper())

def match_platform(text: str, threshold: int = 80) -> str | None:
    """
    Faz substring match e fuzzy match do texto com todos os aliases do platform.json.
    Retorna o nome da plataforma se encontrar, senão None.
    """
    if not text:
        return None

    norm_text = normalize(text)
    if not norm_text:
        return None

    # Prefer the longest substring alias match (avoids matching "XBOX" before "XBOXONE")
    best_substring_platform = None
    best_substring_len = 0

    # Track best fuzzy match as fallback
    best_fuzzy_platform = None
    best_fuzzy_score = 0

    for entry in platforms:
        platform_name = entry.get("Platform") or (entry.get("Alias") and entry["Alias"][0])
        for alias in entry.get("Alias", []):
            norm_alias = normalize(alias)
            if not norm_alias:
                continue

            # Check substring (prefer longer aliases)
            if norm_alias in norm_text:
                if len(norm_alias) > best_substring_len:
                    best_substring_len = len(norm_alias)
                    best_substring_platform = platform_name
                # continue checking other aliases to find possibly longer matches
                continue

            # Fuzzy match fallback
            score = fuzz.partial_ratio(norm_alias, norm_text)
            if score > best_fuzzy_score:
                best_fuzzy_score = score
                best_fuzzy_platform = platform_name

    if best_substring_platform:
        return best_substring_platform

    if best_fuzzy_score >= threshold:
        return best_fuzzy_platform

    return None