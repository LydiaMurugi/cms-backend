import express from 'express'
import { login, register, getMe, updateMe } from '../controllers/authController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', verifyToken, getMe)
router.put('/me', verifyToken, updateMe) 

export default router

