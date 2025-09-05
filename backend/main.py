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
    "Playstation 1": os.path.join(BASE_DIR, "datasets", "playstation_1.json"),
    "Playstation 2": os.path.join(BASE_DIR, "datasets", "playstation_2.json"),
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