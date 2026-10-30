FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/index.js server/geminiProxy.js server/scenarioSchema.json ./server/
COPY src/utils/validation.js ./src/utils/
USER node
EXPOSE 3001
CMD ["node", "server/index.js"]
