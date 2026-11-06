# Grid Motors API

🇺🇸 [Read in English](README.md)

API REST para o sistema de locação de veículos da **Grid Motors**, desenvolvida
como Desafio Final. Contempla cadastro de Carros, Usuários, Autenticação (JWT)
e Reservas, com todas as regras de negócio descritas no desafio.

## Stack utilizada

| Camada          | Tecnologia                                    |
| --------------- | ---------------------------------------------- |
| Linguagem       | TypeScript                                     |
| Framework HTTP  | Express 5                                      |
| Banco de dados  | PostgreSQL                                     |
| Acesso a dados  | Knex.js (query builder + migrations)           |
| Autenticação    | JWT (jsonwebtoken) + bcryptjs                  |
| Validação       | Zod                                             |
| Documentação    | Swagger / OpenAPI 3.0 (swagger-ui-express)     |
| Testes          | Jest + Supertest + jest-mock-extended          |
| Lint / Format   | ESLint (flat config) + Prettier                |
| Containerização | Docker + Docker Compose                        |

> **Por que Knex em vez de Prisma/TypeORM?** Knex é um query builder leve, sem
> binários nativos ou dependências de download em tempo de build, o que o
> torna extremamente previsível em qualquer ambiente (CI, containers restritos
> etc.). Ele também deixa a camada de persistência (SQL, migrations, índices,
> constraints) totalmente explícita e auditável — importante para o critério
> de avaliação "qualidade da camada de persistência".

## Como executar o projeto localmente

### Opção 1 — Docker Compose (recomendado)

Pré-requisitos: Docker e Docker Compose instalados.

```bash
git clone https://github.com/PabloTosati/motors-api.git
cd motors-api
docker compose up --build
```

Isso sobe dois containers: `db` (PostgreSQL 16) e `api` (a aplicação). Na
subida, o container da API automaticamente roda as migrations
(`npm run db:migrate`) antes de iniciar o servidor.

A API estará disponível em `http://localhost:3000` e o Swagger em
`http://localhost:3000/api/v1/api-docs`.

### Opção 2 — Rodando localmente (sem Docker para a API)

Pré-requisitos: Node.js 18+ e um PostgreSQL acessível (local ou via Docker
apenas para o banco).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env se necessário (ex: se seu Postgres não usa usuário/senha "postgres")

# 3. Subir apenas o banco via Docker (opcional, se não tiver Postgres local)
docker compose up -d db

# 4. Rodar as migrations
npm run db:migrate

# 5. Subir a API em modo desenvolvimento (hot reload)
npm run dev

