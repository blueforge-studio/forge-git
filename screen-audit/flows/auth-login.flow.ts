import { flow, step, el, elRef, fill, click } from '@blueforge-studio/audit-init/flow-kit';

export default flow('auth-login-flow', {
  name: 'Login Page',
  domain: 'auth',
  tags: ['smoke', 'auth'],
  steps: [
    step('Login — empty state (OAuth collapsed)', {
      order: 1,
      route: '/login',
      elements: [
        el('h1', { name: 'Login Heading' }),
        el('open-token-settings', { name: 'Open token settings CTA' }),
        elRef('new-here-get-token', { name: 'Get token link' }),
      ],
    }),
    step('Login — expand PAT form', {
      order: 2,
      route: '/login',
      elements: [
        el('last-used-hint', { name: 'Last used URL hint' }),
        el('[name="giteaUrl"]', { name: 'Gitea URL input' }),
        el('url-health-pill', { name: 'URL health pill' }),
        el('[name="token"]', { name: 'Token input' }),
      ],
    }),
    step('Login — fill Gitea URL', {
      order: 3,
      action: fill('[name="giteaUrl"]', 'http://localhost:3000'),
      elements: [el('[name="giteaUrl"]', { name: 'Gitea URL (filled)' })],
    }),
    step('Login — fill token', {
      order: 4,
      action: fill('[name="token"]', 'wrong-token'),
      elements: [el('[name="token"]', { name: 'Token (filled)' })],
    }),
    step('Login — submit (error state)', {
      order: 5,
      action: click('button[type=submit]', { delayAfter: 5000 }),
      elements: [el('[role=alert]', { name: 'Auth error banner' })],
    }),
  ],
});
