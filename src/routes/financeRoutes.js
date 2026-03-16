import express from "express";
import {
  getContributions,
  getMemberContributions,
  addContribution,
  updateContribution,
  deleteContribution
} from "../controllers/financeController.js";

const router = express.Router();

// All contributions
router.get("/", getContributions);

// Contributions by member
router.get("/member/:memberId", getMemberContributions);

// Add contribution
router.post("/", addContribution);

// Update contribution
router.put("/:id", updateContribution);

// Delete contribution
router.delete("/:id", deleteContribution);

export default router;