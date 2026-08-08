import { describe, expect, test, vi } from 'vitest'
import {
  buildSmartClipPayload,
  localSmartClipBase,
  readSmartClipOutput,
  readSmartClipTask,
  smartClipPhase,
  submitSmartClipTask,
} from './local-smart-clip'
import { MAX_RENDER_SOURCE_BYTES, validateRenderUpload } from './render-job.shared'

describe('local Smart Clip boundary', () => {
  test('only accepts loopback HTTP API URLs', () => {
    expect(localSmartClipBase('http://127.0.0.1:7706/v1/ai-cut/')).toBe('http://127.0.0.1:7706/v1/ai-cut')
    expect(localSmartClipBase('http://localhost:7706/v1/ai-cut')).toBe('http://localhost:7706/v1/ai-cut')
    expect(localSmartClipBase('https://smart-clip.example.com')).toBeNull()
    expect(localSmartClipBase('http://192.168.1.8:7706/v1/ai-cut')).toBeNull()
    expect(localSmartClipBase(undefined)).toBeNull()
  })

  test('builds a normal direct-generate clip task without billing fields', () => {
    const payload = buildSmartClipPayload({
      jobId: 'job-1', sourceUrl: 'http://localhost/source.mp4', title: 'Demo',
      account: { id: 'user-1', email: 'user@example.com', name: 'User' },
      subtitle: { translationLanguage: 'ja', animationId: 'historyStack' },
    })
    expect(payload).toMatchObject({
      account: { id: 'user-1', email: 'user@example.com', name: 'User' },
      task: {
        requestId: 'flare:job-1', workName: 'Demo', directGenerate: true,
        subtitleTranslationTargetLang: 'ja', subtitleAnimationStructureId: 'historyStack',
        titles: [],
        video: [{ video: 'http://localhost/source.mp4' }],
      },
    })
    expect(JSON.stringify(payload)).not.toMatch(/billing|credit|subscription/i)
  })

  test('uses a distinct request id when retrying a failed render', () => {
    const payload = buildSmartClipPayload({
      jobId: 'job-1', retryToken: '123', sourceUrl: 'http://localhost/source.mp4', title: 'Demo',
      account: { id: 'user-1', email: 'user@example.com', name: 'User' },
      subtitle: { translationLanguage: 'original', animationId: 'bankDeposit' },
    })
    expect(payload.task.requestId).toBe('flare:job-1:retry:123')
  })

  test('submits and reads a wrapped Smart Clip task response', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ statusCode: 0, data: { taskId: 'ct_1', status: -2 } }))
      .mockResolvedValueOnce(Response.json({ statusCode: 0, data: { taskId: 'ct_1', status: 4 } }))
    const submitted = await submitSmartClipTask('http://127.0.0.1:7706/v1/ai-cut', {
      jobId: 'job-1', sourceUrl: 'http://localhost/source.mp4', title: 'Demo',
      account: { id: 'user-1', email: 'user@example.com', name: 'User' },
      subtitle: { translationLanguage: 'original', animationId: 'bankDeposit' },
    }, fetcher)
    expect(submitted).toEqual({ taskId: 'ct_1', status: -2 })
    await expect(readSmartClipTask('http://127.0.0.1:7706/v1/ai-cut', 'ct_1', fetcher))
      .resolves.toEqual({ taskId: 'ct_1', status: 4 })
    expect(fetcher).toHaveBeenLastCalledWith(
      'http://127.0.0.1:7706/v1/ai-cut/clip-task/flare/ct_1',
    )
  })

  test('maps pipeline phases and rejects an output from another origin', async () => {
    expect(smartClipPhase(-2)).toBe('smart-editing')
    expect(smartClipPhase(4)).toBe('rendering')
    expect(smartClipPhase(1)).toBe('done')
    await expect(readSmartClipOutput(
      'http://127.0.0.1:7706/v1/ai-cut',
      'http://127.0.0.1:7600/output.mp4',
    )).rejects.toThrow('non-local output URL')
  })
})

describe('render upload validation', () => {
  test('accepts a normal mp4 and rejects invalid inputs', () => {
    expect(validateRenderUpload({ type: 'video/mp4', size: 1024, title: 'Demo' })).toBeNull()
    expect(validateRenderUpload({ type: 'video/mp4', size: 0, title: 'Demo' })).toBe('empty')
    expect(validateRenderUpload({ type: 'video/quicktime', size: 1024, title: 'Demo' })).toBe('type')
    expect(validateRenderUpload({ type: 'video/mp4', size: MAX_RENDER_SOURCE_BYTES + 1, title: 'Demo' })).toBe('size')
    expect(validateRenderUpload({ type: 'video/mp4', size: 1024, title: '' })).toBe('title')
  })
})
