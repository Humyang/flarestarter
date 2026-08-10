import { describe, expect, test, vi } from 'vitest'
import {
  ATTRIBUTION_STORAGE_KEY,
  buildEventPayload,
  captureFirstTouchAttribution,
  getFirstTouchAttribution,
  normalizeUtmValue,
  setAnalyticsPageContext,
  trackEvent,
  trackPageView,
} from '@/features/analytics/ga4'

function createStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('GA4 attribution', () => {
  test('normalizes campaign values without retaining arbitrary characters', () => {
    expect(normalizeUtmValue('  Product Hunt / Demo 01  ')).toBe('product_hunt_demo_01')
    expect(normalizeUtmValue('这是中文')).toBeUndefined()
    expect(normalizeUtmValue('13800138000')).toBeUndefined()
    expect(normalizeUtmValue('___')).toBeUndefined()
    expect(normalizeUtmValue(`A${'b'.repeat(100)}`)).toHaveLength(64)
  })

  test('captures first touch once and persists only the allowlisted UTM fields', () => {
    const storage = createStorage()
    const first = captureFirstTouchAttribution(
      '?utm_source=Product%20Hunt&utm_medium=Social&utm_campaign=Smart%20Clip%20Launch&utm_content=demo_20s_v1&email=private@example.com',
      storage,
    )

    expect(first).toEqual({
      utm_source: 'product_hunt',
      utm_medium: 'social',
      utm_campaign: 'smart_clip_launch',
      utm_content: 'demo_20s_v1',
    })
    expect(storage.getItem(ATTRIBUTION_STORAGE_KEY)).not.toContain('private@example.com')

    const later = captureFirstTouchAttribution('?utm_source=wechat&utm_medium=article', storage)
    expect(later).toEqual(first)
    expect(getFirstTouchAttribution(storage)).toEqual(first)
  })
})

describe('GA4 payloads', () => {
  test('drops unknown fields and PII while attaching safe attribution', () => {
    const payload = buildEventPayload(
      'cta_click',
      {
        cta_id: 'hero_start',
        placement: 'hero',
        locale: 'zh',
        destination: '/register?next=/app/render&email=private@example.com',
        email: 'private@example.com',
        title: 'A private source video title',
      },
      { utm_source: 'wechat', utm_medium: 'article' },
    )

    expect(payload).toEqual({
      cta_id: 'hero_start',
      placement: 'hero',
      locale: 'zh',
      destination: '/register',
      utm_source: 'wechat',
      utm_medium: 'article',
    })
    expect(JSON.stringify(payload)).not.toContain('private@example.com')
    expect(JSON.stringify(payload)).not.toContain('private source')
  })

  test('validates event-specific identifiers and commerce values', () => {
    expect(
      buildEventPayload('purchase', {
        currency: 'usd',
        value: 19,
        transaction_id: 'stripe_evt_123',
        email: 'private@example.com',
      }),
    ).toEqual({ currency: 'USD', value: 19, transaction_id: 'stripe_evt_123' })

    expect(
      buildEventPayload('render_start', {
        locale: 'fr',
        animation_id: 'fade-in',
        translation_language: 'English (US)',
      }),
    ).toEqual({ animation_id: 'fade_in', translation_language: 'english_us' })
  })

  test('sends only through an available gtag function and otherwise no-ops', () => {
    const calls: unknown[][] = []
    const gtag = (...args: unknown[]) => calls.push(args)

    expect(trackEvent('sign_up_start', { locale: 'en', method: 'email' }, { gtag, measurementId: 'G-TEST' })).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual(['event', 'sign_up_start', { locale: 'en', method: 'email' }])
    expect(trackEvent('sign_up_start', {}, { measurementId: 'G-TEST', gtag: undefined })).toBe(false)
    expect(trackEvent('sign_up_start', {}, { measurementId: null, gtag })).toBe(false)
  })

  test('page views contain a filtered path and do not expose arbitrary query data', () => {
    const calls: unknown[][] = []
    const gtag = (...args: unknown[]) => calls.push(args)
    expect(trackPageView('/zh?utm_source=wechat&email=private@example.com&token=secret', { gtag, measurementId: 'G-TEST' })).toBe(true)
    expect(calls[0]).toEqual([
      'event',
      'page_view',
      {
        page_path: '/zh?utm_source=wechat',
        page_location: 'https://smart-clip.invalid/zh?utm_source=wechat',
      },
    ])
    expect(JSON.stringify(calls)).not.toContain('private@example.com')
    expect(trackPageView('/zh', { gtag: undefined, measurementId: 'G-TEST' })).toBe(false)
  })

  test('custom events override the browser URL with a filtered page context', () => {
    const calls: unknown[][] = []
    vi.stubGlobal('window', {
      location: {
        href: 'https://smart-clip.example/register?next=%2Fapp%2Frender&email=private%40example.com&token=secret',
        origin: 'https://smart-clip.example',
      },
    })

    try {
      expect(trackEvent('cta_click', { cta_id: 'register' }, {
        gtag: (...args: unknown[]) => calls.push(args),
        measurementId: 'G-TEST',
        attribution: null,
      })).toBe(true)
      expect(calls[0]).toEqual([
        'event',
        'cta_click',
        {
          cta_id: 'register',
          page_path: '/register',
          page_location: 'https://smart-clip.example/register',
        },
      ])
      expect(JSON.stringify(calls)).not.toContain('private')
      expect(JSON.stringify(calls)).not.toContain('secret')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  test('updates the global page context used by automatic GA events', () => {
    const calls: unknown[][] = []
    const gtag = (...args: unknown[]) => calls.push(args)

    expect(setAnalyticsPageContext(
      '/reset-password?token=secret&utm_source=WeChat',
      { gtag, measurementId: 'G-TEST' },
    )).toBe(true)
    expect(calls).toEqual([
      ['set', 'page_location', 'https://smart-clip.invalid/reset-password?utm_source=wechat'],
      ['config', 'G-TEST', {
        update: true,
        send_page_view: false,
        page_location: 'https://smart-clip.invalid/reset-password?utm_source=wechat',
      }],
    ])
    expect(JSON.stringify(calls)).not.toContain('secret')
  })
})
