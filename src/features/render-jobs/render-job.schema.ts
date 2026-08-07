import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from '@/features/auth/auth.schema'

export const renderAsset = sqliteTable('render_asset', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  objectKey: text('object_key').notNull().unique(),
  sourceToken: text('source_token').notNull().unique(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [index('render_asset_user_id_idx').on(t.userId)])

export const renderJob = sqliteTable('render_job', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => renderAsset.id, { onDelete: 'cascade' }),
  agentClaimToken: text('agent_claim_token'),
  agentClaimExpiresAt: integer('agent_claim_expires_at', { mode: 'timestamp_ms' }),
  agentAttemptCount: integer('agent_attempt_count').notNull().default(0),
  rendererTaskId: text('renderer_task_id'),
  title: text('title').notNull(),
  status: text('status').notNull(),
  phase: text('phase'),
  outputKey: text('output_key'),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [
  index('render_job_user_id_idx').on(t.userId),
  index('render_job_asset_id_idx').on(t.assetId),
  uniqueIndex('render_job_agent_claim_token_uidx').on(t.agentClaimToken),
  uniqueIndex('render_job_renderer_task_id_uidx').on(t.rendererTaskId),
])

export type RenderJob = typeof renderJob.$inferSelect
