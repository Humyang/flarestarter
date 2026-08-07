import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { user } from '@/features/auth/auth.schema'
import { renderAsset, renderJob } from './render-job.schema'
import type { RenderAgentClaim, RenderAgentStatusInput } from './render-agent.shared'

interface ClaimedJob {
  id: string
  userId: string
  claimToken: string
  outputKey: string | null
  status: string
}

export async function claimNextAgentJob(db: DB, sourceOrigin: string, now: number): Promise<RenderAgentClaim | null> {
  const candidates = await db.select({
    id: renderJob.id,
    userId: renderJob.userId,
    title: renderJob.title,
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
    const claimed = await db.update(renderJob).set({
      agentClaimToken: claimToken,
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
      title: candidate.title,
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
  const updated = await db.update(renderJob).set({
    status: input.status,
    phase: input.phase,
    error: input.status === 'failed' ? input.error ?? 'Smart Clip agent failed' : null,
    ...(input.rendererTaskId ? { rendererTaskId: input.rendererTaskId } : {}),
    updatedAt: new Date(now),
  }).where(and(
    eq(renderJob.id, id),
    eq(renderJob.agentClaimToken, input.claimToken),
    inArray(renderJob.status, ['queued', 'running']),
  )).returning({ id: renderJob.id })
  return updated.length === 1
}

export async function completeClaimedAgentJob(
  db: DB,
  id: string,
  claimToken: string,
  outputKey: string,
  now: number,
): Promise<boolean> {
  const updated = await db.update(renderJob).set({
    status: 'completed',
    phase: 'done',
    outputKey,
    error: null,
    updatedAt: new Date(now),
  }).where(and(
    eq(renderJob.id, id),
    eq(renderJob.agentClaimToken, claimToken),
    inArray(renderJob.status, ['queued', 'running']),
  )).returning({ id: renderJob.id })
  return updated.length === 1
}
