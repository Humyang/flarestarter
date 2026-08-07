export const AGENT_AUTH_SCHEME = 'Bearer'
export const AGENT_CLAIM_TOKEN_HEADER = 'x-agent-claim-token'
export const MAX_RENDER_OUTPUT_BYTES = 500 * 1024 * 1024

export interface RenderAgentClaim {
  id: string
  claimToken: string
  title: string
  account: {
    id: string
    email: string
    name: string
  }
  source: {
    url: string
    fileName: string
    contentType: string
    sizeBytes: number
  }
}

export interface RenderAgentClaimResponse {
  job: RenderAgentClaim | null
}

export interface RenderAgentStatusInput {
  claimToken: string
  status: 'running' | 'failed'
  phase: string
  error?: string | null
  rendererTaskId?: string | null
}

export function agentBridgeConfigured(secret: string | undefined): boolean {
  return !!secret?.trim()
}

export function readAgentStatusInput(value: unknown): RenderAgentStatusInput | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  if (typeof input.claimToken !== 'string' || !input.claimToken || input.claimToken.length > 128) return null
  if (input.status !== 'running' && input.status !== 'failed') return null
  if (typeof input.phase !== 'string' || !input.phase.trim() || input.phase.length > 64) return null
  if (input.error !== undefined && input.error !== null && typeof input.error !== 'string') return null
  if (typeof input.error === 'string' && input.error.length > 2000) return null
  if (
    input.rendererTaskId !== undefined &&
    input.rendererTaskId !== null &&
    (typeof input.rendererTaskId !== 'string' || !input.rendererTaskId.trim() || input.rendererTaskId.length > 128)
  ) return null
  if (input.status === 'failed' && !String(input.error ?? '').trim()) return null
  return {
    claimToken: input.claimToken,
    status: input.status,
    phase: input.phase.trim(),
    error: typeof input.error === 'string' ? input.error.trim() : null,
    rendererTaskId: typeof input.rendererTaskId === 'string' ? input.rendererTaskId.trim() : null,
  }
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

async function secureEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)])
  let difference = 0
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash[index]! ^ rightHash[index]!
  }
  return difference === 0
}

export async function authenticateAgentRequest(request: Request, secret: string): Promise<boolean> {
  const authorization = request.headers.get('authorization') ?? ''
  const prefix = `${AGENT_AUTH_SCHEME} `
  if (!authorization.startsWith(prefix)) return false
  const provided = authorization.slice(prefix.length)
  if (!provided || !secret) return false
  return secureEqual(provided, secret)
}
