# Video Translator 🎥 ➡️ 🇮🇹

A modern, cross-platform desktop application to translate video audio into different languages. Built with Electron (Frontend) and Python (Backend).

![App Screenshot](https://via.placeholder.com/800x600?text=Video+Translator+App)

## Features
- **Drag & Drop Interface**: Simple and intuitive design.
- **Auto-Translation**: Powered by **Google Speech Recognition** and **Google Translate**.
- **Cross-Platform**: Works on macOS and Windows.
- **No Python Required**: Runs as a standalone application.
- **Frameless UI**: Modern, premium aesthetic.

## Tech Stack
- **Frontend**: Electron, HTML5, CSS3 (Custom Design)
- **Backend**: Python 3, MoviePy, SpeechRecognition, DeepTranslator
- **Packaging**: PyInstaller + Electron Builder
- **CI/CD**: GitHub Actions

## Development Setup

### Prerequisites
- Node.js (v18+)
- Python 3.9+

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd electron-app
npm install
```

### 3. Run in Development Mode
```bash
# Terminal 1 (keep open)
# No separate backend server needed (Electron spawns it)

# Terminal 2
cd electron-app
npm start
```

## Build Instructions

### Build for macOS
```bash
# 1. Build Python Backend
source backend/venv/bin/activate
pyinstaller --onefile --name video_processor --clean --collect-all imageio backend/process_video.py

# 2. Build Electron App
cd electron-app
npm run build
```
The `.dmg` file will be in `electron-app/dist/mac-arm64/` (or `x64`).

### Build for Windows
Building for Windows is handled automatically via GitHub Actions when you tag a release (e.g., `v1.0.0`).
1. Push code to GitHub.
2. Create a Release with a tag `v*`.
3. Download the `.exe` from the Release assets.

## License
MIT
