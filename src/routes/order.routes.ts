import { Router } from 'express';
import { createOrder, checkPaymentStatus , getAllOrders } from '../controllers/order.controller.js';
import {authenticate} from "../middlewares/auth.middleware.js";
const router = Router();

router.post('/draft', createOrder);
router.get('/', getAllOrders);
router.get('/:orderId/status', checkPaymentStatus);

export default router;