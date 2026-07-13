import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Grid Motors API rodando em http://localhost:${env.port}`);

  console.log(`Swagger disponível em http://localhost:${env.port}/api/v1/api-docs`);
});
