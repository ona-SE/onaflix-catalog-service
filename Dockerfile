FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY src/ src/

EXPOSE 3003
USER node
CMD ["node", "src/index.js"]
