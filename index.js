import express from "express";
import dotenv from "dotenv";
import path from "path";
import { website } from "./src/router/website.js";
import { api } from "./src/router/api.js";
import { admin } from "./src/router/admin.js";
import cookieParser from "cookie-parser";

// Pode chamar o dotenv puro, ele acha na raiz automaticamente
dotenv.config();

const app = express();

// 👇 A MUDANÇA PRINCIPAL: Usando process.cwd() para a Vercel achar as pastas
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.use(express.static(path.join(process.cwd(), "public")));

app.use(express.json());
app.use(cookieParser());

app.use("/", website);
app.use("/api/v1", api);
app.use("/admin", admin);

// Mantemos a trava de execução local vs produção
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Está rodando Rimuflix Localmente");
    console.log("------------------------------");
    console.log("http://localhost:3000/");
  });
}

// Exporta para a Vercel ler
export default app;
