import express from "express";
import { GetMoviePlayerLinks } from "../../controllers/player/movie.controller.js";
import { GetTvPlayerLinks } from "../../controllers/player/tv.controller.js";

const router = express.Router();

router.get("/movie/:id", GetMoviePlayerLinks);
router.get("/tv/:id/:season/:episode", GetTvPlayerLinks);

export default router;
