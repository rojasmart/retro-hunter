from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ocr_model import extract_text_from_image
from PIL import Image
import io


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

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    result = extract_text_from_image(image)
    return {"text": result}
