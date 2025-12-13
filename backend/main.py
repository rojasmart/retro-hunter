import logging
import os
from typing import Any

import re

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

from fastapi import File, UploadFile, Form

from fastapi.middleware.cors import CORSMiddleware
import requests

# Carregar variáveis de ambiente do arquivo .env.local
load_dotenv(dotenv_path="/media/rogerio/PROMETHEUS/Personal/retro-hunter/.env.local")

# Configure o nível de log
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Ou ["*"] para todos (menos seguro)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Função para buscar preços no Price Charting
async def search_price_charting(game_name: str):
    """Busca preços de jogos no Price Charting API"""
    try:
        # Token do Price Charting
        api_token = "96630e69825ff33893df7004397367a75f6aa91a"
        
        # Limpar o nome do jogo para a query (remover espaços extras)
        query = game_name.strip().replace(" ", "")
        
        # Construir URL da API
        api_url = f"https://www.pricecharting.com/api/product?t={api_token}&q={query}"
        
        logger.info(f"Searching Price Charting for: {game_name} (query: {query})")
        
        # Fazer requisição à API
        response = requests.get(api_url)
        
        if not response.ok:
            logger.error(f"Price Charting API error: {response.status_code} - {response.text}")
            return None
        
        data = response.json()
        
        # Verificar se a busca foi bem-sucedida
        if data.get("status") != "success":
            logger.warning(f"Price Charting returned non-success status for '{game_name}'")
            return None
        
        # Converter preços de pennies para dólares
        def pennies_to_dollars(pennies):
            if pennies is None or pennies == "":
                return None
            try:
                return float(pennies) / 100
            except:
                return None
        
        result = {
            "id": data.get("id"),
            "product_name": data.get("product-name"),
            "console_name": data.get("console-name"),
            "genre": data.get("genre"),
            "release_date": data.get("release-date"),
            "upc": data.get("upc"),
            "asin": data.get("asin"),
            "prices": {
                "loose": pennies_to_dollars(data.get("loose-price")),
                "cib": pennies_to_dollars(data.get("cib-price")),
                "new": pennies_to_dollars(data.get("new-price")),
                "graded": pennies_to_dollars(data.get("graded-price")),
                "box_only": pennies_to_dollars(data.get("box-only-price"))
            },
            "currency": "USD"
        }
        
        logger.info(f"Found Price Charting data for '{game_name}': {result['product_name']} ({result['console_name']})")
        return result
        
    except Exception as e:
        logger.error(f"Price Charting search error for '{game_name}': {e}")
        return None

@app.post("/ask-agent-image")
async def ask_agent_image(
    prompt: str = Form("return the name and platform of this game with comma separated"),
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        contents = [
            {"role": "user", "parts": [
                {"mime_type": file.content_type or "image/jpeg", "data": image_bytes},
                {"text": prompt}
            ]}
        ]
        response = model.generate_content(contents)
        result = response.text if hasattr(response, "text") else str(response)

        # Parse o `raw` em um array de jogos
        games = []
        for line in result.split("\n"):
            parts = line.split(",")
            if len(parts) >= 2:
                title = parts[0].strip()
                platform = parts[1].strip()
                if title and platform:
                    games.append({"title": title, "platform": platform})

        return {
            "games": games,
            "raw": result
        }
    except Exception as e:
        logger.error("Erro ao processar a solicitação: %s", e, exc_info=True)
        return {"error": f"Erro ao processar a solicitação: {str(e)}"}

# Endpoint combinado OCR + Price Charting
@app.post("/ask-agent-image-with-prices")
async def ask_agent_image_with_prices(
    prompt: str = Form("return the name and platform of this game with comma separated"),
    file: UploadFile = File(...)
):
    try:
        # Fazer OCR primeiro
        ocr_result = await ask_agent_image(prompt, file)
        
        if "error" in ocr_result:
            return ocr_result

        # Extrair jogos detectados
        games = ocr_result.get("games", [])

        # Filtrar jogos duplicados
        filtered_games = []
        seen_titles = set()
        for game in games:
            title_lower = game["title"].lower()
            if title_lower not in seen_titles:
                seen_titles.add(title_lower)
                filtered_games.append(game)

        # Buscar preços no Price Charting para cada jogo
        price_results = []
        for game in filtered_games:
            price_data = await search_price_charting(game["title"])
            if price_data:
                price_results.append({
                    "detected_title": game["title"],
                    "detected_platform": game["platform"],
                    **price_data
                })

        return {
            "games": filtered_games,
            "price_data": price_results,
            "total_found": len(price_results)
        }

    except Exception as e:
        logger.error(f"Error in combined OCR+Price Charting endpoint: {e}")
        return {
            "error": str(e),
            "games": [],
            "price_data": [],
            "total_found": 0
        }

# Endpoint separado só para Price Charting
@app.get("/price-search")
async def price_search_endpoint(game_name: str):
    try:
        result = await search_price_charting(game_name)
        if result:
            return {
                "success": True,
                "data": result
            }
        else:
            return {
                "success": False,
                "error": "Game not found or API error"
            }
    except Exception as e:
        logger.error(f"Price search endpoint error: {e}")
        return {
            "success": False,
            "error": str(e)
        }