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

## 4. Requirements
-   **OS**: macOS (Cross-platform compatible).
-   **Dependencies**: Node.js, Python 3, `moviepy`, `SpeechRecognition`, etc.

## 5. Development Procedures
-   **Updates**: All changes must be tracked via Git.
-   **Testing**: Local testing of both UI and Python script integration.
-   **Documentation**: Keep this SODE file updated with new features.
