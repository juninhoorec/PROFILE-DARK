import os
import sys
import time
import uuid
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="Profile Dark AI Worker",
    version="2.0.0",
    description="Microservice para execução isolada de modelos de imagem, voz, vídeo e upscale.",
)

# --- Schemas ---
class ImageRequest(BaseModel):
    prompt: string = ""
    negative_prompt: Optional[str] = None
    width: int = 768
    height: int = 1360
    seed: int = 42
    steps: int = 20
    model: str = "flux-2-klein-4b"

class VoiceRequest(BaseModel):
    text: str
    voice_name: str = "pt-BR-FranciscaNeural"
    speed: float = 1.0
    language: str = "pt-BR"

class VideoRequest(BaseModel):
    prompt: str
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: int = 5
    fps: int = 25
    resolution: str = "720p"

class UpscaleRequest(BaseModel):
    image_url: str
    scale: int = 2
    target_resolution: str = "1080p"

# --- Endpoints ---
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "pd-ai-worker",
        "python_version": sys.version,
        "cuda_available": False,
        "supported_models": [
            "flux-2-klein-4b",
            "qwen-image",
            "chatterbox-multilingual",
            "cosyvoice-3",
            "wan-2.2-i2v",
            "latentsync",
            "real-esrgan"
        ]
    }

@app.post("/image/generate")
def generate_image(req: ImageRequest):
    return {
        "status": "completed",
        "prompt": req.prompt,
        "model": req.model,
        "width": req.width,
        "height": req.height,
        "seed": req.seed,
        "output_url": "/api/uploads/sample-generated.png"
    }

@app.post("/voice/generate")
def generate_voice(req: VoiceRequest):
    return {
        "status": "completed",
        "text": req.text,
        "voice": req.voice_name,
        "duration_seconds": 5.0,
        "output_url": "/api/uploads/sample-voice.wav"
    }

@app.post("/video/generate")
def generate_video(req: VideoRequest):
    task_id = f"worker_task_{uuid.uuid4()}"
    return {
        "task_id": task_id,
        "status": "processing",
        "estimated_seconds": 15
    }

@app.get("/video/status/{task_id}")
def video_status(task_id: str):
    return {
        "task_id": task_id,
        "status": "completed",
        "video_url": "/api/uploads/sample-video.mp4"
    }

@app.post("/upscale")
def upscale_media(req: UpscaleRequest):
    return {
        "status": "completed",
        "output_url": req.image_url,
        "target_resolution": req.target_resolution
    }

@app.post("/cancel/{task_id}")
def cancel_task(task_id: str):
    return {"task_id": task_id, "status": "canceled"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
