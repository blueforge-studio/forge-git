import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@forge-git/gitea-bridge'],
  },
}

export default nextConfig