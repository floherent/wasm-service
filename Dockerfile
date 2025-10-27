FROM node:20.12-alpine3.19

RUN npm install -g npm@^10.5

EXPOSE 8080

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build && rm -rf src test

VOLUME /app/uploads

CMD ["node", "dist/main"]
