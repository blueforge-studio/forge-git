/**
 * Flow-kit helpers — shared factory functions for authoring screen-audit flows.
 *
 * Install as a dependency: @blueforge-studio/audit-init
 * Then import from '@blueforge-studio/audit-init/flow-kit' in your flow files.
 *
 * Source of truth: blueforge-org/packages/audits/audit-init/src/flow-kit.ts
 */
import type {
  PageFlow,
  AuditStep,
  AuditElement,
  FormAction,
} from '@blueforge-studio/screen-audit';

// ---------------------------------------------------------------------------
// Shared defaults
// ---------------------------------------------------------------------------

const NETWORK_IDLE_MS = 5000;

const ELEMENT_DEFAULTS = {
  type: 'css' as const,
  scrollIntoView: false,
  captureElement: true,
};

const ACTION_DEFAULTS = {
  selectorType: 'css' as const,
};

// ---------------------------------------------------------------------------
// Element factories
// ---------------------------------------------------------------------------

let _elSeq = 0;

export function el(
  selector: string,
  overrides?: Partial<AuditElement>,
): AuditElement {
  const isTestIdShorthand = !selector.startsWith('.')
    && !selector.startsWith('#')
    && !selector.startsWith('[');
  const resolved = isTestIdShorthand
    ? `[data-testid='${selector}']`
    : selector;

  return {
    selector: resolved,
    name: overrides?.name ?? `element-${_elSeq++}`,
    ...ELEMENT_DEFAULTS,
    ...overrides,
  };
}

export function elRef(
  selector: string,
  overrides?: Partial<AuditElement>,
): AuditElement {
  return el(selector, { ...overrides, captureElement: false });
}

export function elBelow(
  selector: string,
  overrides?: Partial<AuditElement>,
): AuditElement {
  return el(selector, { ...overrides, scrollIntoView: true });
}

// ---------------------------------------------------------------------------
// Step factory
// ---------------------------------------------------------------------------

let _stepSeq = 0;

export function step(
  name: string,
  overrides?: Partial<Omit<AuditStep, 'name'>>,
): AuditStep {
  const order = overrides?.order ?? _stepSeq++;
  return {
    order,
    name,
    elements: [],
    waitForNetworkIdle: NETWORK_IDLE_MS,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Action factories
// ---------------------------------------------------------------------------

export function fill(
  selector: string,
  value: string,
  overrides?: Partial<FormAction>,
): FormAction {
  const isTestIdShorthand = !selector.startsWith('.')
    && !selector.startsWith('#')
    && !selector.startsWith('[');
  const resolved = isTestIdShorthand
    ? `[data-testid='${selector}']`
    : selector;
  return {
    ...ACTION_DEFAULTS,
    type: 'fill',
    selector: resolved,
    value,
    ...overrides,
  };
}

export function click(
  selector: string,
  overrides?: Partial<FormAction>,
): FormAction {
  const isTestIdShorthand = !selector.startsWith('.')
    && !selector.startsWith('#')
    && !selector.startsWith('[');
  const resolved = isTestIdShorthand
    ? `[data-testid='${selector}']`
    : selector;
  return {
    ...ACTION_DEFAULTS,
    type: 'click',
    selector: resolved,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Flow factories
// ---------------------------------------------------------------------------

export function flow(
  id: string,
  overrides?: Partial<Omit<PageFlow, 'id'>>,
): PageFlow {
  _stepSeq = 0;
  return {
    id,
    name: id,
    domain: 'app',
    steps: [],
    ...overrides,
  };
}

export function appFlow(
  id: string,
  name: string,
  routes: string[],
  overrides?: Partial<Omit<PageFlow, 'id' | 'name' | 'steps'>>,
): PageFlow {
  return flow(id, {
    name,
    steps: routes.map((route, i) => step(route, { order: i, route })),
    ...overrides,
  });
}
