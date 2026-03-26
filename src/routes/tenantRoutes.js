  import express from 'express';
  import { getAllTenants, registerTenant, updateTenant, deleteTenant } from '../controllers/tenantController.js';
   import { verifyToken } from '../middleware/authMiddleware.js'; 

 const router = express.Router();

     const authorizeSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super-admin') {
           next();
      } else {
          res.status(403).json({ message: 'Access denied. Super Admin only.' });
       }
    };
   
   router.get('/', verifyToken, authorizeSuperAdmin, getAllTenants);
   router.post('/register', verifyToken, authorizeSuperAdmin, registerTenant);
   router.put('/:id', verifyToken, authorizeSuperAdmin, updateTenant);  
   router.delete('/:id', verifyToken, authorizeSuperAdmin, deleteTenant);

   
export default router;