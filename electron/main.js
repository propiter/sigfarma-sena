const { app, BrowserWindow, Menu, Tray, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';
const port = 3000;

let mainWindow;
let serverProcess;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../public/logos/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Cargar la aplicación
  const startUrl = isDev 
    ? `http://localhost:${port}` 
    : `http://localhost:${port}`;

  mainWindow.loadURL(startUrl);
  
  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Manejar cierre de ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crear menú
  const menu = Menu.buildFromTemplate([
    {
      label: 'SIGFARMA-SENA',
      submenu: [
        { role: 'about', label: 'Acerca de' },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'toggledevtools', label: 'Herramientas de desarrollo' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        { 
          label: 'Documentación', 
          click: async () => {
            await shell.openExternal('https://github.com/tu-usuario/sigfarma-sena');
          }
        }
      ]
    }
  ]);
  
  Menu.setApplicationMenu(menu);
}

function startServer() {
  // Iniciar el servidor Node.js
  const serverPath = isDev 
    ? path.join(__dirname, '../src/server/server.ts')
    : path.join(__dirname, '../dist/server/server.js');
  
  const command = isDev ? 'tsx' : 'node';
  
  serverProcess = spawn(command, [serverPath], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: port.toString() }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../public/logos/icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir SIGFARMA-SENA', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Salir', click: () => app.quit() }
  ]);
  tray.setToolTip('SIGFARMA-SENA');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

app.whenReady().then(() => {
  startServer();
  
  // Esperar a que el servidor esté listo antes de abrir la ventana
  setTimeout(() => {
    createWindow();
    createTray();
  }, 2000);
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    // Matar el proceso del servidor al salir
    serverProcess.kill();
  }
});