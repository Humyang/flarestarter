export interface SmartClipTaskStatus {
  taskId: string
  status: number
  outputMp4Url?: string | null
  error?: string | null
}

interface SmartClipEnvelope<T> {
  statusCode?: number
  message?: string
  data?: T
}

export function localSmartClipBase(raw: string | undefined): string | null {
  if (!raw?.trim()) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return null
    if (url.username || url.password || url.search || url.hash) return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

interface FlareAccount {
  id: string
  email: string
  name: string
}

interface SmartClipSubtitleOptions {
  translationLanguage: string
  animationId: string
}

export function buildSmartClipPayload(input: {
  jobId: string
  retryToken?: string
  sourceUrl: string
  title: string
  account: FlareAccount
  subtitle: SmartClipSubtitleOptions
}) {
  return {
    account: input.account,
    task: {
      requestId: `flare:${input.jobId}${input.retryToken ? `:retry:${input.retryToken}` : ''}`,
      workName: input.title,
      template: 'meitu-beauty-keep-20260626',
      directGenerate: true,
      outputOrientation: 'auto',
      subtitleTranslationTargetLang:
        input.subtitle.translationLanguage === 'original' ? undefined : input.subtitle.translationLanguage,
      subtitleAnimationStructureId: input.subtitle.animationId,
      // The render page title identifies the job only; it is not a visible title segment.
      titles: [],
      video: [{ video: input.sourceUrl }],
    },
  }
}

async function readEnvelope<T>(response: Response, operation: string): Promise<T> {
  const body = await response.json() as SmartClipEnvelope<T>
  if (!response.ok || body.statusCode !== 0 || body.data === undefined) {
    throw new Error(`${operation} failed (${response.status}): ${body.message ?? 'invalid response'}`)
  }
  return body.data
}

export async function submitSmartClipTask(
  base: string,
  input: {
    jobId: string
    retryToken?: string
    sourceUrl: string
    title: string
    account: FlareAccount
    subtitle: SmartClipSubtitleOptions
  },
  fetcher: typeof fetch = fetch,
): Promise<SmartClipTaskStatus> {
  const response = await fetcher(`${base}/clip-task/flare`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildSmartClipPayload(input)),
  })
  return readEnvelope<SmartClipTaskStatus>(response, 'Smart Clip submit')
}

export async function readSmartClipTask(
  base: string,
  taskId: string,
  fetcher: typeof fetch = fetch,
): Promise<SmartClipTaskStatus> {
  const response = await fetcher(`${base}/clip-task/flare/${encodeURIComponent(taskId)}`)
  return readEnvelope<SmartClipTaskStatus>(response, 'Smart Clip status')
}

export function smartClipPhase(status: number): string {
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

export async function readSmartClipOutput(
  base: string,
  outputUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<ReadableStream<Uint8Array>> {
  const api = new URL(base)
  const output = new URL(outputUrl)
  if (output.protocol !== 'http:' || output.origin !== api.origin) {
    throw new Error('Smart Clip returned a non-local output URL')
  }
  const response = await fetcher(output.toString())
  if (!response.ok) throw new Error(`Smart Clip output failed (${response.status})`)
  if (!response.body) throw new Error('Smart Clip output has no body')
  return response.body
}
