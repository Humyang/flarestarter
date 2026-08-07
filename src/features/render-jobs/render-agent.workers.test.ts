import { beforeEach, expect, test } from 'vitest'
import { env } from 'cloudflare:test'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db/client'
import { scopeFromUser } from '@/db/scope'
import { handleRenderAgentRequest } from './render-agent.api'
import { handleRenderAssetRequest } from './render-asset.api'
import { claimNextAgentJob, recoverExpiredAgentJobs, renewClaimedAgentJob } from './render-agent.server'
import { createRenderRecords, updateOwnedRenderJob } from './render-job.server'
import { renderJob } from './render-job.schema'

const secret = 'test-agent-secret-that-is-at-least-32-characters'
const authorization = { authorization: `Bearer ${secret}` }

beforeEach(async () => {
  const statements = [
    'DROP TABLE IF EXISTS render_job',
    'DROP TABLE IF EXISTS render_asset',
    'DROP TABLE IF EXISTS user',
    'CREATE TABLE user (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE)',
    `CREATE TABLE render_asset (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
      source_token TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, content_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL, created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE render_job (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, asset_id TEXT NOT NULL,
      agent_claim_token TEXT UNIQUE, agent_claim_expires_at INTEGER, agent_attempt_count INTEGER NOT NULL DEFAULT 0,
      renderer_task_id TEXT UNIQUE, title TEXT NOT NULL, status TEXT NOT NULL, phase TEXT,
      output_key TEXT, error TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES render_asset(id) ON DELETE CASCADE
    )`,
    "INSERT INTO user (id, name, email) VALUES ('user-a', 'User A', 'a@example.com')",
  ]
  await env.DB.batch(statements.map((sql) => env.DB.prepare(sql)))
})

async function queueJob() {
  const db = createDb(env.DB)
  const scope = scopeFromUser('user-a')
  const record = await createRenderRecords(db, scope, {
    title: 'Cloud render', fileName: 'source.mp4', contentType: 'video/mp4', sizeBytes: 6, now: 1000,
  })
  await env.BUCKET.put(record.objectKey, 'source')
  await updateOwnedRenderJob(db, scope, record.jobId, {
    status: 'queued', phase: 'awaiting-agent', error: null,
  }, 1100)
  return record
}

test('authenticates, claims once, reports progress, and uploads the output', async () => {
  const record = await queueJob()
  const bindings = { DB: env.DB, BUCKET: env.BUCKET, AGENT_SHARED_SECRET: secret }

  const unauthorized = await handleRenderAgentRequest(
    new Request('https://dve2.com/api/render-agent/claim', { method: 'POST' }),
    bindings,
  )
  expect(unauthorized.status).toBe(401)

  const claimResponse = await handleRenderAgentRequest(new Request(
    'https://dve2.com/api/render-agent/claim', { method: 'POST', headers: authorization },
  ), bindings)
  const claimBody = await claimResponse.json() as {
    job: { id: string; claimToken: string; account: { email: string }; source: { url: string } }
  }
  expect(claimBody.job).toMatchObject({
    id: record.jobId,
    account: { email: 'a@example.com' },
  })
  expect(claimBody.job.source.url).toContain(`/api/render-assets/${record.assetId}?token=`)

  const emptyClaim = await handleRenderAgentRequest(new Request(
    'https://dve2.com/api/render-agent/claim', { method: 'POST', headers: authorization },
  ), bindings)
  await expect(emptyClaim.json()).resolves.toEqual({ job: null })

  const source = await handleRenderAssetRequest(new Request(claimBody.job.source.url), bindings)
  expect(source.status).toBe(200)
  expect(new TextDecoder().decode(await source.arrayBuffer())).toBe('source')

  const heartbeat = await handleRenderAgentRequest(new Request(
    `https://dve2.com/api/render-agent/jobs/${record.jobId}/heartbeat`, {
      method: 'POST',
      headers: { ...authorization, 'content-type': 'application/json' },
      body: JSON.stringify({ claimToken: claimBody.job.claimToken }),
    },
  ), bindings)
  expect(heartbeat.status).toBe(200)

  const progress = await handleRenderAgentRequest(new Request(
    `https://dve2.com/api/render-agent/jobs/${record.jobId}/status`, {
      method: 'POST',
      headers: { ...authorization, 'content-type': 'application/json' },
      body: JSON.stringify({
        claimToken: claimBody.job.claimToken,
        status: 'running',
        phase: 'rendering',
        rendererTaskId: 'ct_cloud_1',
      }),
    },
  ), bindings)
  expect(progress.status).toBe(200)

  const output = await handleRenderAgentRequest(new Request(
    `https://dve2.com/api/render-agent/jobs/${record.jobId}/output`, {
      method: 'PUT',
      headers: {
        ...authorization,
        'content-type': 'video/mp4',
        'x-agent-claim-token': claimBody.job.claimToken,
        'content-length': String(new TextEncoder().encode('rendered-video').byteLength),
      },
      body: 'rendered-video',
    },
  ), bindings)
  expect(output.status).toBe(200)

  const [job] = await createDb(env.DB).select().from(renderJob).where(eq(renderJob.id, record.jobId))
  expect(job).toMatchObject({ status: 'completed', phase: 'done', rendererTaskId: 'ct_cloud_1' })
  const storedOutput = await env.BUCKET.get(job!.outputKey!)
  expect(new TextDecoder().decode(await storedOutput!.arrayBuffer())).toBe('rendered-video')
  expect((await handleRenderAssetRequest(new Request(claimBody.job.source.url), bindings)).status).toBe(404)

  const duplicate = await handleRenderAgentRequest(new Request(
    `https://dve2.com/api/render-agent/jobs/${record.jobId}/output`, {
      method: 'PUT',
      headers: {
        ...authorization,
        'content-type': 'video/mp4',
        'x-agent-claim-token': claimBody.job.claimToken,
      },
      body: 'duplicate',
    },
  ), bindings)
  expect(duplicate.status).toBe(200)
  const outputAfterDuplicate = await env.BUCKET.get(job!.outputKey!)
  expect(new TextDecoder().decode(await outputAfterDuplicate!.arrayBuffer())).toBe('rendered-video')
})

