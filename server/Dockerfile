FROM node:24-alpine AS deps
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
RUN pnpm install --frozen-lockfile --filter @book-scanner/server...

FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json eslint.config.js ./
COPY server ./server
RUN pnpm --filter @book-scanner/server build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
RUN pnpm install --prod --frozen-lockfile --filter @book-scanner/server...
COPY --from=build /app/server/dist ./server/dist
COPY server/drizzle ./server/drizzle
COPY server/drizzle.config.ts ./server/drizzle.config.ts

WORKDIR /app/server
EXPOSE 8787
CMD ["node", "dist/index.js"]
