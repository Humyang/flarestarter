import { describe, expect, test, vi } from 'vitest'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      validator: () => builder,
      handler: () => builder,
    }
    return builder
  },
}))
vi.mock('@/lib/env', () => ({ env: {} }))
vi.mock('./readUser.server', () => ({ readUser: vi.fn() }))
import {
  authDestination,
  authEntryHref,
  normalizeRequireUserInput,
  readAuthNext,
  resolveRequiredUser,
  validateAuthSearch,
} from './middleware'

describe('auth return destination', () => {
  test('accepts only the render destination', () => {
    expect(readAuthNext('/app/render')).toBe('/app/render')
    expect(validateAuthSearch({ next: '/app/render' })).toEqual({ next: '/app/render' })

    for (const unsafe of ['https://evil.example', '//evil.example', '/app/account', '/app/render?x=1']) {
      expect(readAuthNext(unsafe)).toBeUndefined()
      expect(authDestination(unsafe)).toBe('/app')
    }
  })

  test('builds concrete localized auth hrefs', () => {
    expect(authEntryHref(normalizeRequireUserInput({
      locale: 'zh',
      entry: 'register',
      next: '/app/render',
    }))).toBe('/zh/register?next=%2Fapp%2Frender')
    expect(authEntryHref(normalizeRequireUserInput({
      locale: 'en',
      entry: 'login',
      next: 'https://evil.example',
    }))).toBe('/login')
  })

  test('throws a full-document redirect for anonymous users', async () => {
    let caught: unknown
    try {
      await resolveRequiredUser(
        async () => null,
        normalizeRequireUserInput({ locale: 'zh', entry: 'register', next: '/app/render' }),
      )
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(Response)
    const response = caught as Response & { options?: { reloadDocument?: boolean } }
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('/zh/register?next=%2Fapp%2Frender')
    expect(response.options?.reloadDocument).toBe(true)
  })

  test('returns an authenticated user unchanged', async () => {
    const user = { id: 'user-1', email: 'user@example.com' }
    await expect(resolveRequiredUser(
      async () => user,
      normalizeRequireUserInput(),
    )).resolves.toBe(user)
  })
})
