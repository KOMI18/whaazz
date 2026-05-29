import { Router } from 'express';
import multer from 'multer';
import { createProduct, getAllProducts  ,  searchProducts} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.post('/create', upload.single('image'), createProduct);
router.get('/', getAllProducts);


export default router;