import { describe, expect, test } from 'vitest'
import { redirectToCanonicalHost } from './canonical-redirect'

describe('redirectToCanonicalHost', () => {
  test('redirects www while preserving path and query', () => {
    const response = redirectToCanonicalHost(
      new Request('https://www.dve2.com/zh/login?next=%2Fapp'),
      'https://dve2.com',
    )
    expect(response?.status).toBe(308)
    expect(response?.headers.get('location')).toBe('https://dve2.com/zh/login?next=%2Fapp')
  })

  test('leaves the canonical host alone', () => {
    expect(redirectToCanonicalHost(new Request('https://dve2.com/login'), 'https://dve2.com')).toBeNull()
  })

  test('upgrades the canonical host from http to https', () => {
    const response = redirectToCanonicalHost(
      new Request('http://dve2.com/zh/login?next=%2Fapp'),
      'https://dve2.com',
    )
    expect(response?.status).toBe(308)
    expect(response?.headers.get('location')).toBe('https://dve2.com/zh/login?next=%2Fapp')
  })
})
