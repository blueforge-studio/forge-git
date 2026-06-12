import { flow, step, el, elRef } from '@blueforge-studio/audit-init/flow-kit';

export default flow('auth-signup-flow', {
  name: 'Sign-up / Forgot-Token Helper Page',
  domain: 'auth',
  tags: ['smoke', 'auth'],
  steps: [
    step('Sign-up helper — empty state', {
      order: 1,
      route: '/signup',
      elements: [
        el('h1', { name: 'Sign-up helper heading' }),
        el('open-token-settings', { name: 'Open token settings CTA' }),
      ],
    }),
    step('Forgot-token helper — empty state', {
      order: 2,
      route: '/forgot-token',
      elements: [
        el('h1', { name: 'Forgot token heading' }),
      ],
    }),
  ],
});
