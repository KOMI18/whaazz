import { Router } from 'express';
import { handleEvolutionWebhook} from '../controllers/webhook.controller.js';
const router = Router();

router.post('/', handleEvolutionWebhook);




export default router;