import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import * as controller from './users.controller';

const router = Router();

// As rotas de usuário são públicas: cadastro precisa ser acessível sem
// token (é o primeiro passo antes do login) e o desafio não lista o
// Bearer Token como obrigatório aqui (diferente de Carros, que exige
// explicitamente). Ver README > Decisões e Suposições.
router.post('/', asyncHandler(controller.createUserController));
router.get('/', asyncHandler(controller.listUsersController));
router.get('/:id', asyncHandler(controller.getUserByIdController));
router.put('/:id', asyncHandler(controller.updateUserController));
router.delete('/:id', asyncHandler(controller.deleteUserController));

export default router;
