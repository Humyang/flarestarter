import { and, eq, inArray } from 'drizzle-orm'
import { createDb } from '@/db/client'
import { renderAsset, renderJob } from './render-job.schema'

interface RenderAssetBindings {
  DB: D1Database
  BUCKET: R2Bucket
}

export async function handleRenderAssetRequest(request: Request, bindings: RenderAssetBindings): Promise<Response> {
  const url = new URL(request.url)
  const id = decodeURIComponent(url.pathname.split('/').pop() ?? '')
  const token = url.searchParams.get('token') ?? ''
  const [row] = await createDb(bindings.DB).select({ asset: renderAsset })
    .from(renderAsset)
    .innerJoin(renderJob, eq(renderJob.assetId, renderAsset.id))
    .where(and(
      eq(renderAsset.id, id),
      eq(renderAsset.sourceToken, token),
      inArray(renderJob.status, ['submitting', 'queued', 'running']),
    )).limit(1)
  if (!row) return new Response('Not found', { status: 404 })
  const object = await bindings.BUCKET.get(row.asset.objectKey)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers({
    'Content-Type': row.asset.contentType,
    'Content-Length': String(object.size),
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  return new Response(object.body, { headers })
}
