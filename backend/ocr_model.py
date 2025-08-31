from transformers import AutoProcessor, AutoModelForTokenClassification
from PIL import Image
import torch

processor = AutoProcessor.from_pretrained("topdu/OpenOCR")
model = AutoModelForTokenClassification.from_pretrained("topdu/OpenOCR")
model.eval()

def extract_text_from_image(image: Image.Image) -> str:
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits
    predicted_ids = logits.argmax(-1)
    text = processor.tokenizer.decode(predicted_ids[0])
    return text
