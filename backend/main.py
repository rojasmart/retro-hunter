import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega variáveis do .env.local
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

# Configurar o caminho para o arquivo de credenciais do Google Cloud
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ocr_model import extract_text_from_image
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    print("Arquivo recebido:", file.filename, "Tamanho:", len(contents))
    image = Image.open(io.BytesIO(contents))
    ocr_text = extract_text_from_image(image)
    
    return {
        "text": ocr_text,
        "matched_title": None,
        "score": None,
        "platform": None  # Sem detecção de plataforma
    }