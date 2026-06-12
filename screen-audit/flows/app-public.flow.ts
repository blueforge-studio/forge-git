import { flow, step, el } from '@blueforge-studio/audit-init/flow-kit';

export default flow('app-public', {
  name: 'App public surfaces',
  domain: 'app',
  tags: ['smoke', 'public'],
  steps: [
    step('Login page', {
      order: 1,
      route: '/login',
      elements: [
        el('h1', { name: 'Login heading' }),
        el('open-token-settings', { name: 'Open token settings CTA' }),
      ],
    }),
    step('Sign-up helper page', {
      order: 2,
      route: '/signup',
      elements: [
        el('h1', { name: 'Sign-up heading' }),
        el('open-token-settings', { name: 'Open token settings CTA' }),
      ],
    }),
  ],
});
