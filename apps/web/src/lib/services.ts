/**
 * Centralized service initialization via @blueforge-studio/service-factory.
 *
 * Each factory reads its config from environment variables.
 * Set PROVIDER vars to choose backends, e.g.:
 *   DATABASE_PROVIDER=postgres  CACHE_PROVIDER=ioredis  QUEUE_PROVIDER=bullmq
 *   STORAGE_PROVIDER=minio      EMAIL_PROVIDER=mailstack GIT_PROVIDER=forge-git
 *   ERROR_TRACKER_PROVIDER=self-hosted
 */

import {
  createDatabaseService,
  createCacheService,
  createQueueService,
  createStorageService,
  createEmailService,
  createGitService,
  createErrorTracker,
} from '@blueforge-studio/service-factory'

// ---------------------------------------------------------------------------
// Database (Postgres)
// ---------------------------------------------------------------------------

export const db = createDatabaseService()

// ---------------------------------------------------------------------------
// Cache (Redis via ioredis)
// ---------------------------------------------------------------------------

export const cache = createCacheService()

// ---------------------------------------------------------------------------
// Queue (BullMQ)
// ---------------------------------------------------------------------------

export const queue = createQueueService()

// ---------------------------------------------------------------------------
// Storage (MinIO)
// ---------------------------------------------------------------------------

export const storage = createStorageService()

// ---------------------------------------------------------------------------
// Email (Mailstack)
// ---------------------------------------------------------------------------

export const email = createEmailService()

// ---------------------------------------------------------------------------
// Git (forge-git adapter — wraps Gitea API)
// ---------------------------------------------------------------------------

export const git = createGitService()

// ---------------------------------------------------------------------------
// Error Tracker (self-hosted)
// ---------------------------------------------------------------------------

export const errorTracker = createErrorTracker()
