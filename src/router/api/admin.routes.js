import express from "express";
import { getDashboardStats } from "../../controllers/admin/dashboard.controller.js";
import {
  getMediaController as getMedia,
  addMediaController as addMedia,
  updateMediaController as updateMedia,
  deleteMediaController as deleteMedia,
} from "../../controllers/admin/media.controller.js";
import {
  getProvidersController as getProviders,
  saveProvidersController as saveProviders,
} from "../../controllers/admin/providers.controller.js";
import {
  getUsers,
  toggleUserStatus,
  createUser,
  updateUser,
} from "../../controllers/admin/user.controller.js";
import {
  addSagaController as addSaga,
  getSagaController as getSagas,
  deleteSagaController as deleteSaga,
} from "../../controllers/admin/sagas.controller.js";
import {
  getSettingsController as getSettings,
  updateSettingsController as updateSettings,
} from "../../controllers/admin/settings.controller.js";
import { requireAdmin } from "../../middlewares/auth/auth.middleware.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/media", getMedia);
router.post("/media", addMedia);
router.put("/media/:id", updateMedia);
router.delete("/media/:id", deleteMedia);
router.get("/providers", getProviders);
router.post("/providers", saveProviders);
router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id/status", toggleUserStatus);
router.patch("/users/:id", updateUser);
router.get("/sagas", getSagas);
router.post("/sagas", addSaga);
router.delete("/sagas/:id", deleteSaga);
router.get("/settings", getSettings);
router.post("/settings", updateSettings);

export default router;
