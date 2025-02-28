import { Router } from 'express';
import weatherRoutes from './weatherRoutes.js';

const router = Router();

router.use('/weather', weatherRoutes);

export default router;