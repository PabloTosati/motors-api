FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json knexfile.ts ./

RUN npm install

COPY src ./src
COPY migrations ./migrations
COPY docs ./docs

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
