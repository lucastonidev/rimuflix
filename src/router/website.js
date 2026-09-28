import express from "express";
// Importamos o middleware que vamos criar/ajustar no próximo passo
import { checkUser, requireAuth } from "../middlewares/auth/auth.middleware.js";

const router = express.Router();

// Aplica a verificação de usuário em TODAS as rotas desse arquivo
router.use(checkUser);

router.get("/", (req, res) => {
  // Agora o isAdmin é dinâmico, baseado no token real do usuário
  const isAdmin = req.user && req.user.role === "admin";
  res.render("app", { user: req.user, isAdmin });
});

router.get("/movie/:id", (req, res) => {
  res.render("detail", { id: req.params.id, type: "movie", user: req.user });
});

router.get("/tv/:id", (req, res) => {
  res.render("detail", { id: req.params.id, type: "tv", user: req.user });
});

// Rotas protegidas pelo middleware
router.get("/movie/watch/:id", requireAuth, (req, res) => {
  res.render("watch", {
    id: req.params.id,
    type: "movie",
  });
});

router.get("/tv/watch/:id", requireAuth, (req, res) => {
  res.render("watch", {
    id: req.params.id,
    type: "tv",
  });
});

router.get("/search", (req, res) => {
  res.render("search", {
    category: req.query.category || "all",
    type: req.query.type || "genres",
    user: req.user,
  });
});

router.get("/livetv", (req, res) => {
  // Puxa o cookie que usamos para identificar quem está logado
  const userId = req.cookies["rimuflix:userId"];

  // Se não tem cookie, expulsa para o login avisando que precisa de conta
  if (!userId) {
    return res.redirect("/login?error=auth_required&continue=/livetv");
  }

  // Se tem cookie, renderiza o EJS da TV normalmente
  res.render("livetv");
});

// Para rotas em que o usuário PRECISA estar logado, usamos o requireAuth
router.get("/mylist", requireAuth, (req, res) => {
  res.render("mylist", { user: req.user });
});

router.get("/settings", requireAuth, (req, res) => {
  res.render("settings", { user: req.user });
});

router.get("/login", (req, res) => {
  // Se já estiver logado, não precisa acessar a tela de login
  if (req.user) return res.redirect("/");
  res.render("login");
});

export { router as website };
