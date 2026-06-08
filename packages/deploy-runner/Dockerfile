FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/deploy-runner/package.json packages/deploy-runner/
COPY tsconfig.json tsconfig.json

RUN pnpm install --filter @forge-git/deploy-runner --frozen-lockfile

COPY packages/deploy-runner/ packages/deploy-runner/

CMD ["pnpm", "--filter", "@forge-git/deploy-runner", "dev"]
