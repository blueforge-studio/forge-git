import { flow, step, el, elBelow, elRef } from '@blueforge-studio/audit-init/flow-kit';

export default flow('site-landing', {
  name: 'Marketing site landing',
  domain: 'marketing',
  tags: ['smoke', 'public'],
  steps: [
    step('Landing — above the fold', {
      order: 1,
      route: '/',
      elements: [
        el('site-header', { name: 'Header' }),
        el('brand-link', { name: 'Brand link' }),
        elRef('theme-toggle', { name: 'Theme toggle' }),
        el('hero-section', { name: 'Hero section' }),
        el('hero-heading', { name: 'Hero heading' }),
        el('hero-sign-in-cta', { name: 'Hero primary CTA — sign in' }),
      ],
    }),
    step('Landing — feature grid', {
      order: 2,
      route: '/',
      elements: [elBelow('feature-grid', { name: 'Feature grid' })],
    }),
    step('Landing — how it works', {
      order: 3,
      route: '/',
      elements: [elBelow('how-it-works-section', { name: 'How it works' })],
    }),
    step('Landing — pricing', {
      order: 4,
      route: '/',
      elements: [
        elRef('pricing-section', { name: 'Pricing section', scrollIntoView: true }),
      ],
    }),
    step('Landing — CTA section', {
      order: 5,
      route: '/',
      elements: [elBelow('cta-section', { name: 'CTA section' })],
    }),
    step('Landing — newsletter', {
      order: 6,
      route: '/',
      elements: [
        elBelow('newsletter-section', { name: 'Newsletter' }),
        el('newsletter-email-input', { name: 'Newsletter email input' }),
        el('newsletter-submit-btn', { name: 'Newsletter submit' }),
      ],
    }),
    step('Landing — footer', {
      order: 7,
      route: '/',
      elements: [elBelow('site-footer', { name: 'Footer' })],
    }),
  ],
});
