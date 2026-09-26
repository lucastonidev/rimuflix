import { Router } from "express";
import jwt from "jsonwebtoken";
import * as AuthController from "../../controllers/auth/auth.controller.js";
import { checkUser } from "../../middlewares/auth/auth.middleware.js";

const router = Router();

router.post("/login", AuthController.login);

router.get("/me", checkUser, (req, res) => {
  if (req.user) {
    return res.json({ success: true, data: req.user });
  } else {
    // A sessão morreu ou o cookie não existe (Opcional: enviar status 401)
    return res
      .status(401)
      .json({ success: false, error: "Sessão expirada ou inválida." });
  }
});

router.post("/logout", AuthController.logout);

export default router;
