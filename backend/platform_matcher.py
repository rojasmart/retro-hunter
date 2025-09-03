import json
import os
from rapidfuzz import fuzz

def load_platforms(json_path=None):
    if json_path is None:
        json_path = os.path.join(os.path.dirname(__file__), 'datasets', 'platform.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def match_platform(text, platforms=None, threshold=80):
    """
    Faz fuzzy match entre o texto e os aliases das plataformas.
    Retorna o nome da plataforma se encontrar, senão None.
    """
    if platforms is None:
        platforms = load_platforms()
    text_lower = text.lower()
    for entry in platforms:
        for alias in entry['Alias']:
            score = fuzz.partial_ratio(text_lower, alias.lower())
            if score >= threshold:
                return entry['Platform']
    return None

# Exemplo de uso:
if __name__ == "__main__":
    sample_text = "HELLOKITTY ROlaPR PlayStation.2 L PlayStation.2 Hello Kitty Roller Rescue HelloKitty XPLOSIV"
    print(match_platform(sample_text))
