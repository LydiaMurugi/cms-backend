import express from 'express'
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} from '../controllers/membersController.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/roleMiddleware.js'


const router = express.Router()
// Only authenticated users
router.use(verifyToken)

// Admin can manage members
router.get('/', allowRoles('admin', 'leader'), getMembers)
router.post('/', allowRoles('admin'), createMember)
router.put('/:id', allowRoles('admin'), updateMember)
router.delete('/:id', allowRoles('admin'), deleteMember)

export default router
