import logging
import os
from typing import Any

from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
from ocr_model import extract_text_from_image

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

@app.post("/ask-agent")
async def ask_agent(file: UploadFile = File(...), prompt: str = "Qual é o título deste jogo, qual a plataforma e qual o preço médio?"):
    try:
        # Abrir a imagem enviada
        image = Image.open(file.file)

        # Extrair texto da imagem usando o Document AI
        ocr_result = extract_text_from_image(image)

        # Processar o texto extraído para obter título e plataforma
        extracted_text = ocr_result["text"]
        confidence = ocr_result["confidence"]

        # Adicionar o texto extraído ao prompt
        full_prompt = f"{prompt}\nTexto extraído da imagem: {extracted_text}"
        logger.debug("Prompt completo enviado ao modelo: %s", full_prompt)

        # Enviar o prompt ao modelo Generative AI
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        response = model.generate_content(full_prompt)

        # Extrair o texto da resposta
        result = response.text if hasattr(response, "text") else str(response)
        logger.debug("Resposta do modelo: %s", result)

        # Dividir o texto extraído em linhas para obter título e plataforma
        lines = extracted_text.split("\n")
        title = lines[0] if len(lines) > 0 else "Título não encontrado"
        platform = lines[1] if len(lines) > 1 else "Plataforma não encontrada"

        return {
            "response": result,
            "title": title,
            "platform": platform,
            "confidence": confidence,
        }
    except Exception as e:
        logger.error("Erro ao processar a solicitação: %s", e, exc_info=True)
        return {"error": f"Erro ao processar a solicitação: {str(e)}"}