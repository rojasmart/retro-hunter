import logging
import os
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

from fastapi import File, UploadFile, Form

# Carregar variáveis de ambiente do arquivo .env.local
load_dotenv(dotenv_path="/media/rogerio/PROMETHEUS/Personal/retrosniffer/.env.local")

# Configure o nível de log
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Remover a API Key do ambiente para evitar conflitos (opcional)
if "GOOGLE_API_KEY" in os.environ:
    del os.environ["GOOGLE_API_KEY"]

# Configurar o cliente Generative AI
try:
    # Configurar o cliente para usar as credenciais padrão (ADC)
    genai.configure()
    logger.info("Generative AI configurado com sucesso usando credenciais padrão (ADC).")
except Exception as e:
    logger.error("Erro ao configurar o cliente Generative AI: %s", e)
    raise e

# Modelo a ser usado (use um modelo público para testes)
MODEL_NAME = "gemini-2.5-flash-preview-09-2025"  # Substitua pelo modelo configurado no Vertex AI

# Define o esquema do corpo da requisição
class PromptRequest(BaseModel):
    prompt: str

@app.post("/ask-agent-image")
async def ask_agent_image(prompt: str = Form(...), file: UploadFile = File(...)):
    try:
        # Ler bytes da imagem
        image_bytes = await file.read()

        # Instanciar o modelo
        model = genai.GenerativeModel(model_name=MODEL_NAME)

        # Criar o conteúdo para o Gemini (imagem + texto)
        contents = [
            {"role": "user", "parts": [
                {"mime_type": file.content_type or "image/jpeg", "data": image_bytes},
                {"text": prompt}
            ]}
        ]

        # Gerar resposta
        response = model.generate_content(contents)
        result = response.text if hasattr(response, "text") else str(response)
        return {"response": result}
    except Exception as e:
        logger.error("Erro ao processar a solicitação: %s", e, exc_info=True)
        return {"error": f"Erro ao processar a solicitação: {str(e)}"}