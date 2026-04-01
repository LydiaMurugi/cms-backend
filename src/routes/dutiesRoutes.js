import express from "express";
import {
  getDuties,
  createDuty,
  updateDuty,
  submitReport,
  deleteDuty
} from "../controllers/dutiesController.js";

const router = express.Router();

router.get("/", getDuties);
router.post("/", createDuty);
router.put("/:id", updateDuty);
router.put("/:id/submit", submitReport);
router.delete("/:id", deleteDuty);

export default router;
