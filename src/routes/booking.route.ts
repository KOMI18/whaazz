import { Router } from 'express';
import { searchBookingCatalog,createBookableResource, getUserBookings , checkAvailability, confirmBooking , getAllBookings , addResourceAvailabilities} from '../controllers/booking.controller.js';

const router = Router();
router.get('/catalog', searchBookingCatalog);
router.post('/check', checkAvailability);
router.post('/confirm', confirmBooking);
router.post('/resource', createBookableResource);
router.get('/get-booking' , getUserBookings)
router.get('/getall' , getAllBookings);
router.put('/resource/availabilities' ,  addResourceAvailabilities)
export default router;