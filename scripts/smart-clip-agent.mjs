#!/usr/bin/env node

import { createWriteStream, openAsBlob } from 'node:fs'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const requireEnv = (name) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

const readSharedSecret = () => {
  const configured = process.env.AGENT_SHARED_SECRET?.trim()
  if (configured) return configured
  if (process.platform === 'darwin') {
    const service = process.env.AGENT_KEYCHAIN_SERVICE?.trim() || 'dve2-smart-clip-agent'
    try {
      return execFileSync('/usr/bin/security', ['find-generic-password', '-s', service, '-w'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    } catch {
      // Fall through to the actionable configuration error used on other platforms.
    }
  }
  throw new Error('AGENT_SHARED_SECRET is required (or store it in the macOS dve2-smart-clip-agent keychain item)')
}

const normalizeFlareBase = (raw) => {
  const url = new URL(raw)
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('FLARE_BASE_URL must use HTTPS (HTTP is allowed only for localhost)')
  }
  if (url.username || url.password || url.search || url.hash) throw new Error('FLARE_BASE_URL is invalid')
  return url.toString().replace(/\/$/, '')
}

const normalizeSmartClipBase = (raw) => {
  const url = new URL(raw)
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error('SMART_CLIP_API_URL must be a loopback HTTP URL')
  }
  if (url.username || url.password || url.search || url.hash) throw new Error('SMART_CLIP_API_URL is invalid')
  return url.toString().replace(/\/$/, '')
}

const flareBase = normalizeFlareBase(requireEnv('FLARE_BASE_URL'))
const smartClipBase = normalizeSmartClipBase(process.env.SMART_CLIP_API_URL?.trim() || 'http://127.0.0.1:7706/v1/ai-cut')
const sharedSecret = readSharedSecret()
if (sharedSecret.length < 32) throw new Error('AGENT_SHARED_SECRET must be at least 32 characters')

const pollIntervalMs = Math.max(1000, Number(process.env.AGENT_POLL_INTERVAL_MS || 5000))
const taskPollIntervalMs = Math.max(1000, Number(process.env.SMART_CLIP_POLL_INTERVAL_MS || 3000))
const leaseHeartbeatMs = Math.max(5000, Number(process.env.AGENT_HEARTBEAT_INTERVAL_MS || 30_000))
const maxSourceBytes = 100 * 1024 * 1024
const maxOutputBytes = 500 * 1024 * 1024
const requestTimeoutMs = Math.max(10_000, Number(process.env.AGENT_REQUEST_TIMEOUT_MS || 60_000))
const transferTimeoutMs = Math.max(60_000, Number(process.env.AGENT_TRANSFER_TIMEOUT_MS || 30 * 60_000))
let stopping = false

process.on('SIGINT', () => { stopping = true })
process.on('SIGTERM', () => { stopping = true })

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const agentHeaders = () => ({ authorization: `Bearer ${sharedSecret}` })
const request = (url, init = {}, timeoutMs = requestTimeoutMs) => fetch(url, {
  ...init,
  signal: init.signal || AbortSignal.timeout(timeoutMs),
})

async function responseError(response) {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text)
    return parsed.error || parsed.message || `HTTP ${response.status}`
  } catch {
    return text.slice(0, 500) || `HTTP ${response.status}`
  }
}

async function claimJob() {
  const response = await request(`${flareBase}/api/render-agent/claim`, {
    method: 'POST',
    headers: agentHeaders(),
  })
  if (!response.ok) throw new Error(`Claim failed: ${await responseError(response)}`)
  const body = await response.json()
  return body.job || null
}

async function reportStatus(job, status, phase, error = null, rendererTaskId = null) {
  const response = await request(`${flareBase}/api/render-agent/jobs/${encodeURIComponent(job.id)}/status`, {
    method: 'POST',
    headers: { ...agentHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ claimToken: job.claimToken, status, phase, error, rendererTaskId }),
  })
  if (!response.ok) throw new Error(`Status update failed: ${await responseError(response)}`)
}

