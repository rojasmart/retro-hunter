import json
import re
import math
from pathlib import Path
from rapidfuzz import fuzz
from typing import List, Dict, Tuple

# Caminho do catálogo PS2
CATALOG_PATH = Path(__file__).parent / "datasets" / "ps2.json"

# Carrega o catálogo PS2 uma vez
with open(CATALOG_PATH, encoding="utf-8") as f:
    catalog = json.load(f)

# Extrai lista de títulos
titles: List[str] = [row["Title"] for row in catalog if "Title" in row]

def normalize_text(s: str) -> str:
    s = s.upper()
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def tokenize(s: str) -> List[str]:
    return [t for t in normalize_text(s).split(" ") if t]

# Pré-cálculos para IDF e tokens
_N = max(1, len(titles))
_norm_titles: List[str] = [normalize_text(t) for t in titles]
_title_token_sets: List[set] = [set(tokenize(t)) for t in titles]

# Document frequency por token
_df: Dict[str, int] = {}
for toks in _title_token_sets:
    for tok in toks:
        _df[tok] = _df.get(tok, 0) + 1

# IDF suavizado
_idf: Dict[str, float] = {tok: math.log(1.0 + (_N / (1.0 + df))) for tok, df in _df.items()}

# Soma de IDF por título (para normalização opcional)
_title_idf_sum: List[float] = [sum(_idf.get(tok, 0.0) for tok in toks) for toks in _title_token_sets]

def _weighted_jaccard_idf(q_tokens: set, t_tokens: set) -> float:
    if not q_tokens or not t_tokens:
        return 0.0
    inter = q_tokens & t_tokens
    union = q_tokens | t_tokens
    w_inter = sum(_idf.get(tok, 0.0) for tok in inter)
    w_union = sum(_idf.get(tok, 0.0) for tok in union)
    if w_union <= 0:
        return 0.0
    return w_inter / w_union

def _composite_score(norm_q: str, q_tokens: List[str], idx: int) -> float:
    t_norm = _norm_titles[idx]
    t_tokens = _title_token_sets[idx]
    q_set = set(q_tokens)

    # 1) Similaridade por palavras com pesos (IDF)
    s_idf = _weighted_jaccard_idf(q_set, t_tokens)  # 0..1

    # 2) Similaridade por caracteres (mista)
    s_wr = fuzz.WRatio(norm_q, t_norm) / 100.0
    s_ts = fuzz.token_set_ratio(norm_q, t_norm) / 100.0

    # 3) Peq. bônus se todos os números do query aparecem no título (ex.: "3")
    nums_q = {tok for tok in q_set if tok.isdigit()}
    nums_t = {tok for tok in t_tokens if tok.isdigit()}
    s_num = 0.05 if nums_q and nums_q.issubset(nums_t) else 0.0

    # Combinação (ajustável): dá mais peso ao IDF por palavras
    score = 0.55 * s_idf + 0.30 * s_wr + 0.15 * s_ts + s_num
    # clamp
    return max(0.0, min(1.0, score))

def fuzzy_match(ocr_text: str, _unused_titles: List[str] = None, limit: int = 1):
        """
        Retorna o(s) melhor(es) título(s) do catálogo PS2 para o texto OCR, usando
        uma combinação de:
            - Sobreposição de tokens ponderada por IDF (probabilidade/peso de palavras)
            - Similaridade de caracteres (WRatio + token_set_ratio)
            - Checagem de números

        Retorna um dict (quando limit=1) ou lista de dicts (quando limit>1) com:
            { title, score }  # score em 0..100
        """
        norm_q = normalize_text(ocr_text or "")
        q_tokens = tokenize(ocr_text or "")
        if not norm_q:
                return None if limit == 1 else []

        scored: List[Tuple[int, float]] = []  # (idx, score)
        for i in range(len(titles)):
                s = _composite_score(norm_q, q_tokens, i)
                scored.append((i, s))

        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:max(1, limit)]
        results = [{"title": titles[i], "score": round(s * 100.0, 2)} for i, s in top]
        return results[0] if limit == 1 else results

# Exemplo de uso
if __name__ == "__main__":
    ocr_text = "PlayStation&2 PlayStation.2 THOMAS &FRIENDS Thomas & Friends:A Day at the Races ADAYATTHERACES THOMAS ADAYATTHERACES THOMAS &FRIENDS ADAY AT THERACES PlayStation.2"
    match = fuzzy_match(ocr_text, titles)
    print(match)
