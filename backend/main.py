import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import aiplatform
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Vertex AI
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
ENDPOINT_ID = "86940330970f30e1"  # Replace with your Vertex AI endpoint ID
aiplatform.init(project=PROJECT_ID, location=LOCATION)

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    # Read the uploaded file
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    # Convert the image to bytes
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()

    # Send the image to the Vertex AI model
    endpoint = aiplatform.Endpoint(endpoint_name=ENDPOINT_ID)
    response = endpoint.predict(instances=[{"content": img_bytes}])

    # Process the response
    predictions = response.predictions
    return {"predictions": predictions}