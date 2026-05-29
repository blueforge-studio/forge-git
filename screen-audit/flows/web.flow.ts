import type { AuditFlow } from '@blueforge-studio/screen-audit/types';

const flow: AuditFlow = {
  id: 'web-app',
  name: 'web — app surface',
  domain: 'app',
  steps: [
    { order: 1, name: 'Landing', route: '/', elements: [
      { selector: 'h1', type: 'css', name: 'Page title', scrollIntoView: false, captureElement: true },
      { selector: 'main, body > div', type: 'css', name: 'Main', scrollIntoView: false, captureElement: false },
    ] },
  ],
};

export default flow;
