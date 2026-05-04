import { Router } from 'express';
import { createOrder, checkPaymentStatus } from '../controllers/order.controller.js';

const router = Router();

router.post('/draft', createOrder);
router.get('/:orderId/status', checkPaymentStatus);

export default router;