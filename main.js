import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

import "./index.js";

// Define __dirname em ambiente ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    icon: path.join(__dirname, "public/img/favicon.ico"),
    autoHideMenuBar: true,
    show: false,
  });

  // 🚫 1. BARRAR TODA E QUALQUER NOVA JANELA (Pop-ups de Anúncios)
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.log(`[AdBlock] Tentativa de abrir nova janela bloqueada: ${url}`);
    return { action: "deny" }; // Cancela a abertura de pop-ups
  });

  // 🚫 2. BARRAR REDIRECIONAMENTOS FORÇADOS DA JANELA PRINCIPAL
  win.webContents.on("will-navigate", (event, url) => {
    // Se o player tentar redirecionar a janela para fora do servidor local, bloqueia
    if (!url.startsWith("http://localhost:3000")) {
      event.preventDefault();
      console.log(`[AdBlock] Redirecionamento externo bloqueado: ${url}`);
    }
  });

  win.once("ready-to-show", () => win.show());

  setTimeout(() => {
    win.loadURL("http://localhost:3000");
  }, 500);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
