#!/usr/bin/env node

/**
 * Image generation script for forge-git.
 * Generates logo, favicon, OG image, and hero background using sharp.
 *
 * Usage: node scripts/generate-images.mjs [--force]
 *
 * With REPLICATE_API_TOKEN set, uses AI for the hero background.
 * Without it, generates programmatic SVG-based images via sharp.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'images')
const FORCE = process.argv.includes('--force')

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

// Dynamic import so the script works even if sharp isn't installed globally
async function main() {
  const sharp = (await import('sharp')).default

  // -----------------------------------------------------------------------
  // Colors (from globals.css)
  // -----------------------------------------------------------------------
  const colors = {
    bg: '#0f172a',          // slate-900
    primary: '#2563eb',     // blue-600
    primaryLight: '#3b82f6',// blue-500
    accent: '#8b5cf6',      // violet-500
    text: '#f8fafc',        // slate-50
    muted: '#94a3b8',       // slate-400
    border: '#1e293b',      // slate-800
    darkBg: '#020617',     // slate-950
    glow: '#1d4ed8',       // blue-700
  }

  // -----------------------------------------------------------------------
  // 1. Logo — SVG forge/anvil + git-branch concept (512x512)
  // -----------------------------------------------------------------------
  const logoSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.darkBg}"/>
        <stop offset="100%" stop-color="${colors.bg}"/>
      </linearGradient>
      <linearGradient id="forgeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.accent}"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="512" height="512" rx="96" fill="url(#bgGrad)"/>
    <!-- Anvil shape -->
    <g transform="translate(256,240)" filter="url(#glow)">
      <path d="M-60,40 L-80,-10 L-10,-40 L10,-40 L80,-10 L60,40 Z" fill="none" stroke="url(#forgeGrad)" stroke-width="8" stroke-linejoin="round"/>
      <!-- Anvil top -->
      <rect x="-90" y="-50" width="180" height="20" rx="6" fill="url(#forgeGrad)"/>
      <!-- Anvil horn -->
      <path d="M-90,-40 L-120,-80 L-90,-80" fill="none" stroke="url(#forgeGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <!-- Git branch -->
    <g transform="translate(256,380)" filter="url(#glow)">
      <circle cx="-40" cy="0" r="12" fill="url(#forgeGrad)"/>
      <circle cx="40" cy="-20" r="12" fill="url(#forgeGrad)"/>
      <circle cx="40" cy="20" r="12" fill="url(#forgeGrad)"/>
      <path d="M-28,0 L28,-20 M-28,0 L28,20" stroke="url(#forgeGrad)" stroke-width="6" stroke-linecap="round"/>
    </g>
  </svg>`

  const logoOut = join(OUT, 'logo.webp')
  if (FORCE || !existsSync(logoOut)) {
    await sharp(Buffer.from(logoSvg)).resize(512, 512).webp({ quality: 92 }).toFile(logoOut)
    console.log('✓ logo.webp (512x512)')
  } else {
    console.log('⏭  logo.webp (exists, use --force to overwrite)')
  }

  // -----------------------------------------------------------------------
  // 2. Favicon — 32x32 version of logo
  // -----------------------------------------------------------------------
  const faviconOut = join(OUT, 'favicon.webp')
  if (FORCE || !existsSync(faviconOut)) {
    await sharp(Buffer.from(logoSvg)).resize(32, 32).webp({ quality: 90 }).toFile(faviconOut)
    console.log('✓ favicon.webp (32x32)')
  } else {
    console.log('⏭  favicon.webp (exists)')
  }

  // -----------------------------------------------------------------------
  // 3. Apple touch icon — 180x180
  // -----------------------------------------------------------------------
  const appleOut = join(OUT, 'apple-touch-icon.webp')
  if (FORCE || !existsSync(appleOut)) {
    await sharp(Buffer.from(logoSvg)).resize(180, 180).webp({ quality: 92 }).toFile(appleOut)
    console.log('✓ apple-touch-icon.webp (180x180)')
  } else {
    console.log('⏭  apple-touch-icon.webp (exists)')
  }

  // -----------------------------------------------------------------------
  // 4. OG image — 1200x630 (for social sharing)
  // -----------------------------------------------------------------------
  const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ogBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.darkBg}"/>
        <stop offset="100%" stop-color="#0a1628"/>
      </linearGradient>
      <radialGradient id="ogGlow1" cx="0.2" cy="0.3" r="0.5">
        <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <radialGradient id="ogGlow2" cx="0.8" cy="0.7" r="0.4">
        <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#ogBg)"/>
    <circle cx="240" cy="190" r="300" fill="url(#ogGlow1)"/>
    <circle cx="960" cy="440" r="250" fill="url(#ogGlow2)"/>

    <!-- Accent bar -->
    <rect y="0" width="1200" height="4" fill="url(#ogGlow1)"/>

    <!-- Text -->
    <text x="100" y="250" font-family="system-ui,sans-serif" font-size="72" font-weight="900" fill="${colors.text}">Forge git</text>
    <text x="100" y="320" font-family="system-ui,sans-serif" font-size="28" fill="${colors.muted}">Self-hosted Git platform powered by Gitea</text>
    <text x="100" y="370" font-family="system-ui,sans-serif" font-size="22" fill="${colors.primaryLight}">Repos • Pull Requests • Issues • CI/CD • Deployments</text>

    <!-- Decorative dots grid -->
    <g fill="${colors.border}" opacity="0.3">
      ${Array.from({length: 15}, (_, i) => Array.from({length: 8}, (_, j) =>
        `<circle cx="${850 + j * 30}" cy="${80 + i * 30}" r="3"/>`
      ).join('')).join('')}
    </g>
  </svg>`

  const ogOut = join(OUT, 'og-image.webp')
  if (FORCE || !existsSync(ogOut)) {
    await sharp(Buffer.from(ogSvg)).resize(1200, 630).webp({ quality: 90 }).toFile(ogOut)
    console.log('✓ og-image.webp (1200x630)')
  } else {
    console.log('⏭  og-image.webp (exists)')
  }

  // -----------------------------------------------------------------------
  // 5. Hero background — subtle abstract pattern (1344x768)
  // -----------------------------------------------------------------------
  const heroSvg = `<svg width="1344" height="768" viewBox="0 0 1344 768" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.darkBg}"/>
        <stop offset="50%" stop-color="#0a1628"/>
        <stop offset="100%" stop-color="${colors.darkBg}"/>
      </linearGradient>
      <radialGradient id="hGlow1" cx="0.3" cy="0.4" r="0.6">
        <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <radialGradient id="hGlow2" cx="0.7" cy="0.6" r="0.5">
        <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${colors.border}" stroke-width="0.5" opacity="0.3"/>
      </pattern>
      <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="1.5" fill="${colors.primary}" opacity="0.1"/>
      </pattern>
    </defs>
    <rect width="1344" height="768" fill="url(#heroBg)"/>
    <rect width="1344" height="768" fill="url(#grid)"/>
    <rect width="1344" height="768" fill="url(#dots)"/>
    <circle cx="400" cy="300" r="350" fill="url(#hGlow1)"/>
    <circle cx="1000" cy="500" r="280" fill="url(#hGlow2)"/>
  </svg>`

  const heroOut = join(OUT, 'hero-bg.webp')
  if (FORCE || !existsSync(heroOut)) {
    await sharp(Buffer.from(heroSvg)).resize(1344, 768).webp({ quality: 85 }).toFile(heroOut)
    console.log('✓ hero-bg.webp (1344x768)')
  } else {
    console.log('⏭  hero-bg.webp (exists)')
  }

  // -----------------------------------------------------------------------
  // 6. Logo mark — transparent icon-only version for header (64x64)
  // -----------------------------------------------------------------------
  const markSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="forgeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.accent}"/>
      </linearGradient>
    </defs>
    <!-- Anvil shape -->
    <g transform="translate(256,240)">
      <path d="M-60,40 L-80,-10 L-10,-40 L10,-40 L80,-10 L60,40 Z" fill="none" stroke="url(#forgeGrad)" stroke-width="10" stroke-linejoin="round"/>
      <rect x="-90" y="-50" width="180" height="22" rx="6" fill="url(#forgeGrad)"/>
      <path d="M-90,-38 L-125,-82 L-90,-82" fill="none" stroke="url(#forgeGrad)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <!-- Git branch -->
    <g transform="translate(256,380)">
      <circle cx="-40" cy="0" r="14" fill="url(#forgeGrad)"/>
      <circle cx="40" cy="-24" r="14" fill="url(#forgeGrad)"/>
      <circle cx="40" cy="24" r="14" fill="url(#forgeGrad)"/>
      <path d="M-26,0 L26,-24 M-26,0 L26,24" stroke="url(#forgeGrad)" stroke-width="7" stroke-linecap="round"/>
    </g>
  </svg>`

  const markOut = join(OUT, 'logo-mark.webp')
  if (FORCE || !existsSync(markOut)) {
    await sharp(Buffer.from(markSvg)).resize(64, 64).webp({ quality: 92 }).toFile(markOut)
    console.log('✓ logo-mark.webp (64x64, transparent)')
  } else {
    console.log('⏭  logo-mark.webp (exists)')
  }

  console.log('\nDone. Images in public/images/')
}

main().catch((err) => {
  console.error('Image generation failed:', err)
  process.exit(1)
})
