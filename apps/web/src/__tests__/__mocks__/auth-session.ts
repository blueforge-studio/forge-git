export function configureSession(_opts: unknown): void {}

export function createAuthActions(_adapter: unknown, _opts?: unknown) {
  return {
    signIn: async () => {},
    signOut: async () => {},
    signUp: async () => {},
  }
}

export function createAuthMiddleware(_config: unknown) {
  return async () => {}
}

export function getCookieName(): string {
  return 'forge-git-session'
}

export type AuthActionOptions = Record<string, unknown>
export type AuthMiddlewareConfig = Record<string, unknown>
export type AuthAdapter = Record<string, unknown>
