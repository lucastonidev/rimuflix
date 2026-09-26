import express from "express";
import { getDashboardStats } from "../../controllers/admin/dashboard.controller.js";
import {
  getMediaController as getMedia,
  addMediaController as addMedia,
} from "../../controllers/admin/media.controller.js";
import {
  getProvidersController as getProviders,
  saveProvidersController as saveProviders,
} from "../../controllers/admin/providers.controller.js";
import {
  getUsersController as getUsers,
  toggleUserStatusController as toggleStatus,
  createUserController as createUser,
} from "../../controllers/admin/users.controller.js";
import {
  addSagaController as addSaga,
  deleteSagaController as deleteSaga,
} from "../../controllers/admin/sagas.controller.js";
import {
  getSettingsController as getSettings,
  updateSettingsController as updateSettings,
} from "../../controllers/admin/settings.controller.js";

const router = express.Router();

router.get("/dashboard", getDashboardStats);
router.get("/media", getMedia);
router.post("/media", addMedia);
router.get("/providers", getProviders);
router.post("/providers", saveProviders);
router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id/status", toggleStatus);
router.post("/sagas", addSaga);
router.delete("/sagas/:id", deleteSaga);
router.get("/settings", getSettings);
router.post("/settings", updateSettings);

export default router;
