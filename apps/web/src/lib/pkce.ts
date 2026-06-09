/**
 * PKCE (Proof Key for Code Exchange) utilities.
 *
 * Uses the Web Crypto API (available in Node 22+ and Edge runtimes).
 * Generates S256 code challenge per RFC 7636.
 */

function base64URLEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function generatePKCEChallengePair(): Promise<{
  verifier: string
  challenge: string
  state: string
}> {
  const verifierBytes = new Uint8Array(32)
  crypto.getRandomValues(verifierBytes)
  const verifier = base64URLEncode(verifierBytes)

  const encoder = new TextEncoder()
  const challengeBytes = await crypto.subtle.digest('SHA-256', encoder.encode(verifier))
  const challenge = base64URLEncode(new Uint8Array(challengeBytes))

  const stateBytes = new Uint8Array(16)
  crypto.getRandomValues(stateBytes)
  const state = base64URLEncode(stateBytes)

  return { verifier, challenge, state }
}
