import express from "express";
import { checkUser, requireAuth } from "../middlewares/auth/auth.middleware.js";
import fs from "fs";
import path from "path";
import { marked } from "marked";
import { helpTopics } from "../data/helpTopics.js";

const router = express.Router();

router.use(checkUser);

router.get("/", (req, res) => {
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

router.get("/livetv", requireAuth, (req, res) => {
  res.render("livetv");
});

router.get("/mylist", requireAuth, (req, res) => {
  res.render("mylist", { user: req.user });
});

router.get("/settings", requireAuth, (req, res) => {
  res.render("settings", { user: req.user });
});

router.get("/login", (req, res) => {
  if (req.user) return res.redirect("/");
  res.render("login");
}); 

// Rota principal da Central de Ajuda
router.get('/help', (req, res) => {
  res.render('help', { topics: helpTopics });
});

// Rota Dinâmica que lê o arquivo .md correspondente
router.get('/help/:slug', (req, res) => {
  const { slug } = req.params;
  
  // Procura o artigo em todos os tópicos
  let currentArticle = null;
  for (const topic of helpTopics) {
    const found = topic.articles.find(a => a.slug === slug);
    if (found) {
      currentArticle = found;
      break;
    }
  }

  // Se não achar o artigo, redireciona para o erro
  if (!currentArticle) {
    return res.status(404).render('error', { 
      message: 'Este tutorial não existe ou foi removido.', 
      suggestionSlug: 'bloquear-propagandas-dns' 
    });
  }

  // Caminho do arquivo .md (dentro de src/content/help/)
  const mdPath = path.join(process.cwd(), 'src', 'content', 'help', `${slug}.md`);
  let htmlContent = '';

  try {
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    // Converte o Markdown + HTML para HTML final
    htmlContent = marked.parse(mdContent);
  } catch (error) {
    htmlContent = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); padding: 20px; border-radius: 12px; color: var(--text-primary);">
        <i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> O conteúdo deste tutorial ainda está sendo escrito. 
        Arquivo não encontrado: <code>${slug}.md</code>
      </div>`;
  }

  res.render('tutorial', { article: currentArticle, content: htmlContent });
});

// Mantenha sua rota de erro
router.get('/error', (req, res) => {
  res.render('error', { 
    message: 'Ops! Parece que você se perdeu no catálogo.',
    suggestionSlug: 'bloquear-propagandas-dns'
  });
});

export { router as website };
