#!/usr/bin/env node

/**
 * Generate AI-powered logo for forge-git using Replicate FLUX-schnell.
 * Focus: Git branching icon — clean, minimal, suitable for app icon use.
 *
 * Usage:
 *   REPLICATE_API_TOKEN=... node scripts/generate-logo-ai.mjs [--force]
 *   or: npx tsx scripts/generate-logo-ai.ts [--force]
 */

import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'images')
const FORCE = process.argv.includes('--force')

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function generateWithReplicate(token, prompt) {
  const Replicate = (await import('replicate')).default
  const replicate = new Replicate({ auth: token })

  let output
  for (let attempt = 0; ; attempt++) {
    try {
      output = await replicate.run('black-forest-labs/flux-schnell', {
        input: {
          prompt,
          aspect_ratio: '1:1',
          num_outputs: 1,
          output_format: 'png',
          output_quality: 90,
          megapixels: '1',
        },
      })
      break
    } catch (err) {
      const msg = err.message || ''
      const m = msg.match(/"retry_after":\s*(\d+)/)
      if (m && attempt < 3) {
        const wait = (parseInt(m[1], 10) + 2) * 1000
        console.log(`  rate-limited, waiting ${wait / 1000}s...`)
        await sleep(wait)
        continue
      }
      throw err
    }
  }

  const first = Array.isArray(output) ? output[0] : output
  if (first && typeof first.blob === 'function') {
    const blob = await first.blob()
    return Buffer.from(await blob.arrayBuffer())
  }
  let url
  if (typeof first === 'string') url = first
  else if (first && typeof first === 'object' && typeof first.href === 'string') url = first.href
  else if (first && typeof first.arrayBuffer === 'function') {
    return Buffer.from(await first.arrayBuffer())
  } else {
    throw new Error(`unexpected replicate output shape: ${typeof first}`)
  }
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download failed: ${r.status} for ${url}`)
  return Buffer.from(await r.arrayBuffer())
}

async function removeWhiteBackground(rawBuf) {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(rawBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    const whiteness = (r + g + b) / 3
    const minCh = Math.min(r, g, b)
    out[i] = r; out[i + 1] = g; out[i + 2] = b
    if (whiteness > 240 && minCh > 220) {
      out[i + 3] = 0 // fully transparent
    } else if (whiteness > 200 && minCh > 180) {
      const alpha = Math.round(255 * (1 - (whiteness - 200) / 55))
      out[i + 3] = Math.max(0, Math.min(255, alpha))
    } else {
      out[i + 3] = a
    }
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92 })
    .toBuffer()
}

async function main() {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.error('REPLICATE_API_TOKEN not set')
    process.exit(1)
  }

  const prompt = [
    'a minimalist app icon: a clean git branching diagram with three circles connected by lines forming a branching tree,',
    'abstract geometric representation of git branches and merges, simple nodes and connecting paths,',
    'electric blue to deep indigo gradient on the icon elements, flat 2D vector style, bold clean geometric shapes,',
    'slightly rounded square composition centered on a pure clean white background,',
    'absolutely no text, no letters, no typography, no words,',
    'no photograph, no realism, no scene, no people, no background objects,',
    'professional app brand mark, crisp clean edges, modern tech aesthetic,',
    'suitable for 64x64 favicon and app store icon, minimal and iconic',
  ].join(' ')

  const logoPath = join(OUT, 'logo.webp')
  const markPath = join(OUT, 'logo-mark.webp')
  const faviconPath = join(OUT, 'favicon.webp')
  const applePath = join(OUT, 'apple-touch-icon.webp')

  if (FORCE || !existsSync(logoPath)) {
    console.log('Generating logo with Replicate FLUX-schnell...')
    console.log('Prompt:', prompt)

    const raw = await generateWithReplicate(token, prompt)
    console.log(`  received ${raw.length} bytes from Replicate`)

    // Post-process: remove white bg, trim, resize to 512x512 WebP
    const sharp = (await import('sharp')).default
    const processed = await removeWhiteBackground(raw)
    sharp.cache(false)
    await sharp(processed).toFile(logoPath)
    console.log(`✓ logo.webp (${statSync(logoPath).size} bytes)`)

    // Generate derivatives
    await sharp(processed).resize(64, 64).webp({ quality: 92 }).toFile(markPath)
    console.log(`✓ logo-mark.webp (64x64, ${statSync(markPath).size} bytes)`)

    await sharp(processed).resize(32, 32).webp({ quality: 90 }).toFile(faviconPath)
    console.log(`✓ favicon.webp (32x32, ${statSync(faviconPath).size} bytes)`)

    await sharp(processed).resize(180, 180).webp({ quality: 92 }).toFile(applePath)
    console.log(`✓ apple-touch-icon.webp (180x180, ${statSync(applePath).size} bytes)`)
  } else {
    console.log('⏭  logo.webp (exists, use --force to overwrite)')
  }

  console.log('\nDone. Images in public/images/')
}

main().catch((err) => {
  console.error('Logo generation failed:', err)
  process.exit(1)
})
