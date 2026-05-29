import { Router } from 'express';
import { handleEvolutionWebhook} from '../controllers/webhook.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/', handleEvolutionWebhook);




export default router;