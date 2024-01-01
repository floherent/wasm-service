FROM node:16.14.2-alpine3.14

EXPOSE 8080

WORKDIR /app

COPY . .

RUN yarn install --ignore-scripts && yarn run build; rm -rf src test

VOLUME /app/uploads

CMD ["node", "dist/main"]
