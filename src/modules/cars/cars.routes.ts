import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authMiddleware } from '../../middlewares/authMiddleware';
import * as controller from './cars.controller';

const router = Router();

// Requisito obrigatório do desafio: "Todas as rotas de Carros devem exigir Bearer Token".
router.use(authMiddleware);

router.post('/', asyncHandler(controller.createCarController));
router.get('/', asyncHandler(controller.listCarsController));
router.get('/:id', asyncHandler(controller.getCarByIdController));
router.put('/:id', asyncHandler(controller.updateCarController));
router.delete('/:id', asyncHandler(controller.deleteCarController));
router.patch('/:id/accessories', asyncHandler(controller.toggleAccessoryController));

export default router;
