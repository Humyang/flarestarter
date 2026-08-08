import { and, asc, eq, gt, isNotNull, isNull, lte, lt, sql } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { user } from '@/features/auth/auth.schema'
import { renderAsset, renderJob } from './render-job.schema'
import {
  AGENT_LEASE_DURATION_MS,
  MAX_AGENT_ATTEMPTS,
  type RenderAgentClaim,
  type RenderAgentStatusInput,
} from './render-agent.shared'

interface ClaimedJob {
  id: string
  userId: string
  claimToken: string
  claimExpiresAt: Date | null
  outputKey: string | null
  status: string
}

function leaseExpiry(now: number): Date {
  return new Date(now + AGENT_LEASE_DURATION_MS)
}

export async function recoverExpiredAgentJobs(db: DB, now: number): Promise<{ failed: number; requeued: number }> {
  const expiredAt = new Date(now)
  const failed = await db.update(renderJob).set({
    agentClaimToken: null,
    agentClaimExpiresAt: null,
    rendererTaskId: null,
    status: 'failed',
    phase: 'agent-timeout',
    outputKey: null,
    error: 'The local processing agent stopped responding after multiple recovery attempts.',
    updatedAt: expiredAt,
  }).where(and(
    eq(renderJob.status, 'running'),
    isNotNull(renderJob.agentClaimToken),
    lte(renderJob.agentClaimExpiresAt, expiredAt),
    sql`${renderJob.agentAttemptCount} >= ${MAX_AGENT_ATTEMPTS}`,
  )).returning({ id: renderJob.id })

  const requeued = await db.update(renderJob).set({
    agentClaimToken: null,
    agentClaimExpiresAt: null,
    rendererTaskId: null,
    status: 'queued',
    phase: 'awaiting-agent',
    outputKey: null,
    error: null,
    updatedAt: expiredAt,
  }).where(and(
    eq(renderJob.status, 'running'),
    isNotNull(renderJob.agentClaimToken),
    lte(renderJob.agentClaimExpiresAt, expiredAt),
    lt(renderJob.agentAttemptCount, MAX_AGENT_ATTEMPTS),
  )).returning({ id: renderJob.id })

  return { failed: failed.length, requeued: requeued.length }
}

export async function claimNextAgentJob(db: DB, sourceOrigin: string, now: number): Promise<RenderAgentClaim | null> {
  await recoverExpiredAgentJobs(db, now)
  const candidates = await db.select({
    id: renderJob.id,
    userId: renderJob.userId,
    title: renderJob.title,
    subtitleTranslationLanguage: renderJob.subtitleTranslationLanguage,
    subtitleAnimationId: renderJob.subtitleAnimationId,
    assetId: renderAsset.id,
    sourceToken: renderAsset.sourceToken,
    fileName: renderAsset.fileName,
    contentType: renderAsset.contentType,
    sizeBytes: renderAsset.sizeBytes,
    accountEmail: user.email,
    accountName: user.name,
  }).from(renderJob)
    .innerJoin(renderAsset, eq(renderAsset.id, renderJob.assetId))
    .innerJoin(user, eq(user.id, renderJob.userId))
    .where(and(
      eq(renderJob.status, 'queued'),
      eq(renderJob.phase, 'awaiting-agent'),
      isNull(renderJob.agentClaimToken),
    ))
    .orderBy(asc(renderJob.createdAt))
    .limit(5)

  for (const candidate of candidates) {
    const claimToken = crypto.randomUUID()
    const claimExpiresAt = leaseExpiry(now)
    const claimed = await db.update(renderJob).set({
      agentClaimToken: claimToken,
      agentClaimExpiresAt: claimExpiresAt,
      agentAttemptCount: sql`${renderJob.agentAttemptCount} + 1`,
      status: 'running',
      phase: 'agent-claimed',
      error: null,
      updatedAt: new Date(now),
    }).where(and(
      eq(renderJob.id, candidate.id),
      eq(renderJob.status, 'queued'),
      eq(renderJob.phase, 'awaiting-agent'),
      isNull(renderJob.agentClaimToken),
    )).returning({ id: renderJob.id })
    if (!claimed.length) continue

    const sourceUrl = new URL(`/api/render-assets/${encodeURIComponent(candidate.assetId)}`, sourceOrigin)
    sourceUrl.searchParams.set('token', candidate.sourceToken)
    return {
      id: candidate.id,
      claimToken,
      leaseExpiresAt: claimExpiresAt.toISOString(),
      title: candidate.title,
      subtitle: {
        translationLanguage: candidate.subtitleTranslationLanguage,
        animationId: candidate.subtitleAnimationId,
      },
      account: {
        id: candidate.userId,
        email: candidate.accountEmail,
        name: candidate.accountName,
      },
      source: {
        url: sourceUrl.toString(),
        fileName: candidate.fileName,
        contentType: candidate.contentType,
        sizeBytes: candidate.sizeBytes,
      },
    }
  }
  return null
}

