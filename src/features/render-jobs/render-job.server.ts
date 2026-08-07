import { and, desc, eq } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { ownedBy, withOwner, type Scope } from '@/db/scope'
import { renderAsset, renderJob, type RenderJob } from './render-job.schema'
import type { RenderJobStatus, RenderJobView } from './render-job.shared'

export async function createRenderRecords(
  db: DB,
  scope: Scope,
  input: { title: string; fileName: string; contentType: string; sizeBytes: number; now: number },
) {
  const assetId = crypto.randomUUID()
  const jobId = crypto.randomUUID()
  const sourceToken = crypto.randomUUID()
  const objectKey = `render-assets/${scope.ownerId}/${assetId}/source.mp4`
  const now = new Date(input.now)
  await db.batch([
    db.insert(renderAsset).values(withOwner(scope, {
      id: assetId, objectKey, sourceToken, fileName: input.fileName,
      contentType: input.contentType, sizeBytes: input.sizeBytes, createdAt: now,
    })),
    db.insert(renderJob).values(withOwner(scope, {
      id: jobId, assetId, title: input.title.trim(), status: 'submitting',
      createdAt: now, updatedAt: now,
    })),
  ])
  return { assetId, jobId, sourceToken, objectKey }
}

export async function listRenderJobs(db: DB, scope: Scope): Promise<RenderJobView[]> {
  const rows = await db.select({ job: renderJob, fileName: renderAsset.fileName })
    .from(renderJob)
    .innerJoin(renderAsset, eq(renderJob.assetId, renderAsset.id))
    .where(ownedBy(renderJob, scope))
    .orderBy(desc(renderJob.createdAt))
  return rows.map(({ job, fileName }) => toView(job, fileName))
}

export async function findOwnedRenderJob(db: DB, scope: Scope, id: string): Promise<RenderJob | null> {
  const [job] = await db.select().from(renderJob)
    .where(and(ownedBy(renderJob, scope), eq(renderJob.id, id))).limit(1)
  return job ?? null
}

export async function updateOwnedRenderJob(
  db: DB,
  scope: Scope,
  id: string,
  values: Partial<{ rendererTaskId: string; status: RenderJobStatus; phase: string | null; outputKey: string; error: string | null }>,
  now: number,
): Promise<void> {
  await db.update(renderJob).set({ ...values, updatedAt: new Date(now) })
    .where(and(ownedBy(renderJob, scope), eq(renderJob.id, id)))
}

export async function retryOwnedRenderJob(db: DB, scope: Scope, id: string, now: number): Promise<boolean> {
  const retried = await db.update(renderJob).set({
    agentClaimToken: null,
    agentClaimExpiresAt: null,
    agentAttemptCount: 0,
    rendererTaskId: null,
    status: 'queued',
    phase: 'awaiting-agent',
    outputKey: null,
    error: null,
    updatedAt: new Date(now),
  }).where(and(
    ownedBy(renderJob, scope),
    eq(renderJob.id, id),
    eq(renderJob.status, 'failed'),
  )).returning({ id: renderJob.id })
  return retried.length === 1
}

export async function getAssetByToken(db: DB, id: string, token: string) {
  const [asset] = await db.select().from(renderAsset)
    .where(and(eq(renderAsset.id, id), eq(renderAsset.sourceToken, token))).limit(1)
  return asset ?? null
}

function toView(job: RenderJob, fileName: string): RenderJobView {
  return {
    id: job.id,
    title: job.title,
    fileName,
    status: job.status as RenderJobStatus,
    phase: job.phase,
    error: job.error,
    agentAttemptCount: job.agentAttemptCount,
    readyToDownload: job.status === 'completed' && !!job.outputKey,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date(job.updatedAt).toISOString(),
  }
}
