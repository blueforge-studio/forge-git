import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { createAuthMiddleware } from '@/lib/session'

const intlMiddleware = createMiddleware(routing)

const authMiddleware = createAuthMiddleware({
  cookieName: 'forge-git-session',
  publicPaths: ['/', '/login', '/signup', '/forgot-token', '/auth/callback'],
  authPrefix: '/login',
  signInPath: '/login',
  homePath: '/',
  skipPaths: [
    '/api/',
    '/_next/',
    '/images/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
})

export default function middleware(request: NextRequest) {
  // Run i18n first to set locale cookie/header
  const intlResponse = intlMiddleware(request)

  // Run auth middleware
  const authResponse = authMiddleware(request)

  // Merge i18n cookies into auth response
  intlResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      authResponse.headers.append('Set-Cookie', value)
    }
  })

  return authResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
