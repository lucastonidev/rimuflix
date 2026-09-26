import express from "express";
import { getLiveTvChannels } from "../../controllers/tv/livetv.controller.js";
import { getCategories } from "../../controllers/tv/categories.controller.js";
import { getEpgSchedule }  from "../../controllers/tv/epg.controller.js";

const router = express.Router();

router.get("/", getLiveTvChannels);
router.get("/categories", getCategories);
router.get("/epg", getEpgSchedule);

export default router;
