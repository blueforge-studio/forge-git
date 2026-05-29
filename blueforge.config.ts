/**
 * BlueForge project config — declares every app in this monorepo so shared
 * tooling (audit-tiers portfolio, screen-audit, deploy scripts) knows what
 * each one is, regardless of filesystem layout.
 *
 * Generated/upgraded by `audit-init config`. Re-running is idempotent —
 * it only fills in missing fields.
 */
export default {
  project: {
    name: 'forge-git',
    displayName: 'Forge Git',
    scope: '@forge-git',
    category: 'devtools',
    tags: ['git', 'version-control', 'devops'],
  },
  apps: {
    cli: {
      path: 'packages/cli',
      type: 'node',
      role: 'cli',
    },

    'deploy-runner': {
      path: 'packages/deploy-runner',
      role: 'misc',
      dependencies: ['bullmq', 'redis'],
    },

    'gitea-bridge': {
      path: 'packages/gitea-bridge',
      role: 'misc',
    },

    ui: {
      path: 'packages/ui',
      role: 'library',
    },

    web: {
      path: 'apps/web',
      type: 'next',
      role: 'app',
      port: 3000,
      dev: { port: 3000, command: 'pnpm --filter @forge-git/web dev' },
    },
  },
} as const;
