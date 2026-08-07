import { describe, expect, test } from 'vitest'
import {
  agentBridgeConfigured,
  authenticateAgentRequest,
  readAgentStatusInput,
} from './render-agent.shared'

describe('render agent protocol', () => {
  test('requires an exact bearer secret', async () => {
    const secret = 'a-secure-agent-secret-with-32-characters'
    await expect(authenticateAgentRequest(new Request('https://dve2.com/api/render-agent/claim', {
      headers: { authorization: `Bearer ${secret}` },
    }), secret)).resolves.toBe(true)
    await expect(authenticateAgentRequest(new Request('https://dve2.com/api/render-agent/claim', {
      headers: { authorization: 'Bearer wrong-secret' },
    }), secret)).resolves.toBe(false)
    await expect(authenticateAgentRequest(new Request('https://dve2.com/api/render-agent/claim'), secret))
      .resolves.toBe(false)
  })

  test('validates status updates and bridge configuration', () => {
    expect(agentBridgeConfigured(' shared-secret ')).toBe(true)
    expect(agentBridgeConfigured('')).toBe(false)
    expect(readAgentStatusInput({
      claimToken: 'claim-1', status: 'running', phase: 'rendering', error: null, rendererTaskId: 'ct_1',
    })).toEqual({
      claimToken: 'claim-1', status: 'running', phase: 'rendering', error: null, rendererTaskId: 'ct_1',
    })
    expect(readAgentStatusInput({
      claimToken: 'claim-1', status: 'failed', phase: 'agent-failed', error: '',
    })).toBeNull()
    expect(readAgentStatusInput({
      claimToken: 'claim-1', status: 'completed', phase: 'done',
    })).toBeNull()
  })
})
