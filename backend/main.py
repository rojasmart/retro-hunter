import logging
import os
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

# Usar API Key ao invés de credenciais de conta de serviço para Gemini
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    logger.error("GOOGLE_API_KEY não está definido no arquivo .env.local")
    genai_configured = False
else:
    try:
        # Configurar o cliente Generative AI com API Key
        genai.configure(api_key=api_key)
        logger.info("Generative AI API inicializada com sucesso usando API Key")
        genai_configured = True
    except Exception as e:
        logger.error(f"Erro ao configurar Generative AI: {e}")
        genai_configured = False

# Define o modelo do agente configurado no Vertex AI Studio
MODEL_NAME = "gemini-pro"  # Modelo padrão do Gemini

# Define o esquema do corpo da requisição
class PromptRequest(BaseModel):
    prompt: str

# Endpoint para enviar uma pergunta ao agente
@app.post("/ask-agent")
async def ask_agent(request: PromptRequest):
    if not genai_configured:
        return {"error": "Generative AI não está configurado corretamente"}
        
    try:
        # Extrair o prompt do corpo da requisição
        prompt = request.prompt
        logger.debug(f"Sending prompt to agent: {prompt}")

        # Criar uma instância do modelo generativo
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        
        # Gerar uma resposta
        response = model.generate_content(prompt)
        
        # Extrair o texto da resposta
        if hasattr(response, "text"):
            result = response.text
        else:
            result = str(response)
            
        logger.debug(f"Response from Generative AI: {result}")
        return {"response": result}
    except Exception as e:
        logger.error(f"Error processing the request: {e}", exc_info=True)
        return {"error": f"Failed to process the request: {str(e)}"}