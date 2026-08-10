import { describe, expect, test, vi } from 'vitest'
import { runRenderSubmission } from './actions'

describe('runRenderSubmission', () => {
  test('reports success only after submission finishes', async () => {
    const markFailed = vi.fn()

    await expect(runRenderSubmission(async () => undefined, markFailed)).resolves.toBe(true)
    expect(markFailed).not.toHaveBeenCalled()
  })

  test('persists the failure and reports submission failure', async () => {
    const markFailed = vi.fn(async () => undefined)

    await expect(runRenderSubmission(
      async () => { throw new Error('upstream unavailable') },
      markFailed,
    )).resolves.toBe(false)
    expect(markFailed).toHaveBeenCalledOnce()
    expect(markFailed).toHaveBeenCalledWith('upstream unavailable')
  })
})
