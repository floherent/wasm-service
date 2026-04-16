FROM node:20-alpine

EXPOSE 8080

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build && rm -rf src test

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

VOLUME /app/uploads

CMD ["node", "dist/main"]
