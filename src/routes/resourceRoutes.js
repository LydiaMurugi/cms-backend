import express from "express"
import { getResources, uploadResource } from "../controllers/resourceController.js"
import { upload } from "../middleware/upload.js"

const router = express.Router()

router.get("/", getResources)
router.post("/upload", upload.single("file"), uploadResource)

export default router