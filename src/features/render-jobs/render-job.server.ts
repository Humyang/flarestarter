import { and, desc, eq } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { ownedBy, withOwner, type Scope } from '@/db/scope'
import { renderAsset, renderJob, type RenderJob } from './render-job.schema'
import {
  DEFAULT_SUBTITLE_ANIMATION_ID,
  SUBTITLE_ANIMATION_IDS,
  SUBTITLE_TRANSLATION_LANGUAGES,
  type RenderJobStatus,
  type RenderJobView,
  type RenderSubtitleOptions,
  type SubtitleAnimationId,
  type SubtitleTranslationLanguage,
} from './render-job.shared'

export async function createRenderRecords(
  db: DB,
  scope: Scope,
  input: {
    title: string
    fileName: string
    contentType: string
    sizeBytes: number
    subtitle: RenderSubtitleOptions
    now: number
  },
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
      subtitleTranslationLanguage: input.subtitle.translationLanguage,
      subtitleAnimationId: input.subtitle.animationId,
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

export async function findOwnedRenderAsset(db: DB, scope: Scope, id: string) {
  const [asset] = await db.select().from(renderAsset)
    .where(and(ownedBy(renderAsset, scope), eq(renderAsset.id, id))).limit(1)
  return asset ?? null
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
  const translationLanguage = SUBTITLE_TRANSLATION_LANGUAGES.includes(
    job.subtitleTranslationLanguage as SubtitleTranslationLanguage,
  ) ? job.subtitleTranslationLanguage as SubtitleTranslationLanguage : 'original'
  const animationId = SUBTITLE_ANIMATION_IDS.includes(job.subtitleAnimationId as SubtitleAnimationId)
    ? job.subtitleAnimationId as SubtitleAnimationId
    : DEFAULT_SUBTITLE_ANIMATION_ID
  return {
    id: job.id,
    title: job.title,
    fileName,
    status: job.status as RenderJobStatus,
    phase: job.phase,
    error: job.error,
    agentAttemptCount: job.agentAttemptCount,
    subtitleTranslationLanguage: translationLanguage,
    subtitleAnimationId: animationId,
    readyToDownload: job.status === 'completed' && !!job.outputKey,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date(job.updatedAt).toISOString(),
  }
}
