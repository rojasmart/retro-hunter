from google.cloud import documentai_v1 as documentai
import os  # Adicionado para corrigir o erro
import io
from PIL import Image

def extract_text_from_image(image: Image.Image) -> dict:
    """Extrai texto de uma imagem usando o Google Cloud Document AI."""
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    processor_id = os.getenv("VERTEX_AI_PROCESSOR_ID")  # Adicione isso ao .env.local

    if not all([project_id, location, processor_id]):
        raise ValueError("As variáveis de ambiente do Google Cloud estão incompletas.")

    # Configurar o cliente do Document AI
    client = documentai.DocumentProcessorServiceClient()

    # Nome do processador
    name = f"projects/{project_id}/locations/{location}/processors/{processor_id}"

    # Converter a imagem para bytes
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()

    # Criar o documento bruto
    raw_document = documentai.RawDocument(content=img_bytes, mime_type="image/png")

    # Enviar a solicitação para o Document AI
    request = documentai.ProcessRequest(name=name, raw_document=raw_document)
    result = client.process_document(request=request)

    # Extrair o texto do resultado
    document = result.document
    extracted_text = document.text

    return {
        "text": extracted_text,
        "confidence": calculate_confidence(document)
    }

def calculate_confidence(document):
    """Calcula a confiança média do texto extraído."""
    if not document.pages:
        return 0.0

    total_confidence = 0.0
    token_count = 0

    for page in document.pages:
        for token in page.tokens:
            if token.detection_confidence:
                total_confidence += token.detection_confidence
                token_count += 1

    return round((total_confidence / token_count) * 100, 2) if token_count > 0 else 0.0