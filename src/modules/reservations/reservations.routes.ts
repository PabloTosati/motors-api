import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { authMiddleware } from '../../middlewares/authMiddleware';
import * as controller from './reservations.controller';

const router = Router();

// O corpo de "criar reserva" não inclui id_user (só id_car) — o usuário
// responsável é sempre o do token autenticado. Por isso, e por consistência
// de segurança, todas as rotas de Reservas exigem Bearer Token.
router.use(authMiddleware);

router.post('/', asyncHandler(controller.createReservationController));
router.get('/', asyncHandler(controller.listReservationsController));
router.get('/:id', asyncHandler(controller.getReservationByIdController));
router.put('/:id', asyncHandler(controller.updateReservationController));
router.delete('/:id', asyncHandler(controller.deleteReservationController));

export default router;
