# Build stage
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/gitea-bridge/package.json packages/gitea-bridge/
COPY packages/gitea-bridge/tsconfig.json packages/gitea-bridge/
COPY packages/ui/package.json packages/ui/
COPY packages/ui/tsconfig.json packages/ui/

RUN pnpm install --frozen-lockfile

COPY apps/web/ apps/web/
COPY packages/gitea-bridge/src/ packages/gitea-bridge/src/
COPY packages/ui/src/ packages/ui/src/

RUN pnpm -C packages/gitea-bridge build
RUN pnpm -C packages/ui build
RUN pnpm -C apps/web build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/apps/web/.next/standalone/ ./
COPY --from=build /app/apps/web/.next/static/ ./apps/web/.next/static/
COPY --from=build /app/apps/web/public/ ./apps/web/public/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
