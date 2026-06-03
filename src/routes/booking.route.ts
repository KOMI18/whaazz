import { Router } from 'express';
import { searchBookingCatalog,createBookableResource, checkAvailability, confirmBooking , getAllBookings} from '../controllers/booking.controller.js';

const router = Router();
router.get('/catalog', searchBookingCatalog);
router.post('/check', checkAvailability);
router.post('/confirm', confirmBooking);
router.post('/resource', createBookableResource);
router.get('/getall' , getAllBookings);
export default router;