#!/usr/bin/env node
/**
 * Screen Audit Runner — thin dispatch to @blueforge-studio/screen-audit-runner.
 *
 * Usage:
 *   node screen-audit/run.mjs                           # all flows, desktop, light
 *   node screen-audit/run.mjs --flows site-landing      # specific flows by ID
 *   node screen-audit/run.mjs --tags critical,smoke      # flows tagged with tags
 *   node screen-audit/run.mjs --domains auth,marketing   # flows in specific domains
 *   node screen-audit/run.mjs --quick --full-page        # fast iteration mode
 *   node screen-audit/run.mjs --concurrency 3            # pool N warm browsers
 *   node screen-audit/run.mjs --cleanup                  # clean today's dir before run
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseCliArgs,
  discoverFlows,
  repoLabel,
  resolveResultsDir,
  resolveFlowsDir,
  runWithProgrammaticAPI,
  runWithCLI,
  performCleanup,
  logBanner,
  logSummary,
  filterFlowsByTagsAndDomains,
} from '@blueforge-studio/screen-audit-runner';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FLOWS_DIR = resolveFlowsDir(__dirname);
const RESULTS_DIR = resolveResultsDir(__dirname);
const DEFAULT_BASE_URL = process.env.APP_URL ?? process.env.SITE_URL ?? 'http://localhost:3000';

async function loadBlueForgeConfig(projectRoot) {
  const configPath = join(projectRoot, 'blueforge.config.ts');
  if (!existsSync(configPath)) return null;
  try {
    const raw = readFileSync(configPath, 'utf-8');
    let stripped = raw
      .replace(/^import\s+.*from\s+['"][^'"]+['"]\s*;?\n/gm, '')
      .replace(/^export\s+default\s+/m, '')
      .replace(/\s*as\s+const\s*;?\s*$/gm, '')
      .replace(/\bdefineConfig\s*\(\s*\{/g, '{')
      .replace(/\}\s*\)\s*;?\s*$/gm, '}')
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

async function main() {
  const opts = parseCliArgs(DEFAULT_BASE_URL);

  let appId = process.env.BLUEFORGE_APP_ID;
  if (!appId) {
    const cfg = await loadBlueForgeConfig(join(__dirname, '..'));
    appId = cfg?.project?.name ?? basename(process.cwd());
  }

  if (opts.cleanup) {
    console.log(`\nCleanup: ${opts.cleanup}`);
    performCleanup(__dirname, opts.cleanup);
    console.log();
  }

  let flowFiles = discoverFlows(FLOWS_DIR);
  if (flowFiles.length === 0) {
    console.error(`No flow files found in ${FLOWS_DIR}`);
    process.exit(1);
  }

  flowFiles = await filterFlowsByTagsAndDomains(flowFiles, opts.flowFilter, {
    tags: opts.tags,
    domains: opts.domains,
  });
  if (flowFiles.length === 0) {
    console.error('No flows match the given filters');
    process.exit(1);
  }

  const label = repoLabel(join(__dirname, '..'));
  logBanner(label, opts, flowFiles.length);
  console.log(`  App ID: ${appId}`);

  mkdirSync(RESULTS_DIR, { recursive: true });

  let results;
  try {
    results = await runWithProgrammaticAPI(flowFiles, opts, RESULTS_DIR);
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('  (screen-audit package not installed — falling back to CLI)\n');
      results = runWithCLI(flowFiles, opts);
    } else {
      throw err;
    }
  }

  const { summary, totalPass, totalFail, totalWarn } = results;

  const summaryPath = join(RESULTS_DIR, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify({
    repo: label,
    baseUrl: opts.baseUrl,
    devices: opts.deviceNames,
    theme: opts.theme,
    startedAt: new Date().toISOString(),
    totalFlows: flowFiles.length,
    passed: totalPass,
    failed: totalFail,
    warnings: totalWarn,
    flows: summary,
  }, null, 2));

  logSummary({ totalPass, totalFail, totalWarn }, RESULTS_DIR, summaryPath);

  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
