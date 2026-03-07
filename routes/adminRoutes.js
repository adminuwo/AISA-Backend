import express from 'express';
import { verifyToken } from '../middleware/authorization.js';
// Assuming there is an isAdmin middleware or we check role
import { 
    getAdminStats, 
    searchUserByEmail, 
    adjustCredits, 
    manualPlanUpgrade,
    createPlan,
    updatePlan,
    deletePlan,
    createCreditPackage,
    updateCreditPackage,
    deleteCreditPackage
} from '../controllers/adminController.js';

const router = express.Router();

// Middleware to check if user is admin (simplified for now)
const isAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
};

router.get('/stats', verifyToken, isAdmin, getAdminStats);
router.get('/search-user', verifyToken, isAdmin, searchUserByEmail);
router.post('/adjust-credits', verifyToken, isAdmin, adjustCredits);
router.post('/manual-upgrade', verifyToken, isAdmin, manualPlanUpgrade);

// Plan routes
router.post('/plans', verifyToken, isAdmin, createPlan);
router.put('/plans/:planId', verifyToken, isAdmin, updatePlan);
router.delete('/plans/:planId', verifyToken, isAdmin, deletePlan);

// Credit package routes
router.post('/packages', verifyToken, isAdmin, createCreditPackage);
router.put('/packages/:packageId', verifyToken, isAdmin, updateCreditPackage);
router.delete('/packages/:packageId', verifyToken, isAdmin, deleteCreditPackage);

export default router;
