import express from "express"
import { getMemberDashboard } from "../controllers/memberDashboardController.js"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/", verifyToken, getMemberDashboard)
export default router