test('rejects another claim token and hides the API when no secret is configured', async () => {
  const record = await queueJob()
  const bindings = { DB: env.DB, BUCKET: env.BUCKET, AGENT_SHARED_SECRET: secret }
  const claimResponse = await handleRenderAgentRequest(new Request(
    'https://dve2.com/api/render-agent/claim', { method: 'POST', headers: authorization },
  ), bindings)
  expect(claimResponse.status).toBe(200)

  const wrongToken = await handleRenderAgentRequest(new Request(
    `https://dve2.com/api/render-agent/jobs/${record.jobId}/status`, {
      method: 'POST',
      headers: { ...authorization, 'content-type': 'application/json' },
      body: JSON.stringify({ claimToken: 'wrong', status: 'running', phase: 'rendering' }),
    },
  ), bindings)
  expect(wrongToken.status).toBe(409)

  const hidden = await handleRenderAgentRequest(new Request(
    'https://dve2.com/api/render-agent/claim', { method: 'POST', headers: authorization },
  ), { DB: env.DB, BUCKET: env.BUCKET })
  expect(hidden.status).toBe(404)
})

test('requires a positive Content-Length before accepting rendered output', async () => {
  const record = await queueJob()
  const bindings = { DB: env.DB, BUCKET: env.BUCKET, AGENT_SHARED_SECRET: secret }
  const claimResponse = await handleRenderAgentRequest(new Request(
    'https://dve2.com/api/render-agent/claim', { method: 'POST', headers: authorization },
  ), bindings)
  const claim = await claimResponse.json() as { job: { claimToken: string } }

  const output = await handleRenderAgentRequest(new Request(
    `https://dve2.com/api/render-agent/jobs/${record.jobId}/output`, {
      method: 'PUT',
      headers: {
        ...authorization,
        'content-type': 'video/mp4',
        'x-agent-claim-token': claim.job.claimToken,
      },
      body: '',
    },
  ), bindings)
  expect(output.status).toBe(411)

  const [job] = await createDb(env.DB).select().from(renderJob).where(eq(renderJob.id, record.jobId))
  expect(job).toMatchObject({ status: 'running', phase: 'agent-claimed', outputKey: null })
})

test('reclaims an expired lease, fences the old agent, and increments attempts', async () => {
  const record = await queueJob()
  const db = createDb(env.DB)
  const first = await claimNextAgentJob(db, 'https://dve2.com', 1000)
  expect(first).toMatchObject({ id: record.jobId, leaseExpiresAt: new Date(1000 + 120_000).toISOString() })

  await db.update(renderJob).set({ agentClaimExpiresAt: new Date(0) }).where(eq(renderJob.id, record.jobId))
  await expect(recoverExpiredAgentJobs(db, 3000)).resolves.toMatchObject({ requeued: 1, failed: 0 })
  await expect(renewClaimedAgentJob(db, record.jobId, first!.claimToken, 4000)).resolves.toBe(false)

  const second = await claimNextAgentJob(db, 'https://dve2.com', 5000)
  expect(second).toMatchObject({ id: record.jobId })
  const [job] = await db.select().from(renderJob).where(eq(renderJob.id, record.jobId))
  expect(job).toMatchObject({ status: 'running', phase: 'agent-claimed', agentAttemptCount: 2 })
})

test('fails a job after the maximum number of expired lease recoveries', async () => {
  const record = await queueJob()
  const db = createDb(env.DB)
  await claimNextAgentJob(db, 'https://dve2.com', 1000)
  await db.update(renderJob).set({ agentClaimExpiresAt: new Date(0), agentAttemptCount: 3 }).where(eq(renderJob.id, record.jobId))

  await expect(recoverExpiredAgentJobs(db, 3000)).resolves.toMatchObject({ requeued: 0, failed: 1 })
  const [job] = await db.select().from(renderJob).where(eq(renderJob.id, record.jobId))
  expect(job).toMatchObject({
    status: 'failed', phase: 'agent-timeout', agentClaimToken: null, agentClaimExpiresAt: null,
  })
})
