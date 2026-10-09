import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();

if (
  process.env.NODE_ENV !== "production" &&
  fs.existsSync(path.join(rootDir, ".env.local"))
) {
  dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Cliente padrão (respeita as regras de RLS do painel)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Cliente Admin (Ignora as regras de RLS - Use APENAS nos services do backend)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
