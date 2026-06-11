#!/usr/bin/env node
/**
 * Generate AI hero background image for the forge-git landing page.
 * Uses Replicate FLUX-schnell → sharp post-process → WebP.
 *
 * Usage:
 *   REPLICATE_API_TOKEN=... node scripts/generate-hero-bg.mjs
 */
import Replicate from 'replicate';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'public', 'images', 'hero-bg.webp');

const token = process.env.REPLICATE_API_TOKEN;
if (!token) {
  console.error('REPLICATE_API_TOKEN not set');
  process.exit(1);
}

const replicate = new Replicate({ auth: token });

const prompt = [
  'a developer wearing a dark hoodie sitting at a desk seen from behind, facing a large glowing monitor,',
  'the screen shows colorful code with git branching visualization, neon blue and violet syntax highlighting,',
  'dark atmospheric room with deep navy and indigo tones, subtle cyan ambient light from the screen,',
  'glowing git commit graph nodes and branching lines floating holographically above the desk,',
  'cinematic lighting, rim light on the developer silhouette, volumetric atmosphere,',
  'no text, no letters, no typography, no words anywhere in the image,',
  'no faces visible, back view only, mysterious and focused mood,',
  'suitable as a full-width dark hero section background, 16:9 cinematic composition',
].join(' ');

async function generate() {
  console.log('Generating hero background...');
  console.log(`  Prompt: "${prompt}"`);

  let output;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      output = await replicate.run('black-forest-labs/flux-schnell', {
        input: {
          prompt,
          aspect_ratio: '16:9',
          num_outputs: 1,
          output_format: 'png',
          output_quality: 95,
          megapixels: '1',
        },
      });
      break;
    } catch (err) {
      const msg = err.message || '';
      const m = msg.match(/"retry_after":\s*(\d+)/);
      if (m && attempt < 2) {
        const wait = (parseInt(m[1], 10) + 2) * 1000;
        console.log(`  rate-limited, waiting ${wait / 1000}s...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }

  const first = Array.isArray(output) ? output[0] : output;
  let raw;
  if (first && typeof first.blob === 'function') {
    const blob = await first.blob();
    raw = Buffer.from(await blob.arrayBuffer());
  } else if (typeof first === 'string') {
    const r = await fetch(first);
    if (!r.ok) throw new Error(`download failed: ${r.status}`);
    raw = Buffer.from(await r.arrayBuffer());
  } else {
    throw new Error(`unexpected output shape: ${typeof first}`);
  }

  // Resize to 1440x810 (2x retina for 720p hero), convert to WebP
  await sharp(raw)
    .resize(1440, 810, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(OUTPUT);

  const size = fs.statSync(OUTPUT).size;
  console.log(`  Done: ${(size / 1024).toFixed(0)}KB → ${OUTPUT}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
