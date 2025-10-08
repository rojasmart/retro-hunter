import logging
import os
import base64
from typing import Any

from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image
from ocr_model import extract_text_from_image

# Carregar variáveis de ambiente do arquivo .env.local
load_dotenv(dotenv_path="/media/rogerio/PROMETHEUS/Personal/retrosniffer/.env.local")

# Configure o nível de log
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configurar o cliente Generative AI
try:
    client = genai.Client(
        vertexai=True,
        api_key=os.environ.get("GOOGLE_CLOUD_API_KEY"),
    )
    logger.info("Cliente Generative AI configurado com sucesso.")
except Exception as e:
    logger.error("Erro ao configurar o cliente Generative AI: %s", e)
    raise e

# Modelo a ser usado
MODEL_NAME = "gemini-2.5-flash-preview-09-2025"


@app.get("/test-gemini")
async def test_gemini():
    try:
        model = "gemini-pro-vision"  # Tente com este nome de modelo público
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text="Diz olá!")]
            ),
        ]
        generate_content_config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=256,
        )
        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            response_text += chunk.text
        return {"result": response_text}
    except Exception as e:
        logger.error("Erro ao testar Gemini: %s", e, exc_info=True)
        return {"error": f"Erro ao testar Gemini: {str(e)}"}

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

        # Codificar a imagem em base64
        file.file.seek(0)  # Resetar o ponteiro do arquivo
        image_data = base64.b64encode(file.file.read()).decode("utf-8")

        # Criar as partes para o conteúdo
        msg_image = types.Part.from_bytes(
            data=base64.b64decode(image_data),
            mime_type="image/jpeg",
        )
        msg_text = types.Part.from_text(text=f"{prompt}\nTexto extraído da imagem: {extracted_text}")

        # Configurar o conteúdo e parâmetros do modelo
        contents = [
            types.Content(
                role="user",
                parts=[msg_image, msg_text],
            ),
        ]
        generate_content_config = types.GenerateContentConfig(
            temperature=1,
            top_p=0.95,
            max_output_tokens=65535,
            safety_settings=[
                types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF"),
            ],
        )

        # Enviar o conteúdo ao modelo e processar a resposta
        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=MODEL_NAME,
            contents=contents,
            config=generate_content_config,
        ):
            response_text += chunk.text

        # Dividir o texto extraído em linhas para obter título e plataforma
        lines = extracted_text.split("\n")
        title = lines[0] if len(lines) > 0 else "Título não encontrado"
        platform = lines[1] if len(lines) > 1 else "Plataforma não encontrada"

        # Montar uma string de resultado consolidada
        result_str = f"Resposta: {response_text}\nTítulo: {title}\nPlataforma: {platform}\nConfiança OCR: {confidence}"
        return {"result": result_str}
    except Exception as e:
        logger.error("Erro ao processar a solicitação: %s", e, exc_info=True)
        return {"error": f"Erro ao processar a solicitação: {str(e)}"}