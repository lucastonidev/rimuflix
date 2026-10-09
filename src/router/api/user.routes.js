import express from "express";
import multer from "multer"; // Necessário para o upload do avatar no settings.js
import UsersController from "../../controllers/user/user.controller.js";
import { checkUser } from "../../middlewares/auth/auth.middleware.js";

const userRouter = express.Router();
userRouter.use(checkUser);

// Configuração básica do multer (Apenas memória)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 2 * 1024 * 1024}
});

// ==========================================
// ROTAS DE LISTAS (Substitui as antigas rotas de watchlist)
// ==========================================
userRouter.get("/lists", (req, res) => UsersController.getLists(req, res));
userRouter.post("/lists", (req, res) => UsersController.createList(req, res));
userRouter.delete("/lists/:listId", (req, res) =>
  UsersController.deleteList(req, res),
);
userRouter.post("/lists/:listId/toggle", (req, res) =>
  UsersController.toggleListItem(req, res),
);

userRouter.patch("/lists/:listId/visibility", (req, res) =>
  UsersController.updateListVisibility(req, res),
);

userRouter.get("/lists/:id", UsersController.getListDetails);

// ==========================================
// ROTAS DE PROGRESSO (Continue Watching)
// ==========================================
userRouter.get("/progress", (req, res) =>
  UsersController.getProgress(req, res),
);
userRouter.post("/progress/save", (req, res) =>
  UsersController.saveProgress(req, res),
);
userRouter.delete("/progress/remove/:mediaType/:tmdbId", (req, res) =>
  UsersController.removeProgress(req, res),
);

// ==========================================
// ROTAS DE PERFIL
// ==========================================
userRouter.patch("/profile", upload.single("avatar"), (req, res) =>
  UsersController.updateProfile(req, res),
);

// ==========================================
// ROTAS DE AVALIAÇÕES (Reviews)
// ==========================================
userRouter.get("/reviews/:mediaType/:tmdbId", (req, res) => UsersController.getReviews(req, res));
userRouter.post("/reviews/internal", (req, res) => UsersController.addInternalReview(req, res));

export default userRouter;
