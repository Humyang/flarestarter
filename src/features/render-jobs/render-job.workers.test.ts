import { beforeEach, expect, test } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import { scopeFromUser } from '@/db/scope'
import { createRenderRecords, findOwnedRenderJob, listRenderJobs, updateOwnedRenderJob } from './render-job.server'

beforeEach(async () => {
  const statements = [
    'DROP TABLE IF EXISTS render_job',
    'DROP TABLE IF EXISTS render_asset',
    'DROP TABLE IF EXISTS user',
    'CREATE TABLE user (id TEXT PRIMARY KEY NOT NULL)',
    `CREATE TABLE render_asset (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
      source_token TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, content_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL, created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE render_job (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, asset_id TEXT NOT NULL,
      agent_claim_token TEXT UNIQUE, renderer_task_id TEXT UNIQUE, title TEXT NOT NULL, status TEXT NOT NULL, phase TEXT,
      output_key TEXT, error TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES render_asset(id) ON DELETE CASCADE
    )`,
    "INSERT INTO user (id) VALUES ('user-a'), ('user-b')",
  ]
  await env.DB.batch(statements.map((sql) => env.DB.prepare(sql)))
})

test('creates an owned asset/job pair and hides it from another user', async () => {
  const db = createDb(env.DB)
  const owner = scopeFromUser('user-a')
  const other = scopeFromUser('user-b')
  const record = await createRenderRecords(db, owner, {
    title: ' Demo ', fileName: 'source.mp4', contentType: 'video/mp4', sizeBytes: 1234, now: 1000,
  })

  expect(await listRenderJobs(db, owner)).toMatchObject([{ id: record.jobId, title: 'Demo', status: 'submitting' }])
  expect(await listRenderJobs(db, other)).toEqual([])
  expect(await findOwnedRenderJob(db, other, record.jobId)).toBeNull()

  await updateOwnedRenderJob(db, owner, record.jobId, {
    rendererTaskId: `flare-${record.jobId}`, status: 'completed', phase: 'done', outputKey: 'out.mp4',
  }, 2000)
  expect(await listRenderJobs(db, owner)).toMatchObject([{ status: 'completed', readyToDownload: true }])
})
