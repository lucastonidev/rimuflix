import express from "express";
import { HomeSections } from "../../controllers/home/sections.controller.js";
import { searchMedia } from "../../controllers/media/search.controller.js";
import { getDoramas } from "../../controllers/media/doramas.controller.js";
import { getNovelas } from "../../controllers/media/novelas.controller.js";
import { getPublicSagas } from "../../controllers/media/sagas.controller.js";
import {
  getTorrentForMedia,
  testTorrentSources,
} from "../../controllers/player/torrent.controller.js";

const router = express.Router();

router.get("/home/sections", HomeSections);
router.get("/search", searchMedia);
router.get("/doramas", getDoramas);
router.get("/novelas/:type", getNovelas);
router.get("/sagas", getPublicSagas);
router.get("/torrent/test", testTorrentSources);
router.get("/torrent/:type/:id", getTorrentForMedia);

export default router;