function startLeaseHeartbeat(job) {
  let active = true
  let leaseLost = false
  let timer = null

  const heartbeat = async () => {
    try {
      const response = await request(`${flareBase}/api/render-agent/jobs/${encodeURIComponent(job.id)}/heartbeat`, {
        method: 'POST',
        headers: { ...agentHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ claimToken: job.claimToken }),
      })
      if (response.status === 409) {
        leaseLost = true
        console.error(`[agent] lease lost for ${job.id}`)
      } else if (!response.ok) {
        throw new Error(await responseError(response))
      }
    } catch (error) {
      console.error(`[agent] heartbeat failed for ${job.id}:`, error instanceof Error ? error.message : error)
    } finally {
      if (active && !leaseLost) timer = setTimeout(heartbeat, leaseHeartbeatMs)
    }
  }

  timer = setTimeout(heartbeat, leaseHeartbeatMs)
  return {
    assertActive() {
      if (leaseLost) throw new Error('Agent claim expired and was reassigned')
    },
    stop() {
      active = false
      if (timer) clearTimeout(timer)
    },
  }
}

function validateSourceUrl(job) {
  const source = new URL(job.source.url)
  if (source.origin !== new URL(flareBase).origin) throw new Error('Claim returned a source from another origin')
  if (source.protocol !== new URL(flareBase).protocol) throw new Error('Claim returned an invalid source URL')
  return source
}

function smartClipPayload(job, localSourceUrl) {
  return {
    account: job.account,
    task: {
      requestId: `flare:${job.id}`,
      workName: job.title,
      template: 'meitu-beauty-keep-20260626',
      directGenerate: true,
      outputOrientation: 'auto',
      titles: [job.title],
      video: [{ video: localSourceUrl }],
    },
  }
}

async function readSmartClipEnvelope(response, operation) {
  const body = await response.json()
  if (!response.ok || body.statusCode !== 0 || body.data === undefined) {
    throw new Error(`${operation} failed (${response.status}): ${body.message || 'invalid response'}`)
  }
  return body.data
}

function normalizeLocalAssetUrl(raw) {
  const local = new URL(raw, `${new URL(smartClipBase).origin}/`)
  if (local.origin !== new URL(smartClipBase).origin || !local.pathname.startsWith('/local-files/')) {
    throw new Error('Smart Clip upload returned a non-local asset URL')
  }
  return local.toString()
}

async function importSource(job) {
  const source = validateSourceUrl(job)
  if (!Number.isSafeInteger(job.source.sizeBytes) || job.source.sizeBytes <= 0 || job.source.sizeBytes > maxSourceBytes) {
    throw new Error('Claim returned an invalid source size')
  }

  const directory = await mkdtemp(join(tmpdir(), 'smart-clip-agent-'))
  const filePath = join(directory, 'source.mp4')
  try {
    const response = await request(source, { redirect: 'error' }, transferTimeoutMs)
    if (!response.ok || !response.body) throw new Error(`Source download failed (${response.status})`)
    const contentType = response.headers.get('content-type')?.split(';')[0].trim()
    if (contentType !== 'video/mp4') throw new Error(`Source download returned ${contentType || 'no content type'}`)
    const declaredLength = Number(response.headers.get('content-length') ?? 0)
    if (Number.isFinite(declaredLength) && declaredLength > maxSourceBytes) throw new Error('Source download is too large')

    await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath, { flags: 'wx' }))
    const downloaded = await stat(filePath)
    if (downloaded.size !== job.source.sizeBytes) {
      throw new Error(`Source size mismatch (expected ${job.source.sizeBytes}, received ${downloaded.size})`)
    }

    const form = new FormData()
    const blob = await openAsBlob(filePath, { type: 'video/mp4' })
    form.append('file', blob, `flare-${job.id}.mp4`)
    form.append('businessType', '4')
    form.append('storage', 'local')
    const upload = await request(`${smartClipBase}/local-storage/upload`, {
      method: 'POST',
      body: form,
      redirect: 'error',
    }, transferTimeoutMs)
    const uploaded = await readSmartClipEnvelope(upload, 'Smart Clip source import')
    if (!uploaded?.url || typeof uploaded.url !== 'string') {
      throw new Error('Smart Clip source import did not return a URL')
    }
    return normalizeLocalAssetUrl(uploaded.url)
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined)
  }
}

async function submitSmartClip(job, localSourceUrl) {
  const response = await request(`${smartClipBase}/clip-task/flare`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(smartClipPayload(job, localSourceUrl)),
  })
  return readSmartClipEnvelope(response, 'Smart Clip submit')
}

