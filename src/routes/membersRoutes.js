import express from 'express'
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  setPassword,
} from '../controllers/membersController.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/roleMiddleware.js'


const router = express.Router()

 // Allow password setting for the new member
router.post('/set-password', setPassword) 
// Only authenticated users


router.use(verifyToken)

// Admin can manage members

 // ✅ Update these lines in your backend routes file:
  
    // Allow both admin and leader to see the list
    router.get('/', allowRoles('admin', 'leader', 'church-admin'), getMembers)

    // Allow church-admin, admin, and leader to invite new members
    router.post('/', allowRoles('admin', 'church-admin', 'leader'), createMember)
    
    // Allow all admin roles to edit/delete
   router.put('/:id', allowRoles('admin', 'church-admin', 'leader'), updateMember)
   router.delete('/:id', allowRoles('admin', 'church-admin', 'leader'), deleteMember)

export default router
