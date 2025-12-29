const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools(); // Open DevTools for debugging
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('process-video', (event, { filePath, targetLang }) => {
    console.log(`Processing ${filePath} to ${targetLang}...`);

    // Path to python venv executable
    const pythonPath = path.join(__dirname, '../backend/venv/bin/python');
    const scriptPath = path.join(__dirname, '../backend/process_video.py');

    const pythonProcess = spawn(pythonPath, [
        scriptPath,
        '--file', filePath,
        '--lang', targetLang
    ]);

    pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const message = JSON.parse(line);
                    if (message.type === 'progress') {
                        event.reply('process-progress', message);
                    } else if (message.type === 'status') {
                        event.reply('process-status', message.message);
                    } else if (message.type === 'success') {
                        event.reply('processed-video-success', message);
                    } else if (message.type === 'error') {
                        event.reply('processed-video-error', message.message);
                    }
                } catch (e) {
                    // Sometimes non-JSON output might appear (e.g. from ffmpeg), just log it
                    console.log(`stdout: ${line}`);
                }
            }
        });
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code !== 0) {
            // event.reply('processed-video-error', `Process exited with code ${code}`);
            // Check if we already handled an error via JSON
        }
    });
});
