import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import type { CreateRenderJobResult, RenderJobView, RetryRenderJobResult } from './render-job.shared'

async function currentUser() {
  const { readUser } = await import('@/features/auth/readUser.server')
  const user = await readUser()
  if (!user) throw redirect({ to: '/{-$locale}/login' })
  return user
}

export const listRenderJobsFn = createServerFn({ method: 'GET' }).handler(async (): Promise<RenderJobView[]> => {
  const { createDb } = await import('@/db/client')
  const { env } = await import('@/lib/env')
  const { scopeFromUser } = await import('@/db/scope')
  const { listRenderJobs } = await import('./render-job.server')
  const user = await currentUser()
  return listRenderJobs(createDb(env.DB), scopeFromUser(user.id))
})

export const createRenderJobFn = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data }): Promise<CreateRenderJobResult> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { scopeFromUser } = await import('@/db/scope')
    const { readRenderSubtitleOptions, validateRenderUpload } = await import('./render-job.shared')
    const { createRenderRecords, listRenderJobs, updateOwnedRenderJob } = await import('./render-job.server')
    const { localSmartClipBase, smartClipPhase, submitSmartClipTask } = await import('./local-smart-clip')
    const { agentBridgeConfigured } = await import('./render-agent.shared')
    const user = await currentUser()
    const scope = scopeFromUser(user.id)
    const db = createDb(env.DB)
    const file = data.get('file')
    const title = String(data.get('title') ?? '')
    if (!(file instanceof File)) return { ok: false, reason: 'noFile' }
    const reason = validateRenderUpload({ type: file.type, size: file.size, title })
    if (reason) return { ok: false, reason }
    const subtitle = readRenderSubtitleOptions({
      translationLanguage: data.get('subtitleTranslationLanguage'),
      animationId: data.get('subtitleAnimationId'),
    })
    if (!subtitle) return { ok: false, reason: 'subtitleOptions' }
    const smartClipBase = localSmartClipBase(env.SMART_CLIP_API_URL)
    const agentSecret = (env as unknown as { AGENT_SHARED_SECRET?: string }).AGENT_SHARED_SECRET
    if (!smartClipBase && !agentBridgeConfigured(agentSecret)) return { ok: false, reason: 'smartClip' }

    const record = await createRenderRecords(db, scope, {
      title, fileName: file.name.slice(0, 255), contentType: file.type,
      sizeBytes: file.size, subtitle, now: Date.now(),
    })
    try {
      await env.BUCKET.put(record.objectKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      })
      if (smartClipBase) {
        const sourceUrl = new URL(`/api/render-assets/${record.assetId}`, env.BETTER_AUTH_URL)
        sourceUrl.searchParams.set('token', record.sourceToken)
        const task = await submitSmartClipTask(smartClipBase, {
          jobId: record.jobId,
          sourceUrl: sourceUrl.toString(),
          title,
          account: { id: user.id, email: user.email, name: user.name },
          subtitle,
        })
        await updateOwnedRenderJob(db, scope, record.jobId, {
          rendererTaskId: task.taskId,
          status: task.status === -3 || task.status === -1 ? 'queued' : 'running',
          phase: smartClipPhase(task.status), error: null,
        }, Date.now())
      } else {
        await updateOwnedRenderJob(db, scope, record.jobId, {
          status: 'queued', phase: 'awaiting-agent', error: null,
        }, Date.now())
      }
    } catch (error) {
      await updateOwnedRenderJob(db, scope, record.jobId, {
        status: 'failed', phase: 'submit', error: error instanceof Error ? error.message : String(error),
      }, Date.now())
    }
    const jobs = await listRenderJobs(db, scope)
    return { ok: true, job: jobs.find((job) => job.id === record.jobId)! }
  })

