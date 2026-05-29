import { Router } from 'express';
import { register , login  , logout} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/login', login);
router.post('/register', register);

router.post('/logout', authenticate , logout)
console.log('AUTH ROUTE CHARGEE');
export default router;