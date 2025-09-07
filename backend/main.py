from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ocr_model import extract_text_from_image
from title_matcher import TitleMatcher
from platform_matcher import match_platform
from PIL import Image
import io
import os

import torch
print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU detected")

app = FastAPI()

# Permitir chamadas do Next.js (local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ou o domínio de produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# Dicionário de plataforma para dataset
platform_to_dataset = {
    "Amiga": os.path.join(BASE_DIR, "datasets", "amiga.json"),
    "Dreamcast": os.path.join(BASE_DIR, "datasets", "dreamcast.json"),
    "Gameboy Advance": os.path.join(BASE_DIR, "datasets", "gameboy_advance.json"),
    "Gameboy Color": os.path.join(BASE_DIR, "datasets", "gameboy_color.json"),
    "Gamegear": os.path.join(BASE_DIR, "datasets", "game_gear.json"),
    "Neo Geo": os.path.join(BASE_DIR, "datasets", "neo_geo.json"),
    "Nintendo": os.path.join(BASE_DIR, "datasets", "nintendo.json"),
    "Super Nintendo": os.path.join(BASE_DIR, "datasets", "super_nintendo.json"),
    "Nintendo Switch": os.path.join(BASE_DIR, "datasets", "nintendo_switch.json"),
    "Nintendo 64": os.path.join(BASE_DIR, "datasets", "nintendo_64.json"),
    "Nintendo Wii": os.path.join(BASE_DIR, "datasets", "nintendo_wii.json"),
    "Nintendo Wii U": os.path.join(BASE_DIR, "datasets", "nintendo_wii_u.json"),
    "Nintendo 3DS": os.path.join(BASE_DIR, "datasets", "nintendo_3ds.json"),  
    "Nintendo DS": os.path.join(BASE_DIR, "datasets", "nintendo_ds.json"),
    "Nintendo Gamecube": os.path.join(BASE_DIR, "datasets", "nintendo_gamecube.json"),
    "Playstation 1": os.path.join(BASE_DIR, "datasets", "playstation_1.json"),
    "Playstation 2": os.path.join(BASE_DIR, "datasets", "playstation_2.json"),
    "Playstation 3": os.path.join(BASE_DIR, "datasets", "playstation_3.json"),
    "Playstation 4": os.path.join(BASE_DIR, "datasets", "playstation_4.json"),
    "Playstation 5": os.path.join(BASE_DIR, "datasets", "playstation_5.json"),
    "Playstation Vita": os.path.join(BASE_DIR, "datasets", "playstation_vita.json"),
    "Psp": os.path.join(BASE_DIR, "datasets", "psp.json"),
    "Sega Master System": os.path.join(BASE_DIR, "datasets", "sega_master_system.json"),
    "Sega Megadrive": os.path.join(BASE_DIR, "datasets", "sega_megadrive.json"),
    "Sega Saturn": os.path.join(BASE_DIR, "datasets", "sega_saturn.json"),
    "Xbox": os.path.join(BASE_DIR, "datasets", "xbox.json"),
    "Xbox 360": os.path.join(BASE_DIR, "datasets", "xbox_360.json"),
    "Xbox One": os.path.join(BASE_DIR, "datasets", "xbox_one.json"),
    "Xbox Series": os.path.join(BASE_DIR, "datasets", "xbox_series.json"),
    "Zx Spectrum": os.path.join(BASE_DIR, "datasets", "zx_spectrum.json"),
  
    # Adicione outras plataformas conforme necessário
}

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    print("Arquivo recebido:", file.filename, "Tamanho:", len(contents))
    image = Image.open(io.BytesIO(contents))
    ocr_text = extract_text_from_image(image)
    platform = match_platform(ocr_text["text"])
    dataset_path = platform_to_dataset.get(platform)
    match = None
    if dataset_path:
        matcher = TitleMatcher(dataset_path)
        match = matcher.fuzzy_match(ocr_text["text"])
    return {
        "text": ocr_text,
        "matched_title": match["title"] if match else None,
        "score": match["score"] if match else None,
        "platform": platform
    }