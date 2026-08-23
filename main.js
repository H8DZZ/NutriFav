const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { initializeDatabase, getQuery, dbPath } = require('./src/js/database');
const { validateUser, createUser } = require('./src/js/auth');

let loginWindow = null;
let mainWindow = null;
let userData = null;

function createLoginWindow() {
    if (loginWindow) {
        loginWindow.close();
        loginWindow = null;
    }
    loginWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });
    loginWindow.loadFile('0.html');
    loginWindow.once('ready-to-show', () => {
        loginWindow.show();
    });
    loginWindow.on('closed', () => {
        loginWindow = null;
    });
}

function createMainWindow(user) {
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
    userData = user;
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });
    mainWindow.loadFile('index.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.executeJavaScript(`
                window.userData = ${JSON.stringify(user)};
                const userNameEl = document.getElementById('userName');
                if (userNameEl) userNameEl.textContent = '${user.nombre_admin || 'Administrador'}';
                const avatarEl = document.getElementById('userAvatar');
                if (avatarEl) {
                    const initials = '${(user.nombre_admin || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}';
                    avatarEl.textContent = initials;
                }
            `);
        });
        mainWindow.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        userData = null;
    });
}

ipcMain.handle('login', async (event, { email, password }) => {
    try {
        const user = await validateUser(email, password);
        if (user) {
            if (loginWindow) {
                loginWindow.close();
                loginWindow = null;
            }
            createMainWindow(user);
            return { success: true, user };
        } else {
            return { success: false, error: 'Credenciales incorrectas' };
        }
    } catch (error) {
        console.error('Error en login:', error.message);
        return { success: false, error: 'Error interno: ' + error.message };
    }
});

ipcMain.handle('logout', () => {
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
    createLoginWindow();
});

ipcMain.handle('get-user', () => {
    return userData;
});

app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);

    console.log('Base de datos en:', dbPath);
    try {
        await initializeDatabase();
        const admin = await getQuery('SELECT * FROM administradores WHERE nombre_admin = ?', ['admin']);
        if (!admin) {
            console.log('Creando usuario admin...');
            await createUser('admin', 'admin@nutrifav.com', 'admin123', 'admin');
            console.log('Usuario admin creado: usuario: admin / contraseña: admin123');
        } else {
            console.log('Usuario admin ya existe');
        }
    } catch (err) {
        console.error('Error crítico al iniciar la aplicación:', err.message);
    }
    createLoginWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});