import { createAuthMiddleware } from '@/lib/session'

const middleware = createAuthMiddleware({
  cookieName: 'forge-git-session',
  publicPaths: ['/', '/login'],
  authPrefix: '/login',
  signInPath: '/login',
  homePath: '/',
  skipPaths: [
    '/api/',         // API routes handle their own auth
    '/_next/',       // Next.js internal routes
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
})

export default middleware

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
