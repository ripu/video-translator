import sys
import os
import argparse
from moviepy.video.io.VideoFileClip import VideoFileClip
import speech_recognition as sr
import json

def extract_audio(video_path, audio_path):
    """Extracts audio from video file."""
    try:
        video = VideoFileClip(video_path)
        # Optimize: 16kHz sample rate (standard for speech), Mono channel (smaller file)
        video.audio.write_audiofile(audio_path, codec='pcm_s16le', fps=16000, ffmpeg_params=["-ac", "1"], logger=None)
        return audio_path
    except Exception as e:
        print(json.dumps({"error": f"Error extracting audio: {str(e)}"}))
        return None

import time

import concurrent.futures

def transcribe_chunk(recognizer, audio_data, language):
    """Helper to transcribe a single chunk."""
    try:
        return recognizer.recognize_google(audio_data, language=language)
    except sr.UnknownValueError:
        return ""
    except sr.RequestError as e:
        return f"[Error: {str(e)}]"

def transcribe_audio(audio_path, language="it-IT"):
    """Transcribes audio file to text using parallel chunking."""
    recognizer = sr.Recognizer()
    full_text_parts = {}
    total_duration = 0
    
    # 1. Read all chunks first
    chunks = []
    chunk_duration = 60 # seconds
    
    try:
        with sr.AudioFile(audio_path) as source:
            total_duration = source.DURATION
            while True:
                offset = len(chunks) * chunk_duration
                if offset >= total_duration:
                    break
                
                audio_data = recognizer.record(source, duration=chunk_duration)
                if not audio_data.frame_data:
                    break
                chunks.append((len(chunks), audio_data))
    except Exception as e:
         print(json.dumps({"type": "error", "message": f"Audio Read Error: {str(e)}"}))
         return None

    # 2. Process in parallel
    start_time = time.time()
    completed = 0
    total_chunks = len(chunks)
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        # Submit all tasks
        future_to_index = {
            executor.submit(transcribe_chunk, recognizer, audio_data, language): index 
            for index, audio_data in chunks
        }
        
        for future in concurrent.futures.as_completed(future_to_index):
            index = future_to_index[future]
            try:
                text = future.result()
                full_text_parts[index] = text
            except Exception as e:
                full_text_parts[index] = f"[Error: {str(e)}]"
            
            completed += 1
            
            # Report Progress
            progress = (completed / total_chunks) * 100
            elapsed_time = time.time() - start_time
            if progress > 0:
                estimated_total_time = elapsed_time / (progress / 100)
                remaining_time = estimated_total_time - elapsed_time
            else:
                remaining_time = 0
            
            print(json.dumps({
                "type": "progress", 
                "value": progress, 
                "remaining_seconds": round(remaining_time)
            }), flush=True)

    # 3. Assemble text
    sorted_parts = [full_text_parts[i] for i in range(total_chunks)]
    return " ".join(sorted_parts).strip()

from deep_translator import GoogleTranslator

def translate_text(text, dest_lang='en'):
    """Translates text to destination language."""
    try:
        # Split text if too long (Google Translate has 5000 char limit usually)
        # deep_translator handles some splitting but safe to do basic check if needed.
        # For now, let's rely on deep_translator's handling or simple chunking if it fails.
        translator = GoogleTranslator(source='auto', target=dest_lang)
        translation = translator.translate(text)
        return translation
    except Exception as e:
        print(json.dumps({"type": "error", "message": f"Translation Error: {str(e)}"}))
        return text

def main():
    parser = argparse.ArgumentParser(description="Process video for transcription and translation.")
    parser.add_argument("--file", required=True, help="Path to the video file")
    parser.add_argument("--lang", default="en", help="Target language code (e.g., 'en', 'es', 'fr')")
    parser.add_argument("--source_lang", default="it-IT", help="Source audio language code")

    args = parser.parse_args()

    video_path = args.file
    target_lang = args.lang
    source_lang = args.source_lang

    if not os.path.exists(video_path):
        print(json.dumps({"type": "error", "message": f"File not found: {video_path}"}))
        sys.exit(1)

    base_name = os.path.splitext(video_path)[0]
    audio_path = f"{base_name}_temp.wav"
    output_txt_path = f"{base_name}_translated.txt"

    # 1. Extract Audio
    print(json.dumps({"type": "status", "message": "Extracting Audio..."}), flush=True)
    if not extract_audio(video_path, audio_path):
        sys.exit(1)

    # 2. Transcribe
    print(json.dumps({"type": "status", "message": "Transcribing..."}), flush=True)
    original_text = transcribe_audio(audio_path, language=source_lang)
    if not original_text:
        sys.exit(1)

    # 3. Translate
    print(json.dumps({"type": "status", "message": "Translating..."}), flush=True)
    translated_text = translate_text(original_text, dest_lang=target_lang)

    # 4. Save to File
    try:
        with open(output_txt_path, "w", encoding="utf-8") as f:
            f.write(f"Original ({source_lang}):\n{original_text}\n\n")
            f.write(f"Translation ({target_lang}):\n{translated_text}\n")
    except Exception as e:
        print(json.dumps({"type": "error", "message": f"File Save Error: {str(e)}"}))

    # 5. Output Final JSON
    result = {
        "type": "success",
        "original": original_text,
        "translated": translated_text,
        "target_lang": target_lang,
        "output_file": output_txt_path
    }
    
    print(json.dumps(result), flush=True)

    # Cleanup
    if os.path.exists(audio_path):
        os.remove(audio_path)

if __name__ == "__main__":
    main()
