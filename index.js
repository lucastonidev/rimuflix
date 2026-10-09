import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { website } from "./src/router/website.js";
import { api } from "./src/router/api.js";
import { admin } from "./src/router/admin.js";
import cookieParser from "cookie-parser";
import { log } from "console";

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.SUPABASE_URL === undefined || process.env.SUPABASE_KEY === undefined) {
  if (fs.existsSync(path.join(__dirname, ".env.local"))) {
    dotenv.config({ path: ".env.local", override: true });
    console.log("🛠️  Rodando com variáveis de ambiente locais (.env.local)");
  } else {
    dotenv.config();
    console.log("⚠️  Rodando com variáveis de ambiente do sistema (ou .env)");
  }
} else {
  console.log("🚀 Variáveis de ambiente já injetadas pelo Servidor/Vercel!");
}

console.log("👉 SUPABASE ATUAL:", process.env.SUPABASE_URL);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
