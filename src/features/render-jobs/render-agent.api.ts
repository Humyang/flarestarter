import { createDb } from '@/db/client'
import {
  AGENT_CLAIM_TOKEN_HEADER,
  MAX_RENDER_OUTPUT_BYTES,
  authenticateAgentRequest,
  readAgentStatusInput,
} from './render-agent.shared'
import {
  claimNextAgentJob,
  completeClaimedAgentJob,
  findClaimedAgentJob,
  renewClaimedAgentJob,
  updateClaimedAgentJob,
} from './render-agent.server'

export interface RenderAgentBindings {
  DB: D1Database
  BUCKET: R2Bucket
  AGENT_SHARED_SECRET?: string
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function jobRoute(pathname: string): { id: string; action: 'heartbeat' | 'status' | 'output' } | null {
  const match = pathname.match(/^\/api\/render-agent\/jobs\/([^/]+)\/(heartbeat|status|output)$/)
  if (!match) return null
  try {
    return { id: decodeURIComponent(match[1]!), action: match[2]! as 'heartbeat' | 'status' | 'output' }
  } catch {
    return null
  }
}

export async function handleRenderAgentRequest(request: Request, bindings: RenderAgentBindings): Promise<Response> {
  const secret = bindings.AGENT_SHARED_SECRET?.trim()
  if (!secret) return new Response('Not found', { status: 404 })
  if (!await authenticateAgentRequest(request, secret)) return json({ error: 'Unauthorized' }, 401)

  const url = new URL(request.url)
  const db = createDb(bindings.DB)
  if (request.method === 'POST' && url.pathname === '/api/render-agent/claim') {
    const job = await claimNextAgentJob(db, url.origin, Date.now())
    return json({ job })
  }

  const route = jobRoute(url.pathname)
  if (!route) return json({ error: 'Not found' }, 404)

  if (request.method === 'POST' && route.action === 'heartbeat') {
    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }
    const claimToken = typeof (raw as { claimToken?: unknown })?.claimToken === 'string'
      ? (raw as { claimToken: string }).claimToken
      : ''
    if (!claimToken || claimToken.length > 128) return json({ error: 'Invalid heartbeat' }, 400)
    const renewed = await renewClaimedAgentJob(db, route.id, claimToken, Date.now())
    return renewed ? json({ ok: true }) : json({ error: 'Claim is no longer active' }, 409)
  }

  if (request.method === 'POST' && route.action === 'status') {
    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }
    const input = readAgentStatusInput(raw)
    if (!input) return json({ error: 'Invalid status update' }, 400)
    const updated = await updateClaimedAgentJob(db, route.id, input, Date.now())
    return updated ? json({ ok: true }) : json({ error: 'Claim is no longer active' }, 409)
  }

  if (request.method === 'PUT' && route.action === 'output') {
    const claimToken = request.headers.get(AGENT_CLAIM_TOKEN_HEADER) ?? ''
    if (!claimToken) return json({ error: 'Missing claim token' }, 400)
    const job = await findClaimedAgentJob(db, route.id, claimToken)
    if (!job) return json({ error: 'Claim is no longer active' }, 409)
    if (job.status === 'completed' && job.outputKey) return json({ ok: true, completed: true })
    if (!['queued', 'running'].includes(job.status)) return json({ error: 'Claim is no longer active' }, 409)
    if (!job.claimExpiresAt || job.claimExpiresAt.getTime() <= Date.now()) {
      return json({ error: 'Claim is no longer active' }, 409)
    }
    if (!request.body) return json({ error: 'Missing video body' }, 400)
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'video/mp4') {
      return json({ error: 'Output must be video/mp4' }, 415)
    }
    const rawContentLength = request.headers.get('content-length')
    const contentLength = Number(rawContentLength)
    if (!rawContentLength || !Number.isSafeInteger(contentLength) || contentLength <= 0) {
      return json({ error: 'Output requires a positive Content-Length' }, 411)
    }
    if (contentLength > MAX_RENDER_OUTPUT_BYTES) {
      return json({ error: 'Output is too large' }, 413)
    }

    const outputKey = `render-outputs/${job.userId}/${job.id}/output.mp4`
    const output = new FixedLengthStream(contentLength)
    try {
      await Promise.all([
        request.body.pipeTo(output.writable),
        bindings.BUCKET.put(outputKey, output.readable, { httpMetadata: { contentType: 'video/mp4' } }),
      ])
    } catch (error) {
      await bindings.BUCKET.delete(outputKey).catch(() => undefined)
      return json({ error: 'Output size does not match Content-Length' }, 400)
    }
    const completed = await completeClaimedAgentJob(db, job.id, claimToken, outputKey, Date.now())
    return completed ? json({ ok: true, completed: true }) : json({ error: 'Claim is no longer active' }, 409)
  }

  return json({ error: 'Method not allowed' }, 405)
}
