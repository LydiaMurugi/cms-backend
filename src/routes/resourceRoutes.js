import express from "express"
import { getResources, uploadResource } from "../controllers/resourceController.js"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/", getResources)
router.post("/", verifyToken, uploadResource)

export default router
