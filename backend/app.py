from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import subprocess
import os
import torch
import tempfile
import json
from typing import List, Dict, Any
from faster_whisper import WhisperModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model caching
device = "cuda" if torch.cuda.is_available() else "cpu"
model = None

def load_model():
    """Load Whisper model for transcription"""
    global model
    
    if model is None:
        print("Loading Whisper model...")
        # Use float32 for better compatibility with M1/M2 Macs
        compute_type = "float32" if device == "cpu" else "float16"
        model = WhisperModel("large-v2", device=device, compute_type=compute_type)
    
    return model

def extract_audio(video_path: str) -> str:
    """Extract audio from video file"""
    audio_path = video_path.rsplit('.', 1)[0] + '.wav'
    
    # Use ffmpeg to extract audio
    cmd = [
        'ffmpeg', '-i', video_path, 
        '-acodec', 'pcm_s16le', 
        '-ar', '16000', 
        '-ac', '1', 
        '-y', audio_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"FFmpeg error: {result.stderr}")
    
    return audio_path

@app.post("/upload")
async def upload_video(file: UploadFile):
    """Upload video and generate subtitles"""
    try:
        # Validate file type
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Create uploads directory
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file.filename}"
        
        # Save uploaded file
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Extract audio
        print(f"Extracting audio from {file.filename}...")
        audio_path = extract_audio(file_path)
        
        # Load model
        model = load_model()
        
        # Transcribe audio
        print("Transcribing audio...")
        segments, info = model.transcribe(audio_path, language="fa", beam_size=5)
        
        # Convert to subtitle format
        subtitles = []
        for i, segment in enumerate(segments):
            subtitles.append({
                "id": i + 1,
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip()
            })
        
        # Clean up audio file
        os.remove(audio_path)
        
        return {
            "message": "Video processed successfully", 
            "file": file.filename,
            "subtitles": subtitles
        }
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "device": device}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Farsi Video Transcriber API"}
