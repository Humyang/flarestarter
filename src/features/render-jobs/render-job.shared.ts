export const MAX_RENDER_SOURCE_BYTES = 100 * 1024 * 1024
export const RENDER_JOB_STATUSES = ['submitting', 'queued', 'running', 'completed', 'failed'] as const
export type RenderJobStatus = (typeof RENDER_JOB_STATUSES)[number]

export interface RenderJobView {
  id: string
  title: string
  fileName: string
  status: RenderJobStatus
  phase: string | null
  error: string | null
  readyToDownload: boolean
  createdAt: string
  updatedAt: string
}

export type RenderUploadReason = 'noFile' | 'empty' | 'type' | 'size' | 'title' | 'smartClip'

export type CreateRenderJobResult =
  | { ok: true; job: RenderJobView }
  | { ok: false; reason: RenderUploadReason }

export function validateRenderUpload(input: { type: string; size: number; title: string }): RenderUploadReason | null {
  if (!input.title.trim() || input.title.trim().length > 120) return 'title'
  if (input.size <= 0) return 'empty'
  if (input.size > MAX_RENDER_SOURCE_BYTES) return 'size'
  if (input.type !== 'video/mp4') return 'type'
  return null
}
