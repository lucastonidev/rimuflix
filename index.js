import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { website } from "./src/router/website.js";
import { api } from "./src/router/api.js";
import { admin } from "./src/router/admin.js";
import cookieParser from "cookie-parser";

// Define __dirname em ambiente ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Configuração do EJS com caminho absoluto
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configuração dos arquivos estáticos com caminho absoluto
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());

app.use("/", website);
app.use("/api/v1", api);
app.use("/admin", admin);

// Se estiver rodando localmente (ambiente de desenvolvimento), escuta a porta 3000
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log("Está rodando Rimuflix Localmente");
    console.log("------------------------------");
    console.log("http://localhost:3000/");
  });
}

// Exporta o app para que a Vercel o execute como uma Serverless Function
export default app;