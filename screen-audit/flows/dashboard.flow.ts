import { appFlow } from '@blueforge-studio/audit-init/flow-kit';

// forge-git has no /dashboard — the home page renders the dashboard for
// authenticated users and a first-run empty state otherwise.
export default appFlow('dashboard-flow', 'Dashboard (Home)', ['/'], {
  domain: 'app',
  tags: ['smoke', 'auth'],
});