async function readSmartClipTask(taskId) {
  const response = await request(`${smartClipBase}/clip-task/flare/${encodeURIComponent(taskId)}`)
  return readSmartClipEnvelope(response, 'Smart Clip status')
}

function smartClipPhase(status) {
  switch (status) {
    case -3: return 'subtitle-preparation'
    case -2: return 'smart-editing'
    case 3: return 'awaiting-edit'
    case -1: return 'render-queued'
    case 4: return 'rendering'
    case 1: return 'done'
    case 2: return 'failed'
    default: return `status-${status}`
  }
}

async function uploadOutput(job, outputUrl) {
  const output = new URL(outputUrl)
  if (output.protocol !== 'http:' || output.origin !== new URL(smartClipBase).origin) {
    throw new Error('Smart Clip returned a non-local output URL')
  }
  const video = await request(output, { redirect: 'error' }, transferTimeoutMs)
  if (!video.ok || !video.body) throw new Error(`Smart Clip output failed (${video.status})`)
  if (video.headers.get('content-type')?.split(';')[0].trim() !== 'video/mp4') {
    throw new Error('Smart Clip output is not video/mp4')
  }
  const headers = {
    ...agentHeaders(),
    'content-type': 'video/mp4',
    'x-agent-claim-token': job.claimToken,
  }
  const contentLength = video.headers.get('content-length')
  const outputBytes = Number(contentLength)
  if (!contentLength || !Number.isSafeInteger(outputBytes) || outputBytes <= 0) {
    throw new Error('Smart Clip output has no usable Content-Length')
  }
  if (outputBytes > maxOutputBytes) throw new Error('Smart Clip output is too large')
  headers['content-length'] = contentLength
  const response = await request(`${flareBase}/api/render-agent/jobs/${encodeURIComponent(job.id)}/output`, {
    method: 'PUT',
    headers,
    body: video.body,
    duplex: 'half',
  }, transferTimeoutMs)
  if (!response.ok) throw new Error(`Output upload failed: ${await responseError(response)}`)
}

async function processJob(job) {
  console.log(`[agent] claimed ${job.id}`)
  const lease = startLeaseHeartbeat(job)
  try {
    await reportStatus(job, 'running', 'source-download')
    const localSourceUrl = await importSource(job)
    lease.assertActive()
    await reportStatus(job, 'running', 'source-imported')
    await reportStatus(job, 'running', 'smart-clip-submit')
    let task = await submitSmartClip(job, localSourceUrl)
    lease.assertActive()
    let lastPhase = smartClipPhase(task.status)
    await reportStatus(job, 'running', lastPhase, null, task.taskId)
    while (!stopping) {
      const phase = smartClipPhase(task.status)
      if (phase !== lastPhase && task.status !== 1 && task.status !== 2) {
        await reportStatus(job, 'running', phase)
        lastPhase = phase
      }
      if (task.status === 1) {
        if (!task.outputMp4Url) throw new Error('Smart Clip completed without an output URL')
        await uploadOutput(job, task.outputMp4Url)
        console.log(`[agent] completed ${job.id} (Smart Clip ${task.taskId})`)
        return
      }
      if (task.status === 2) throw new Error(task.error || 'Smart Clip failed')
      await sleep(taskPollIntervalMs)
      task = await readSmartClipTask(task.taskId)
      lease.assertActive()
    }
    throw new Error('Agent stopped while processing')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    try {
      await reportStatus(job, 'failed', 'agent-failed', message.slice(0, 2000))
    } catch (reportError) {
      console.error(`[agent] could not report failure for ${job.id}:`, reportError)
    }
    console.error(`[agent] failed ${job.id}: ${message}`)
  } finally {
    lease.stop()
  }
}

console.log(`[agent] polling ${flareBase}; Smart Clip remains local at ${smartClipBase}`)
while (!stopping) {
  try {
    const job = await claimJob()
    if (job) await processJob(job)
    else await sleep(pollIntervalMs)
  } catch (error) {
    console.error('[agent] poll failed:', error instanceof Error ? error.message : error)
    await sleep(pollIntervalMs)
  }
}
console.log('[agent] stopped')
