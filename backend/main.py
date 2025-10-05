# filepath: [main.py](http://_vscodecontentref_/0)
import logging
import os
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from google.oauth2 import service_account
import google.generativeai as genai
from google.api_core import client_options

# Carregar variáveis de ambiente do arquivo [.env.local](http://_vscodecontentref_/1)
load_dotenv(dotenv_path="/media/rogerio/PROMETHEUS/Personal/retrosniffer/.env.local")

# Configure o nível de log
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Caminho para o arquivo de credenciais de conta de serviço
credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

if not credentials_path or not os.path.exists(credentials_path):
    logger.error(f"Credenciais não encontradas em: {credentials_path}")
    credentials = None
else:
    try:
        # Carregar credenciais do arquivo JSON
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path
        )
        logger.info("Credenciais de serviço carregadas com sucesso")
        
        # Configurar o cliente Generative AI com as credenciais
        genai.configure(
            credentials=credentials,
            project_id=project_id,
            location=location
        )
        logger.info("Generative AI API inicializada com sucesso")
    except Exception as e:
        logger.error(f"Erro ao carregar credenciais: {e}")
        credentials = None

# Define o modelo do agente configurado no Vertex AI Studio
MODEL_NAME = "gemini-pro"  # Modelo padrão do Gemini

# Define o esquema do corpo da requisição
class PromptRequest(BaseModel):
    prompt: str

# Endpoint para enviar uma pergunta ao agente
@app.post("/ask-agent")
async def ask_agent(request: PromptRequest):
    if credentials is None:
        return {"error": "Credenciais não configuradas corretamente"}
        
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