# ...ou compilar e rodar em modo produção
npm run build
npm start
```

### Rodando os testes

Os testes são **totalmente isolados** (repositórios mockados) e não exigem um
banco de dados ativo:

```bash
npm test              # roda a suíte
npm run test:coverage # roda com relatório de cobertura (mínimo exigido: 60%)
```

### Lint e formatação

```bash
npm run lint          # ESLint
npm run format:check  # Verifica formatação (Prettier)
npm run format        # Aplica a formatação
```

## Endpoints e documentação

Com o projeto no ar, a documentação completa (todas as rotas, payloads e
códigos de resposta) fica disponível via Swagger UI em:

```
http://localhost:3000/api/v1/api-docs
```

### Autenticação

Rotas de **Carros** e **Reservas** exigem um Bearer Token, obtido via login:

```
POST /api/v1/auth/login
Authorization: Bearer <token>   (nas rotas protegidas)
```

## Decisões técnicas e suposições

O documento do desafio é bastante completo, mas alguns pontos ficam em aberto
ou ambíguos. Seguem as decisões tomadas, todas com uma justificativa:

- **Escopo do Bearer Token**: o desafio exige explicitamente Bearer Token
  apenas nas rotas de **Carros**. As rotas de **Reservas** também foram
  protegidas, pois o corpo de "criar reserva" não envia `id_user` — ele só
  pode vir do usuário autenticado no token. As rotas de **Usuários** foram
  mantidas públicas (cadastro precisa ser acessível sem token, e o desafio não
  exige Bearer Token ali). É trivial adicionar o middleware `authMiddleware`
  a qualquer rota adicional, se desejado.
- **Paginação (`limit`/`offset`/`offsets`)**: o exemplo do desafio
  (`total: 1000, limit: 100, offset: 1, offsets: 10`) só faz sentido se
  `offset` for o **número da página** (1-indexado) e `offsets` o **total de
  páginas** (`ceil(total / limit)`), e não um "skip" de registros. Foi essa a
  interpretação implementada.
- **Chaves de resposta das listagens**: mantidas exatamente como no PDF, mesmo
  parecendo inconsistentes — `car` (singular) na listagem de carros e
  `reserves` na listagem de reservas.
- **Campo `id` nas respostas de Carros**: os exemplos de request/response de
  "cadastrar" e "atualizar" carro no PDF não mostram `id` no corpo de
  resposta, o que impediria o cliente de referenciar o recurso criado. O `id`
  foi incluído em todas as respostas (como já ocorre no exemplo de listagem).
- **Campo `year`**: o exemplo mostra `"year": "2021"` (string), mas a regra
  exige comparação numérica (1950–2023). A API aceita string ou número na
  entrada e converte/valida como inteiro.
- **Campo `qualified`**: a regra escrita exige os valores `yes`/`no`
  (o exemplo de payload usa `"sim"`, aparentemente uma inconsistência do
  documento). Foi seguida a regra explícita (`yes`/`no`).
- **Acessórios duplicados**: comparação **case-insensitive** (`"AR"` e `"ar"`
  são consideradas o mesmo acessório), tanto no cadastro/atualização do carro
  quanto na rota de alternar (adicionar/remover) acessório.
- **Cálculo de `final_value`**: `value_per_day × número de dias entre
  start_date e end_date`. Confirmado contra o exemplo do próprio desafio:
  50/dia × 10 dias = `500,00`.
- **Correção de typo**: o payload de exemplo da rota de acessórios usa o
  campo `descricption`; foi usado o nome correto, `description`.
- **CPF**: validado pelo algoritmo oficial de dígitos verificadores (módulo
  11), não apenas por formato/regex, e armazenado normalizado (somente
  dígitos) para a checagem de unicidade funcionar independente de formatação.
- **ViaCEP**: apenas os campos até `uf` são persistidos (`cep`, `logradouro`,
  `complemento`, `bairro`, `localidade`, `uf`), conforme instruído; os demais
  campos retornados pela API (`ibge`, `gia`, `ddd`, `siafi`) são descartados.
- **IDs**: UUID v4. Formato inválido → `400`; formato válido mas inexistente
  → `404`.

## Estrutura do projeto

```
src/
├── app.ts                  # configuração do Express (middlewares, rotas, Swagger)
├── server.ts                # ponto de entrada
├── config/                  # variáveis de ambiente
├── database/                 # conexão Knex
├── middlewares/              # auth (Bearer), tratamento de erros, async handler
├── utils/                    # CPF, datas, paginação, ViaCEP, IDs, moeda
└── modules/
    ├── auth/                 # login (JWT)
    ├── users/                 # CRUD de usuários + integração ViaCEP
    ├── cars/                  # CRUD de carros + acessórios
    └── reservations/          # CRUD de reservas + regras de sobreposição

migrations/    # migrations do Knex (users, cars, accessories, reservations)
docs/          # especificação OpenAPI (Swagger)
tests/
├── unit/       # utils, validação (Zod) e regras de negócio (services mockados)
└── integration/ # rotas HTTP de ponta a ponta (Supertest), repositórios mockados
```

Cada módulo segue a mesma arquitetura em camadas:

```
routes → controller → service (regras de negócio) → repository (Knex/SQL) → mapper (resposta da API)
```


