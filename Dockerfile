FROM node:16.14.2-alpine3.14
ENV PORT 8080
EXPOSE 8080
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build && npm prune --production
RUN rm -rf src test
CMD ["node", "dist/main"]