export async function findClaimedAgentJob(db: DB, id: string, claimToken: string): Promise<ClaimedJob | null> {
  const [job] = await db.select({
    id: renderJob.id,
    userId: renderJob.userId,
    claimToken: renderJob.agentClaimToken,
    claimExpiresAt: renderJob.agentClaimExpiresAt,
    outputKey: renderJob.outputKey,
    status: renderJob.status,
  }).from(renderJob).where(and(
    eq(renderJob.id, id),
    eq(renderJob.agentClaimToken, claimToken),
  )).limit(1)
  if (!job?.claimToken) return null
  return { ...job, claimToken: job.claimToken }
}

export async function updateClaimedAgentJob(
  db: DB,
  id: string,
  input: RenderAgentStatusInput,
  now: number,
): Promise<boolean> {
  const nowDate = new Date(now)
  const updated = await db.update(renderJob).set({
    status: input.status,
    phase: input.phase,
    agentClaimExpiresAt: input.status === 'running' ? leaseExpiry(now) : null,
    error: input.status === 'failed' ? input.error ?? 'Smart Clip agent failed' : null,
    ...(input.rendererTaskId ? { rendererTaskId: input.rendererTaskId } : {}),
    updatedAt: new Date(now),
  }).where(and(
    eq(renderJob.id, id),
    eq(renderJob.agentClaimToken, input.claimToken),
    eq(renderJob.status, 'running'),
    gt(renderJob.agentClaimExpiresAt, nowDate),
  )).returning({ id: renderJob.id })
  return updated.length === 1
}

export async function renewClaimedAgentJob(
  db: DB,
  id: string,
  claimToken: string,
  now: number,
): Promise<boolean> {
  const nowDate = new Date(now)
  const renewed = await db.update(renderJob).set({
    agentClaimExpiresAt: leaseExpiry(now),
    updatedAt: nowDate,
  }).where(and(
    eq(renderJob.id, id),
    eq(renderJob.agentClaimToken, claimToken),
    eq(renderJob.status, 'running'),
    gt(renderJob.agentClaimExpiresAt, nowDate),
  )).returning({ id: renderJob.id })
  return renewed.length === 1
}

export async function completeClaimedAgentJob(
  db: DB,
  id: string,
  claimToken: string,
  outputKey: string,
  now: number,
): Promise<boolean> {
  const nowDate = new Date(now)
  const updated = await db.update(renderJob).set({
    status: 'completed',
    phase: 'done',
    agentClaimExpiresAt: null,
    outputKey,
    error: null,
    updatedAt: new Date(now),
  }).where(and(
    eq(renderJob.id, id),
    eq(renderJob.agentClaimToken, claimToken),
    eq(renderJob.status, 'running'),
    gt(renderJob.agentClaimExpiresAt, nowDate),
  )).returning({ id: renderJob.id })
  return updated.length === 1
}
