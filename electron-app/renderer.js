const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
// const originalTextArea = document.getElementById('original-text'); // API removed
// const translatedTextArea = document.getElementById('translated-text'); // API removed
const targetLangSelect = document.getElementById('target-lang');

// Drag and Drop Events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0].path);
    }
});

// Click to Upload
dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0].path);
    }
});

const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const timeRemainingParams = document.getElementById('time-remaining');

function handleFile(filePath) {
    statusDiv.textContent = `Starting process for ${filePath}...`;
    resultDiv.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    progressBarFill.style.width = '0%';
    timeRemainingParams.textContent = 'Estimated time remaining: Calculating...';

    // originalTextArea.value = '';
    // translatedTextArea.value = '';

    const targetLang = targetLangSelect.value;
    window.electron.send('process-video', { filePath, targetLang });
    fileInput.value = ''; // Allow re-selecting the same file
}

// IPC Listeners
window.electron.on('process-status', (message) => {
    statusDiv.textContent = message;
});

window.electron.on('process-progress', (data) => {
    progressBarFill.style.width = `${data.value}%`;
    const minutes = Math.floor(data.remaining_seconds / 60);
    const seconds = data.remaining_seconds % 60;
    timeRemainingParams.textContent = `Estimated time remaining: ${minutes}m ${seconds}s`;
});

// const confetti = require('canvas-confetti'); // Removed: cannot use require in renderer

// ... existing code ...

const btnOpenFile = document.getElementById('btn-open-file');
const btnOpenFolder = document.getElementById('btn-open-folder');

let currentOutputFile = '';

window.electron.on('processed-video-success', (result) => {
    statusDiv.textContent = `Completed!`;
    currentOutputFile = result.output_file;

    progressContainer.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    // originalTextArea.value = result.original;
    // translatedTextArea.value = result.translated;

    // 1. Celebration
    window.electron.confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });

    // 2. Notification
    new Notification('Video Translator', {
        body: 'Translation processing finished successfully!',
        icon: 'icon.png' // Ensure icon is available in build
    });
});

btnOpenFile.addEventListener('click', () => {
    if (currentOutputFile) window.electron.openPath(currentOutputFile);
});

btnOpenFolder.addEventListener('click', () => {
    if (currentOutputFile) window.electron.showItem(currentOutputFile);
});

const btnRestart = document.getElementById('btn-restart');
btnRestart.addEventListener('click', () => {
    resultDiv.classList.add('hidden');
    statusDiv.textContent = '';
    progressContainer.classList.add('hidden');
});

window.electron.on('processed-video-error', (errorMessage) => {
    statusDiv.textContent = `Error: ${errorMessage}`;
    progressContainer.classList.add('hidden');
    console.error(errorMessage);
});
