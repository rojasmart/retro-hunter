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
from urllib.parse import urlencode
import base64

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

# Função para buscar no eBay
async def search_ebay(game_name: str, platform: str = "all", condition: str = "all"):
    """Busca jogos no eBay usando a API oficial"""
    try:
        # Credenciais do eBay
        client_id = os.getenv("EBAY_CLIENT_ID")
        client_secret = os.getenv("EBAY_CLIENT_SECRET")
        is_sandbox = os.getenv("EBAY_SANDBOX") == "true"
        
        if not client_id or not client_secret:
            logger.warning("eBay credentials not configured")
            return []
        
        # URLs base
        base_url = "https://api.sandbox.ebay.com" if is_sandbox else "https://api.ebay.com"
        
        # Obter token
        credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
        
        token_response = requests.post(
            f"{base_url}/identity/v1/oauth2/token",
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': f'Basic {credentials}'
            },
            data={
                'grant_type': 'client_credentials',
                'scope': 'https://api.ebay.com/oauth/api_scope'
            }
        )
        
        if not token_response.ok:
            logger.error(f"Failed to get eBay token: {token_response.text}")
            return []
        
        token_data = token_response.json()
        access_token = token_data['access_token']
        
        # Construir query de busca
        query = game_name.strip()
        
        # Mapear plataforma
        if platform and platform != "all":
            platform_map = {
                "retro": "dreamcast",
                "dreamcast": "dreamcast", 
                "ps2": "playstation 2",
                "ps3": "playstation 3",
                "ps4": "playstation 4",
                "xbox": "xbox",
                "xbox360": "xbox 360",
                "nintendo-switch": "nintendo switch",
                "nintendo-wii": "wii",
                "nintendo-ds": "nintendo ds",
                "master-system": "master system",
                "genesis": "genesis",
            }
            platform_name = platform_map.get(platform, platform)
            query = f"{query} {platform_name}".strip()
        
        # Parâmetros de busca
        search_params = {
            'q': query,
            'limit': '100',
            'category_ids': '139973'  # Video Games category
        }
        
        # Adicionar filtro de condição
        if condition != "all":
            condition_map = {
                'new': '1000',
                'used': '3000', 
                'refurbished': '2000'
            }
            if condition in condition_map:
                search_params['filter'] = f'conditionIds:{{{condition_map[condition]}}}'
        
        # Fazer busca no eBay
        search_url = f"{base_url}/buy/browse/v1/item_summary/search?" + urlencode(search_params)
        
        search_response = requests.get(
            search_url,
            headers={
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
            }
        )
        
        if not search_response.ok:
            logger.error(f"eBay search failed: {search_response.text}")
            return []
        
        search_data = search_response.json()
        items = search_data.get('itemSummaries', [])
        
        # Processar resultados
        results = []
        for item in items:
            try:
                title = item.get('title', '').lower()
                search_term = game_name.lower()
                
                # Filtrar itens irrelevantes
                if not title or search_term not in title:
                    continue
                
                # Excluir itens que não são jogos
                exclude_keywords = [
                    'manual', 'box only', 'case only', 'cover', 'artwork', 'poster',
                    'sword', 'cosplay', 'figure', 'statue', 'keychain', 'necklace',
                    't-shirt', 'shirt', 'clothing', 'apparel', 'mug', 'cup',
                    'sticker', 'decal', 'pin', 'badge', 'soundtrack', 'cd only',
                    'guide', 'book', 'strategy', 'prima'
                ]
                
                if any(keyword in title for keyword in exclude_keywords):
                    continue
                
                price_info = item.get('price', {})
                price = float(price_info.get('value', 0))
                
                if price <= 0:
                    continue
                
                # Limpar título
                clean_title = item.get('title', '')
                
                result = {
                    'title': clean_title,
                    'priceText': f"{price} {price_info.get('currency', 'USD')}",
                    'price': price,
                    'link': item.get('itemWebUrl', '#'),
                    'site': 'eBay',
                    'image': item.get('thumbnailImages', [{}])[0].get('imageUrl', '') or item.get('image', {}).get('imageUrl', ''),
                    'condition': item.get('condition', 'Unknown'),
                    'tags': [
                        f"🏷️ {item.get('condition', 'Unknown')}",
                        platform if platform and platform != "all" else None
                    ]
                }
                
                # Remove tags None
                result['tags'] = [tag for tag in result['tags'] if tag]
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error processing eBay item: {e}")
                continue
        
        logger.info(f"Found {len(results)} eBay results for '{game_name}'")
        return results
        
    except Exception as e:
        logger.error(f"eBay search error: {e}")
        return []

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

       # Tentar extrair título e plataforma da resposta do modelo
        match = re.search(r"(?:Title|Nome)[:\-]?\s*(.+?)[\n\r]+(?:Platform|Plataforma)[:\-]?\s*(.+)", result, re.IGNORECASE)
        if match:
            titulo = match.group(1).strip()
            plataforma = match.group(2).strip()
        else:
            # Novo: tentar extrair por vírgula
            parts = [p.strip() for p in result.split(",")]
            if len(parts) == 2:
                titulo, plataforma = parts
            else:
                titulo = ""
                plataforma = ""
        return {
            "titulo": titulo,
            "plataforma": plataforma,
            "raw": result
        }
    except Exception as e:
        logger.error("Erro ao processar a solicitação: %s", e, exc_info=True)
        return {"error": f"Erro ao processar a solicitação: {str(e)}"}

# Endpoint combinado OCR + eBay
@app.post("/ask-agent-image-with-ebay")
async def ask_agent_image_with_ebay(
    prompt: str = Form("return the name and platform of this game with comma separated"),
    file: UploadFile = File(...)
):
    try:
        # Fazer OCR primeiro (reutilizar código existente)
        ocr_result = await ask_agent_image(prompt, file)
        
        # Extrair dados do OCR
        titulo = ocr_result.get("titulo", "")
        plataforma = ocr_result.get("plataforma", "all")
        
        # Se temos um título, buscar no eBay
        search_term = titulo.strip() if titulo else ""
        ebay_results = []
        
        if search_term:
            logger.info(f"Searching eBay for: {search_term} (platform: {plataforma})")
            ebay_results = await search_ebay(search_term, plataforma)
        
        return {
            **ocr_result,  # Incluir todos os dados do OCR
            "ebay_results": ebay_results,
            "total_ebay": len(ebay_results)
        }
        
    except Exception as e:
        logger.error(f"Error in combined OCR+eBay endpoint: {e}")
        return {
            "error": str(e),
            "titulo": "",
            "plataforma": "",
            "raw": "",
            "ebay_results": [],
            "total_ebay": 0
        }

# Endpoint separado só para eBay
@app.get("/ebay-search")
async def ebay_search_endpoint(
    game_name: str,
    platform: str = "all",
    condition: str = "all"
):
    try:
        results = await search_ebay(game_name, platform, condition)
        return {
            "resultados": results,
            "total": len(results)
        }
    except Exception as e:
        logger.error(f"eBay search endpoint error: {e}")
        return {
            "error": str(e),
            "resultados": [],
            "total": 0
        }