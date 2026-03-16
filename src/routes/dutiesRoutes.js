import express from "express";
import {
  getDuties,
  createDuty,
  updateDutyStatus,
} from "../controllers/dutiesController.js";

const router = express.Router();

router.get("/", getDuties);
router.post("/", createDuty);
router.patch("/:id/status", updateDutyStatus);
router.put("/:id/submit", updateDutyStatus);

export default router;