# SODE: VideoTranslator App

## 1. Project Overview
**VideoTranslator** is a desktop application that allows users to drag and drop video files (e.g., MP4) to automatically extract audio, transcribe it to text, and translate it into a target language.

## 2. Architecture
The application follows a hybrid **Electron + Python** architecture:
- **Frontend (Electron)**: Handles the user interface, specifically the drag-and-drop zone and settings (e.g., target language selection).
- **Backend (Python)**: Handles the heavy lifting — video processing, audio extraction, speech recognition, and translation.

### Tech Stack
- **UI**: Electron, HTML5, CSS3, JavaScript (IPC).
- **Video Processing**: `moviepy` (Python) or `ffmpeg`.
- **Speech-to-Text**: `SpeechRecognition` library (Google Web Speech API) or `OpenAI Whisper` (for offline/higher quality).
- **Translation**: `googletrans` (unofficial) or OpenAI API / DeepL API.

## 3. Workflow
1.  **User Action**: User drags a video file into the Electron window.
2.  **IPC Trigger**: Electron sends the file path to the Python script via `child_process`.
3.  **Python Logic**:
    -   Extract audio from video.
    -   Transcribe audio to text (Source Language).
    -   Translate text to Target Language.
    -   Save result to a `.txt` file (or return to UI).
4.  **Feedback**: UI updates with "Processing..." -> "Done". Result displayed or file opened.

## 4. Deployment & Packaging
- **Tool**: Electron Builder + PyInstaller
- **MacOS**:
  - Target: `.dmg`
  - Architecture: `arm64` (Apple Silicon) / `x64` (Intel)
  - Strategy:
    1.  **Backend Build**: `process_video.py` is compiled to a standalone binary `video_processor` using `PyInstaller`.
    2.  **Inclusion**: The binary is included in the Electron app via `extraResources`.
    3.  **Permissions Fix**: On macOS, the binary is copied to `app.getPath('userData')` at runtime and given `chmod 755` permissions to bypass App Bundle read-only/permission restrictions.
- **Windows**:
  - Target: `.exe` (NSIS Installer)
  - Method: Cross-compiled via GitHub Actions.
  - Runtime: Checks for `video_processor.exe`.

## 5. Security & Isolation
- **IPC**: Uses `contextBridge` in `preload.js` to expose only safe API calls (`send`, `on`, `openPath`).
- **Sandbox**: Default Electron sandbox enabled (where compatible).
- **Node Integration**: Disabled in Renderer.

## 6. Directory Structure
```
root/
├── backend/
│   ├── process_video.py  # Core Logic
│   ├── venv/             # Python Environment
│   └── requirements.txt  # Dependencies
├── electron-app/
│   ├── main.js           # Main Process
│   ├── preload.js        # IPC Bridge
│   ├── renderer.js       # UI Logic
│   ├── index.html        # UI Structure
│   └── package.json      # Config & Build Settings
├── dist/                 # Build Artifacts
└── SODE.md               # This Document
```

## 7. Requirements
-   **OS**: macOS (Cross-platform compatible).
-   **Dependencies**: Node.js, Python 3, `moviepy`, `SpeechRecognition`, etc.

## 8. Development Procedures
-   **Updates**: All changes must be tracked via Git.
-   **Testing**: Local testing of both UI and Python script integration.
-   **Documentation**: Keep this SODE file updated with new features.
