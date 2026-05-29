import { Router } from 'express';
import { searchBookingCatalog, checkAvailability, confirmBooking } from '../controllers/booking.controller.js';

const router = Router();
router.get('/catalog', searchBookingCatalog);
router.post('/check', checkAvailability);
router.post('/confirm', confirmBooking);

export default router;