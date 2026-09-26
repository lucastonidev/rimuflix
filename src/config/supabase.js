import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configuração para garantir que o .env seja lido corretamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
// 🚨 MUDANÇA AQUI: Usando a Service Role Key para ter permissões de Admin
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Exporta o cliente para ser usado nos controllers
export const supabase = createClient(supabaseUrl, supabaseKey);
