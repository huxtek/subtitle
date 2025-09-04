# Farsi Video Transcriber - Setup Instructions

This application transcribes Farsi videos and generates editable subtitles using WhisperX.

## Prerequisites

### System Requirements
- Python 3.8+ 
- Node.js 16+
- FFmpeg (for audio extraction)

### Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the backend server:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. Open your browser and go to `http://localhost:5173`
2. Click "Choose File" and select a video file
3. Click "استخراج گفتار (فارسی)" to start transcription
4. Wait for processing (this may take several minutes depending on video length)
5. Edit the generated subtitles as needed

## Notes

- The first run will download WhisperX models (~3GB), so it may take longer
- Processing time depends on video length and your hardware
- GPU acceleration is used if available (CUDA)
- The application supports various video formats (MP4, AVI, MOV, etc.)

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Make sure FFmpeg is installed and in your PATH
2. **CUDA out of memory**: The app will fall back to CPU processing
3. **Model download fails**: Check your internet connection
4. **CORS errors**: Make sure both frontend and backend are running

### Performance Tips

- Use shorter video clips for faster processing
- Ensure you have sufficient disk space for temporary files
- Close other applications to free up memory

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /upload` - Upload and transcribe video

## File Structure

```
transcriber-app/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── uploads/           # Uploaded videos (created automatically)
└── frontend/
    ├── src/
    │   ├── main.tsx       # React entry point
    │   ├── types.ts       # TypeScript types
    │   └── ui/
    │       └── App.tsx    # Main React component
    ├── package.json       # Node.js dependencies
    └── vite.config.ts     # Vite configuration
```
