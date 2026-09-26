import express from "express";
import { requireAdmin } from "../middlewares/auth/auth.middleware.js";

const admin = express.Router();

// ==========================================
// 1. ROTAS PÚBLICAS (NÃO precisam de login)
// ==========================================

// Se você tiver uma página de login específica do admin:
admin.get("/login", (req, res) => {
  res.render("admin/login");
});

// ==========================================
// 2. BARREIRA DE SEGURANÇA
// ==========================================
// Tudo que estiver abaixo desta linha SÓ PODE SER ACESSADO SE PASSAR NO requireAdmin
admin.use(requireAdmin);

// ==========================================
// 3. ROTAS PROTEGIDAS (Painel Admin)
// ==========================================

admin.get("/", (req, res) => {
  res.render("admin/dashboard");
});

admin.get("/media", (req, res) => {
  res.render("admin/media");
});

admin.get("/providers", (req, res) => {
  res.render("admin/providers");
});

admin.get("/users", (req, res) => {
  res.render("admin/users");
});

admin.get("/sagas", (req, res) => {
  res.render("admin/sagas");
});

admin.get("/settings", (req, res) => {
  res.render("admin/settings");
});

admin.get("/auth/logout", (req, res) => {
  // Limpa o cookie de sessão do admin
  res.clearCookie("admin_session");
  // Redireciona para a página de login do admin
  res.redirect("/");
});

export { admin };
