import { describe, expect, test } from 'vitest'
import { parseTrustedOrigins, resolveTrustedOrigins } from './trusted-origins'

describe('parseTrustedOrigins', () => {
  test('normalizes a comma-separated allowlist', () => {
    expect(parseTrustedOrigins(' http://192.168.1.26:3000, https://preview.example.com/path ')).toEqual([
      'http://192.168.1.26:3000',
      'https://preview.example.com',
    ])
  })

  test('returns an empty allowlist when unset', () => {
    expect(parseTrustedOrigins()).toEqual([])
    expect(parseTrustedOrigins('  ')).toEqual([])
  })
})

describe('resolveTrustedOrigins', () => {
  test('local development trusts the exact private-network request origin', () => {
    const request = new Request('http://192.168.50.12:4173/api/auth/sign-in/email', {
      headers: { origin: 'http://192.168.50.12:4173' },
    })

    expect(resolveTrustedOrigins(undefined, 'http://localhost:3000', request)).toEqual([
      'http://192.168.50.12:4173',
    ])
  })

  test('local development does not trust public request origins', () => {
    const request = new Request('http://localhost:3000/api/auth/sign-in/email', {
      headers: { origin: 'https://untrusted.example' },
    })

    expect(resolveTrustedOrigins(undefined, 'http://localhost:3000', request)).toEqual([])
  })

  test('production base URLs do not dynamically trust private request origins', () => {
    const request = new Request('https://dve2.com/api/auth/sign-in/email', {
      headers: { origin: 'http://192.168.50.12:4173' },
    })

    expect(resolveTrustedOrigins(undefined, 'https://dve2.com', request)).toEqual([])
  })
})