export const retryRenderJobFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => ({ id: String(data.id ?? '') }))
  .handler(async ({ data }): Promise<RetryRenderJobResult> => {
    const { env } = await import('@/lib/env')
    const { createDb } = await import('@/db/client')
    const { scopeFromUser } = await import('@/db/scope')
    const { agentBridgeConfigured } = await import('./render-agent.shared')
    const { localSmartClipBase, smartClipPhase, submitSmartClipTask } = await import('./local-smart-clip')
    const {
      findOwnedRenderAsset,
      findOwnedRenderJob,
      listRenderJobs,
      retryOwnedRenderJob,
      updateOwnedRenderJob,
    } = await import('./render-job.server')
    const user = await currentUser()
    const scope = scopeFromUser(user.id)
    const db = createDb(env.DB)
    const jobs = () => listRenderJobs(db, scope)
    const smartClipBase = localSmartClipBase(env.SMART_CLIP_API_URL)
    const agentSecret = (env as unknown as { AGENT_SHARED_SECRET?: string }).AGENT_SHARED_SECRET
    if (!smartClipBase && !agentBridgeConfigured(agentSecret)) {
      return { ok: false, reason: 'smartClip', jobs: await jobs() }
    }
    const job = data.id.length > 0 ? await findOwnedRenderJob(db, scope, data.id) : null
    const asset = job ? await findOwnedRenderAsset(db, scope, job.assetId) : null
    const retried = data.id.length > 0 && await retryOwnedRenderJob(db, scope, data.id, Date.now())
    if (!retried || !job || !asset) {
      return { ok: false, reason: 'notRetryable', jobs: await jobs() }
    }
    if (!smartClipBase) return { ok: true, jobs: await jobs() }

    try {
      const sourceUrl = new URL(`/api/render-assets/${asset.id}`, env.BETTER_AUTH_URL)
      sourceUrl.searchParams.set('token', asset.sourceToken)
      const task = await submitSmartClipTask(smartClipBase, {
        jobId: job.id,
        retryToken: String(Date.now()),
        sourceUrl: sourceUrl.toString(),
        title: job.title,
        account: { id: user.id, email: user.email, name: user.name },
        subtitle: {
          translationLanguage: job.subtitleTranslationLanguage,
          animationId: job.subtitleAnimationId,
        },
      })
      await updateOwnedRenderJob(db, scope, job.id, {
        rendererTaskId: task.taskId,
        status: task.status === -3 || task.status === -1 ? 'queued' : 'running',
        phase: smartClipPhase(task.status),
        error: null,
      }, Date.now())
    } catch (error) {
      await updateOwnedRenderJob(db, scope, job.id, {
        status: 'failed',
        phase: 'submit',
        error: error instanceof Error ? error.message : String(error),
      }, Date.now())
      return { ok: false, reason: 'smartClip', jobs: await jobs() }
    }
    return { ok: true, jobs: await jobs() }
  })

export const syncRenderJobsFn = createServerFn({ method: 'POST' }).handler(async (): Promise<RenderJobView[]> => {
  const { env } = await import('@/lib/env')
  const { createDb } = await import('@/db/client')
  const { scopeFromUser } = await import('@/db/scope')
  const { renderJob } = await import('./render-job.schema')
  const { listRenderJobs, updateOwnedRenderJob } = await import('./render-job.server')
  const { localSmartClipBase, readSmartClipOutput, readSmartClipTask, smartClipPhase } = await import('./local-smart-clip')
  const { and, eq, inArray } = await import('drizzle-orm')
  const user = await currentUser()
  const scope = scopeFromUser(user.id)
  const db = createDb(env.DB)
  const smartClipBase = localSmartClipBase(env.SMART_CLIP_API_URL)
  if (!smartClipBase) return listRenderJobs(db, scope)

  const active = await db.select().from(renderJob).where(and(
    eq(renderJob.userId, user.id),
    inArray(renderJob.status, ['queued', 'running']),
  ))
  for (const job of active) {
    if (!job.rendererTaskId) continue
    try {
      const remote = await readSmartClipTask(smartClipBase, job.rendererTaskId)
      if (remote.status === 1) {
        if (!remote.outputMp4Url) throw new Error('Smart Clip completed without an output URL')
        const outputKey = `render-outputs/${user.id}/${job.id}/output.mp4`
        const output = await readSmartClipOutput(smartClipBase, remote.outputMp4Url)
        await env.BUCKET.put(outputKey, output, { httpMetadata: { contentType: 'video/mp4' } })
        await updateOwnedRenderJob(db, scope, job.id, {
          status: 'completed', phase: 'done', outputKey, error: null,
        }, Date.now())
      } else if (remote.status === 2) {
        await updateOwnedRenderJob(db, scope, job.id, {
          status: 'failed', phase: smartClipPhase(remote.status), error: remote.error ?? 'Smart Clip failed',
        }, Date.now())
      } else {
        await updateOwnedRenderJob(db, scope, job.id, {
          status: remote.status === -3 || remote.status === -1 ? 'queued' : 'running',
          phase: smartClipPhase(remote.status), error: null,
        }, Date.now())
      }
    } catch (error) {
      await updateOwnedRenderJob(db, scope, job.id, {
        phase: 'sync-error', error: error instanceof Error ? error.message : String(error),
      }, Date.now())
    }
  }
  return listRenderJobs(db, scope)
})
