import express from "express";
import {
  getPrograms,
  createProgram,
} from "../controllers/programsController.js";

const router = express.Router();

router.get("/", getPrograms);
router.post("/", createProgram);

export default router;