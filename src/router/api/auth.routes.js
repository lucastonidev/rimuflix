import { Router } from "express";
import jwt from "jsonwebtoken";
import * as AuthController from "../../controllers/auth/auth.controller.js";
import { checkUser } from "../../middlewares/auth/auth.middleware.js";

const router = Router();

router.post("/login", AuthController.login);

router.get("/me", checkUser, AuthController.me);

router.post("/logout", AuthController.logout);

export default router;
