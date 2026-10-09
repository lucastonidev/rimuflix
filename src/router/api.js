import express from "express";
import adminRoutes from "./api/admin.routes.js";
import mediaRoutes from "./api/media.routes.js";
import playerRoutes from "./api/player.routes.js";
import livetvRoutes from "./api/livetv.routes.js";
import exploreRoutes from "./api/explore.routes.js";
import reviewRoutes from "./api/review.routes.js";
import authRoutes from "./api/auth.routes.js";
import userRouter from "./api/user.routes.js";

const router = express.Router();

// Roteamento Modular por Domínio
router.use("/admin", adminRoutes);
router.use("/media", mediaRoutes);
router.use("/player", playerRoutes);
router.use("/livetv", livetvRoutes);

router.use("/reviews", reviewRoutes);

router.use("/auth", authRoutes);

router.use("/user", userRouter);

// O exploreRoutes agrupa as rotas raiz do catálogo (ex: /search, /doramas, /home/sections)
router.use("/", exploreRoutes);

export { router as api };
