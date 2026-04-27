FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

FROM base AS deps
RUN npm ci --omit=dev

FROM base AS build
RUN npm ci
COPY . .
RUN npm test

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3003
USER node
CMD ["node", "src/index.js"]
