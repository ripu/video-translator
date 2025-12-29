const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

ipcMain.on('open-path', (event, filePath) => {
    shell.openPath(filePath);
});

ipcMain.on('show-item', (event, filePath) => {
    shell.showItemInFolder(filePath);
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 500,
        minHeight: 500,
        titleBarStyle: 'hidden', // Hide native title bar
        trafficLightPosition: { x: 18, y: 18 }, // Inset buttons
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            sandbox: false, // Allow requiring node modules in preload
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools(); // Open DevTools for debugging
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    if (process.platform === 'darwin') {
        app.dock.setIcon(path.join(__dirname, 'icon.png'));
    }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('process-video', (event, { filePath, targetLang }) => {
    console.log(`Processing ${filePath} to ${targetLang}...`);

    let pythonProcess;

    if (app.isPackaged) {
        // Production: Use standalone executable
        const execName = process.platform === 'win32' ? 'video_processor.exe' : 'video_processor';
        const resourcePath = path.join(process.resourcesPath, execName);

        // Strategy: Copy to userData to avoid permission issues in App Bundle
        const userDataPath = app.getPath('userData');
        const internalExecPath = path.join(userDataPath, execName);

        console.log(`Resource path: ${resourcePath}`);
        console.log(`Internal execution path: ${internalExecPath}`);

        try {
            if (fs.existsSync(resourcePath)) {
                // Always clean up old version and copy new one to ensure updates apply
                if (fs.existsSync(internalExecPath)) {
                    try { fs.unlinkSync(internalExecPath); } catch (e) { console.log("Could not delete old binary:", e); }
                }

                fs.copyFileSync(resourcePath, internalExecPath);

                // Grant permissions to the COPY
                fs.chmodSync(internalExecPath, 0o755);
                console.log("Binary copied and permissions granted.");
            } else {
                throw new Error(`Original binary not found at ${resourcePath}`);
            }

            pythonProcess = spawn(internalExecPath, [
                '--file', filePath,
                '--lang', targetLang
            ]);
        } catch (err) {
            console.error('Failed to prepare or spawn process:', err);
            event.reply('processed-video-error', `Failed to start engine: ${err.message}`);
            return;
        }
    } else {
        // Development: Use python script
        const pythonPath = path.join(__dirname, '../backend/venv/bin/python');
        const scriptPath = path.join(__dirname, '../backend/process_video.py');
        console.log(`Using script: ${scriptPath}`);

        pythonProcess = spawn(pythonPath, [
            scriptPath,
            '--file', filePath,
            '--lang', targetLang
        ]);
    }

    let stderrOutput = '';

    pythonProcess.on('error', (err) => {
        console.error('Child process error:', err);
        event.reply('processed-video-error', `Process error: ${err.message}`);
    });

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
                    console.log(`stdout: ${line}`);
                }
            }
        });
    });

    pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error(`stderr: ${output}`);
        stderrOutput += output;
    });

    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code !== 0) {
            // If we have stderr output, show it, otherwise just the code
            const errorMsg = stderrOutput ? `Process Error:\n${stderrOutput}` : `Process exited with code ${code}`;
            event.reply('processed-video-error', errorMsg);
        }
    });
});
