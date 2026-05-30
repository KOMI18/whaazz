import { Router } from 'express';
import { searchBookingCatalog,createBookableResource, checkAvailability, confirmBooking } from '../controllers/booking.controller.js';

const router = Router();
router.get('/catalog', searchBookingCatalog);
router.post('/check', checkAvailability);
router.post('/confirm', confirmBooking);
router.post('/resource', createBookableResource);
export default router;