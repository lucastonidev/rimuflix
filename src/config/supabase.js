import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Pega o diretório raiz onde o Node foi iniciado (onde fica o package.json)
const rootDir = process.cwd();

// Lógica de injeção inteligente
if (
  process.env.NODE_ENV !== "production" &&
  fs.existsSync(path.join(rootDir, ".env.local"))
) {
  // Se for ambiente local e existir o .env.local, esmaga as variáveis e usa ele
  dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });
} else {
  // Se for produção (Vercel) ou não achar o arquivo, usa o comportamento padrão
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Cliente padrão (respeita as regras de RLS do painel)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Admin (Ignora as regras de RLS - Use APENAS nos services do backend)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
