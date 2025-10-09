import logging
import os
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

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

@app.post("/ask-agent")
async def ask_agent(request: PromptRequest):
    try:
        prompt = request.prompt
        logger.debug("Enviando prompt para o modelo: %s", prompt)

        # Instanciar o modelo e gerar resposta
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        response = model.generate_content(prompt)

        # Extrair o texto da resposta
        result = response.text if hasattr(response, "text") else str(response)
        logger.debug("Resposta do modelo: %s", result)
        return {"response": result}
    except Exception as e:
        logger.error("Erro ao processar a solicitação: %s", e, exc_info=True)
        return {"error": f"Erro ao processar a solicitação: {str(e)}"}