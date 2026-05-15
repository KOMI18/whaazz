import { Router } from 'express';
import multer from 'multer';
import {   searchProducts} from '../controllers/product.controller.js';

const router = Router();


router.get('/products/search', searchProducts);

export default router;