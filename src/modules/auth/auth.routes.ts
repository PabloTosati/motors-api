import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { loginController } from './auth.controller';

const router = Router();

router.post('/login', asyncHandler(loginController));

export default router;
