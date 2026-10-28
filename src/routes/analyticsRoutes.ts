import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all analytics routes
router.use(authenticate);

router.get('/dashboard', getDashboardAnalytics);

export default router;

