import express from "express";
import { getFeaturedHero } from "../../controllers/media/hero.controller.js";
import { getGenres } from "../../controllers/media/genres.controller.js";
import { getDetails } from "../../controllers/media/details.controller.js";
import { getSeason } from "../../controllers/media/season.controller.js";
import { getRecommendations } from "../../controllers/media/recommendations.controller.js";

const router = express.Router();

router.get("/featured", getFeaturedHero);
router.get("/genres", getGenres);
router.get("/recomendations/:type/:id", getRecommendations);
router.get("/tv/:id/seasons/:seasonNumber", getSeason);
router.get("/:type/:id", getDetails);

export default router;
