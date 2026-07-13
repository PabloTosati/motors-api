import path from 'path';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import carsRoutes from './modules/cars/cars.routes';
import reservationsRoutes from './modules/reservations/reservations.routes';
import { errorHandler } from './middlewares/errorHandler';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  if (!env.isTest) {
    app.use(morgan('dev'));
  }

  const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
  const swaggerDocument = YAML.load(openApiPath);
  app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/cars', carsRoutes);
  app.use('/api/v1/reservations', reservationsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ message: 'rota não encontrada' });
  });

  app.use(errorHandler);

  return app;
}
