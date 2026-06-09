# Build stage
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/deploy-runner/package.json packages/deploy-runner/
COPY packages/deploy-runner/tsconfig.json packages/deploy-runner/

RUN pnpm install --frozen-lockfile

COPY packages/deploy-runner/src/ packages/deploy-runner/src/

RUN pnpm --filter @forge-git/deploy-runner build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/packages/deploy-runner/dist/ ./dist/
COPY --from=build /app/packages/deploy-runner/node_modules/ ./node_modules/
COPY --from=build /app/packages/deploy-runner/package.json ./

CMD ["node", "dist/index.js"]
