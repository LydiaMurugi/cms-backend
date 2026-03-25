import express from 'express';
import { saveSettings, getSettings } from '../controllers/settingsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getSettings);
router.post('/', verifyToken, saveSettings);

export default router;