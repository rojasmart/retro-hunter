import os
from google.cloud import documentai_v1
from PIL import Image
import io

# Initialize Document AI client
processor_client = None

def initialize_ocr():
    """Initialize Vertex AI Document AI OCR"""
    global processor_client
    if processor_client is None:
        try:
            processor_client = documentai_v1.DocumentProcessorServiceClient()
            print("✅ Vertex AI Document AI initialized successfully!")
        except Exception as e:
            print(f"❌ Error initializing Vertex AI: {e}")
            raise
    return processor_client

def extract_text_from_image(image: Image.Image) -> dict:
    """Extract text using Vertex AI Document AI"""
    try:
        # Initialize client if not done
        if processor_client is None:
            initialize_ocr()
        
        # Get configuration from environment
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us")
        processor_id = os.getenv("VERTEX_AI_PROCESSOR_ID")
        
        if not all([project_id, processor_id]):
            raise ValueError("Missing required environment variables: GOOGLE_CLOUD_PROJECT_ID or VERTEX_AI_PROCESSOR_ID")
        
        # Build processor name
        processor_name = f"projects/{project_id}/locations/{location}/processors/{processor_id}"
        
        # Convert PIL image to bytes
        img_bytes = io.BytesIO()
        image.save(img_bytes, format='PNG')
        img_bytes = img_bytes.getvalue()
        
        # Create raw document
        raw_document = documentai_v1.RawDocument(
            content=img_bytes,
            mime_type="image/png"
        )
        
        # Process request
        request = documentai_v1.ProcessRequest(
            name=processor_name,
            raw_document=raw_document
        )
        
        # Call Vertex AI
        result = processor_client.process_document(request=request)
        document = result.document
        
        # Calculate confidence
        confidence = calculate_confidence(document)
        
        # Clean and process text
        extracted_text = document.text.strip()
        
        return {
            "text": extracted_text,
            "confidence": confidence,
            "raw": extracted_text
        }
        
    except Exception as e:
        print(f"❌ Vertex AI OCR error: {e}")
        return {
            "text": "",
            "confidence": 0,
            "raw": ""
        }

def calculate_confidence(document):
    """Calculate average confidence from Vertex AI response"""
    if not document.pages:
        return 0.0
    
    total_confidence = 0.0
    token_count = 0
    
    for page in document.pages:
        if hasattr(page, 'tokens'):
            for token in page.tokens:
                if hasattr(token, 'detection_confidence') and token.detection_confidence:
                    total_confidence += token.detection_confidence
                    token_count += 1
    
    return round((total_confidence / token_count) * 100, 2) if token_count > 0 else 0.0

# Initialize on module load
try:
    initialize_ocr()
except Exception as e:
    print(f"⚠️  Warning: Could not initialize Vertex AI on module load: {e}")