import { Router } from 'express';
import multer from 'multer';
import { createProduct, getAllProducts  ,  searchProducts} from '../controllers/product.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route pour le Dashboard
router.post('/create', upload.single('image'), createProduct);
router.get('/', getAllProducts);

router.get('/search', searchProducts);

export default router;