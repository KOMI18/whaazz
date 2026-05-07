import { Router } from 'express';
import { createAgent, getAgentQRCode , getAgents, updateAgent , getAgentsId  , LogouInstance , DeleteInstance} from '../controllers/agent.controller.js';
const router = Router();

router.post('/create', createAgent);
router.get('/:id/qrcode', getAgentQRCode);
router.get('/', getAgents);
router.get('/:id', getAgentsId);
router.put('/:id', updateAgent);
router.delete('/logout/:id', LogouInstance);
router.delete('/delete/:id', DeleteInstance);


export default router;   