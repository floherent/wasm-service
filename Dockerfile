FROM node:16.14.2-alpine3.14

EXPOSE 8080

WORKDIR /app

COPY . .

RUN npm install --ignore-scripts && npm run build; rm -rf src test

CMD ["node", "dist/main"]
