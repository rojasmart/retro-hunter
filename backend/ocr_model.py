import os
import sys
import numpy as np
import torch
from PIL import Image
from platform_matcher import match_platform

# Força uso do CPU ANTES de importar qualquer coisa do OpenOCR
os.environ['CUDA_VISIBLE_DEVICES'] = ''
torch.cuda.is_available = lambda: False

# Adiciona o diretório OpenOCR ao path para importar as ferramentas
sys.path.append(os.path.join(os.path.dirname(__file__), 'OpenOCR'))

try:
    from tools.infer_e2e import OpenOCR
except ImportError as e:
    print(f"Erro ao importar OpenOCR: {e}")
    print("Certifique-se de que a pasta OpenOCR/tools está presente e as dependências estão instaladas.")
    raise

# Inicializa o sistema OCR (usando o modelo mobile por padrão)
text_sys = None

def initialize_ocr():
    """Inicializa o sistema OCR uma única vez"""
    global text_sys
    if text_sys is None:
        try:
            # Remove o parâmetro use_gpu que não é aceito
            text_sys = OpenOCR(mode='mobile', drop_score=0.4)
            print("Sistema OCR inicializado com sucesso no CPU!")
        except Exception as e:
            print(f"Erro ao inicializar OCR: {e}")
            raise
    return text_sys

def extract_text_from_image(image: Image.Image) -> dict:
    """
    Extrai texto de uma imagem usando o pipeline do OpenOCR
    Retorna um dicionário com o texto extraído e a plataforma detectada
    """
    try:
        # Inicializa o OCR se ainda não foi inicializado
        ocr_system = initialize_ocr()
        
        # Converte PIL Image para numpy array (BGR format)
        img_array = np.array(image)
        
        # Se a imagem tem 4 canais (RGBA), converte para 3 canais (RGB)
        if img_array.shape[-1] == 4:
            img_array = img_array[:, :, :3]
        
        # Converte RGB para BGR (formato esperado pelo OpenOCR)
        img_bgr = img_array[:, :, ::-1]
        
        # Executa a inferência OCR
        results = ocr_system(img_numpy=img_bgr)

        # Debug: vamos ver o formato dos resultados
        print(f"Tipo de results: {type(results)}")
        print(f"Conteúdo de results: {results}")
        
        # Garante que sempre retornamos uma string
        extracted_text = ""

        # Função auxiliar para varrer listas/tuplas aninhadas e coletar 'transcription'
        def collect_transcriptions(obj):
            texts_local = []
            def walk(o):
                if isinstance(o, dict):
                    t = o.get('transcription')
                    if isinstance(t, str) and t.strip():
                        texts_local.append(t.strip())
                elif isinstance(o, (list, tuple)):
                    for x in o:
                        walk(x)
            walk(obj)
            return texts_local
        
        # O resultado é uma tupla (detection_results, stats)
        if isinstance(results, (tuple, list)) and len(results) > 0:
            detection_results = results[0]  # Primeiro elemento: detecções (podem estar aninhadas)
            texts = collect_transcriptions(detection_results)
            extracted_text = ' '.join(texts) if texts else "Nenhum texto detectado"
        else:
            extracted_text = "Nenhum texto detectado"
            
        platform = match_platform(extracted_text)
        return {
            "text": str(extracted_text) if extracted_text else "Nenhum texto detectado",
            "platform": platform
        }
    except Exception as e:
        error_message = f"Erro durante extração de texto: {str(e)}"
        print(error_message)
        return {"text": error_message, "platform": None}