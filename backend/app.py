from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import subprocess
import os
import torch
import tempfile
import json
from typing import List, Dict, Any
from faster_whisper import WhisperModel

# Load shared configuration
with open('../shared-config.json', 'r') as f:
    config = json.load(f)
    SUBTITLE_STYLES = config['subtitleStyles']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

def format_srt_time(seconds: float) -> str:
    """Convert seconds to SRT time format (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def generate_srt_file(subtitles: List[Dict[str, Any]], video_path: str) -> str:
    """Generate SRT subtitle file from subtitles"""
    srt_path = video_path.rsplit('.', 1)[0] + '.srt'
    
    with open(srt_path, 'w', encoding='utf-8') as f:
        for i, subtitle in enumerate(subtitles, 1):
            start_time = format_srt_time(subtitle['start'])
            end_time = format_srt_time(subtitle['end'])
            text = subtitle['text'].strip()
            
            f.write(f"{i}\n")
            f.write(f"{start_time} --> {end_time}\n")
            f.write(f"{text}\n\n")
    
    return srt_path

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
        
        # Generate SRT subtitle file
        srt_path = generate_srt_file(subtitles, file_path)
        
        # Clean up audio file
        os.remove(audio_path)
        
        return {
            "message": "Video processed successfully", 
            "file": file.filename,
            "video_path": file_path,
            "srt_path": srt_path,
            "subtitles": subtitles
        }
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "device": device}

@app.get("/download/srt/{filename}")
async def download_srt(filename: str):
    """Download SRT subtitle file"""
    srt_path = f"uploads/{filename.rsplit('.', 1)[0]}.srt"
    if not os.path.exists(srt_path):
        raise HTTPException(status_code=404, detail="SRT file not found")
    return FileResponse(srt_path, media_type='text/plain', filename=filename.rsplit('.', 1)[0] + '.srt')

@app.get("/download/video/{filename}")
async def download_video_with_subtitles(filename: str):
    """Download video with embedded subtitles"""
    video_path = f"uploads/{filename}"
    srt_path = f"uploads/{filename.rsplit('.', 1)[0]}.srt"
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    if not os.path.exists(srt_path):
        raise HTTPException(status_code=404, detail="SRT file not found")
    
    # Create video with embedded subtitles
    output_path = f"uploads/{filename.rsplit('.', 1)[0]}_with_subtitles.mp4"
    
    # Convert rgba to ffmpeg format
    bg_opacity = int(0.8 * 255)  # Extract 0.8 from rgba(0, 0, 0, 0.8)
    bg_hex = f"&H{bg_opacity:02x}000000"
    
    # Use ffmpeg to burn subtitles with shared styling
    subtitle_filter = f"subtitles={srt_path}:force_style='FontName={SUBTITLE_STYLES['fontFamily']},FontSize={SUBTITLE_STYLES['fontSize']},Bold=1,PrimaryColour=&Hffffff,BackColour={bg_hex},BorderStyle=3,Outline=0,Shadow=0,Alignment=2,MarginV={SUBTITLE_STYLES['bottomMargin']}'"
    cmd = [
        'ffmpeg', '-i', video_path, '-vf', subtitle_filter,
        '-c:a', 'copy',  # Copy audio without re-encoding
        '-y', output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Error creating video with subtitles: {result.stderr}")
    
    return FileResponse(output_path, media_type='video/mp4', filename=filename.rsplit('.', 1)[0] + '_with_subtitles.mp4')

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Farsi Video Transcriber API"}
