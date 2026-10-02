import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url"; // 👈 Import required for __dirname in ES Modules
import { website } from "./src/router/website.js";
import { api } from "./src/router/api.js";
import { admin } from "./src/router/admin.js";
import cookieParser from "cookie-parser";

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.set("view engine", "ejs");
// 👇 Usa __dirname para resolver corretamente dentro do app.asar do Electron
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 👇 Atualiza a pasta public também
app.use(express.static(path.join(__dirname, "public")));

app.use("/", website);
app.use("/api/v1", api);
app.use("/admin", admin);

if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Está rodando Rimuflix Localmente");
    console.log("------------------------------");
    console.log("http://localhost:3000/");
  });
}

export default app;