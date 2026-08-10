/**
 * Small, privacy-safe GA4 client wrapper.
 *
 * The wrapper deliberately accepts a closed set of event names and parameters.
 * Marketing and product code can pass richer objects, but anything outside the
 * allowlists is dropped before it reaches Google Analytics.
 */

export const GA4_MEASUREMENT_ID = 'G-QEKHDPCR27'

const ATTRIBUTION_STORAGE_KEY = 'smart_clip:attribution:v1'
const MAX_UTM_VALUE_LENGTH = 64
const MAX_EVENT_STRING_LENGTH = 100

export const GA4_EVENT_NAMES = [
  'cta_click',
  'sign_up_start',
  'sign_up',
  'render_start',
  'render_complete',
  'result_download',
  'purchase',
] as const

export type Ga4EventName = (typeof GA4_EVENT_NAMES)[number]

export type Attribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

export type Ga4ParamValue = string | number | boolean
export type Ga4EventParams = Record<string, unknown>

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

const EVENT_PARAM_ALLOWLIST: Record<Ga4EventName, readonly string[]> = {
  cta_click: ['cta_id', 'placement', 'locale', 'destination'],
  sign_up_start: ['locale', 'method'],
  sign_up: ['locale', 'method'],
  render_start: ['locale', 'animation_id', 'translation_language'],
  render_complete: ['locale', 'animation_id', 'translation_language'],
  result_download: ['first_download'],
  purchase: ['currency', 'value', 'transaction_id'],
}

const ATTRIBUTION_EVENT_PARAMS = {
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  utm_content: 'utm_content',
} as const

const UTM_KEYS = Object.keys(ATTRIBUTION_EVENT_PARAMS) as Array<keyof Attribution>

function isGa4EventName(value: string): value is Ga4EventName {
  return (GA4_EVENT_NAMES as readonly string[]).includes(value)
}

function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    // Private browsing and restrictive storage policies can throw here.
    return undefined
  }
}

/**
 * Convert an externally supplied UTM value into a stable, non-PII campaign id.
 * The public link convention uses lowercase ASCII and underscores, so other
 * characters become separators instead of being sent verbatim.
 */
export function normalizeUtmValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  // Campaign labels should be stable identifiers, never contact details.
  // Reject obvious email/phone-shaped values before punctuation is normalized.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || /(?:\+?\d[\d\s().-]{7,}\d)/.test(value)) {
    return undefined
  }

  const normalized = value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_UTM_VALUE_LENGTH)

  return normalized || undefined
}

function cleanEventString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const cleaned = value
    .normalize('NFKC')
    // Do not allow control characters to reach analytics payloads.
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_EVENT_STRING_LENGTH)

  return cleaned || undefined
}

function cleanIdentifier(value: unknown): string | undefined {
  const normalized = normalizeUtmValue(value)
  return normalized
}

function cleanLocale(value: unknown): string | undefined {
  const normalized = cleanIdentifier(value)
  return normalized === 'en' || normalized === 'zh' ? normalized : undefined
}

function cleanDestination(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    const url = new URL(value, 'https://smart-clip.invalid')
    // Destinations are analytics labels, never arbitrary external URLs or
    // query strings that could contain an email/return target.
    if (url.origin !== 'https://smart-clip.invalid' || !url.pathname.startsWith('/')) return undefined
    return url.pathname.slice(0, MAX_EVENT_STRING_LENGTH)
  } catch {
    return undefined
  }
}

function cleanCurrency(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const currency = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(currency) ? currency : undefined
}

function cleanTransactionId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const id = value.trim().slice(0, MAX_EVENT_STRING_LENGTH)
  return /^[a-zA-Z0-9_-]+$/.test(id) ? id : undefined
}

function cleanParamValue(key: string, value: unknown): Ga4ParamValue | undefined {
  if (key === 'locale') return cleanLocale(value)
  if (key === 'destination') return cleanDestination(value)
  if (key === 'currency') return cleanCurrency(value)
  if (key === 'transaction_id') return cleanTransactionId(value)
  if (key === 'cta_id' || key === 'placement' || key === 'method' || key === 'animation_id' || key === 'translation_language') {
    return cleanIdentifier(value)
  }
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  return cleanEventString(value)
}

function readAttribution(storage: StorageLike | undefined): Attribution | null {
  if (!storage) return null

  try {
    const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

    const result: Attribution = {}
    for (const key of UTM_KEYS) {
      const value = normalizeUtmValue((parsed as Record<string, unknown>)[key])
      if (value) result[key] = value
    }
    return Object.keys(result).length ? result : null
  } catch {
    return null
  }
}

/** Return the first-touch attribution saved for this browser, if any. */
export function getFirstTouchAttribution(storage: StorageLike | undefined = getBrowserStorage()): Attribution | null {
  return readAttribution(storage)
}

function readSearch(input?: string | URLSearchParams): URLSearchParams | undefined {
  if (input instanceof URLSearchParams) return input
  if (typeof input === 'string') {
    try {
      return new URL(input, 'https://smart-clip.invalid').searchParams
    } catch {
      return undefined
    }
  }
  if (typeof window !== 'undefined') return new URLSearchParams(window.location.search)
  return undefined
}

/**
 * Capture first-touch UTM values. Existing valid attribution is never replaced
 * by a later campaign, which keeps the browser-level source stable throughout
 * the signup and first-render funnel.
 */
export function captureFirstTouchAttribution(
  input?: string | URLSearchParams,
  storage: StorageLike | undefined = getBrowserStorage(),
): Attribution | null {
  const existing = readAttribution(storage)
  if (existing) return existing

  const search = readSearch(input)
  if (!search || !storage) return null

  const captured: Attribution = {}
  for (const key of UTM_KEYS) {
    const value = normalizeUtmValue(search.get(key))
    if (value) captured[key] = value
  }

  if (!Object.keys(captured).length) return null

  try {
    storage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(captured))
  } catch {
    // Analytics must never break navigation when storage is unavailable.
  }
  return captured
}

function getAttributionParams(attribution: Attribution | null | undefined): Record<string, string> {
  if (!attribution) return {}

  const result: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = normalizeUtmValue(attribution[key])
    if (value) result[ATTRIBUTION_EVENT_PARAMS[key]] = value
  }
  return result
}

/**
 * Build the exact payload sent to GA4. This function is pure and is exported
 * for tests and for callers that need to inspect a payload before dispatch.
 */
export function buildEventPayload(
  eventName: Ga4EventName,
  params: Ga4EventParams = {},
  attribution: Attribution | null = getFirstTouchAttribution(),
): Record<string, Ga4ParamValue> {
  const allowedParams = EVENT_PARAM_ALLOWLIST[eventName]
  if (!allowedParams) return {}

  const allowed = new Set(allowedParams)
  const payload: Record<string, Ga4ParamValue> = {}

  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key)) continue
    const cleaned = cleanParamValue(key, value)
    if (cleaned !== undefined) payload[key] = cleaned
  }

  // Stored attribution wins over caller-supplied values, so a page cannot
  // accidentally overwrite first-touch campaign data.
  Object.assign(payload, getAttributionParams(attribution))
  return payload
}

function resolveGtag(gtag?: Gtag): Gtag | undefined {
  if (gtag) return gtag
  if (typeof window === 'undefined') return undefined
  return typeof window.gtag === 'function' ? window.gtag : undefined
}

/**
 * Google automatically derives `dl` (document location) from the browser URL
 * for every event. Auth callbacks and other integrations can legitimately have
 * sensitive query values there, so explicitly provide the allowlisted URL for
 * custom events as well as for manual page views.
 */
function getBrowserPageContext(): { page_path: string; page_location: string } | undefined {
  const browserWindow = (globalThis as { window?: { location?: { href?: string } } }).window
  if (!browserWindow?.location?.href) return undefined
  const location = sanitizePageUrl(browserWindow.location.href)
  if (!location) return undefined
  return { page_path: location.pagePath, page_location: location.pageLocation }
}

/** Send a whitelisted custom event, or safely no-op when GA is unavailable. */
export function trackEvent(
  eventName: Ga4EventName,
  params: Ga4EventParams = {},
  options: {
    measurementId?: string | null
    attribution?: Attribution | null
    gtag?: Gtag
  } = {},
): boolean {
  if (!isGa4EventName(eventName)) return false
  const measurementId = options.measurementId === undefined ? GA4_MEASUREMENT_ID : options.measurementId
  const gtag = resolveGtag(options.gtag)
  if (!measurementId || !gtag) return false

  const payload = buildEventPayload(eventName, params, options.attribution === undefined ? getFirstTouchAttribution() : options.attribution)
  try {
    const pageContext = getBrowserPageContext()
    gtag('event', eventName, pageContext ? { ...payload, ...pageContext } : payload)
    return true
  } catch {
    return false
  }
}

function sanitizePageUrl(href: string): { pagePath: string; pageLocation: string } | null {
  try {
    const baseOrigin = typeof window === 'undefined' ? 'https://smart-clip.invalid' : window.location.origin
    const url = new URL(href, baseOrigin)
    if (!['http:', 'https:'].includes(url.protocol) || !url.pathname.startsWith('/')) return null
    if (url.origin !== baseOrigin && !href.trim().startsWith('/')) return null
    const filtered = new URLSearchParams()
    for (const key of UTM_KEYS) {
      const value = normalizeUtmValue(url.searchParams.get(key))
      if (value) filtered.set(key, value)
    }
    const search = filtered.toString()
    const pagePath = `${url.pathname || '/'}${search ? `?${search}` : ''}`
    const pageLocation = `${url.origin}${pagePath}`
    return { pagePath, pageLocation }
  } catch {
    return null
  }
}

/** Send a manually controlled SPA page_view with only a safe URL payload. */
export function trackPageView(
  href: string,
  options: { measurementId?: string | null; gtag?: Gtag } = {},
): boolean {
  const measurementId = options.measurementId === undefined ? GA4_MEASUREMENT_ID : options.measurementId
  const gtag = resolveGtag(options.gtag)
  const location = sanitizePageUrl(href)
  if (!measurementId || !gtag || !location) return false

  try {
    gtag('event', 'page_view', {
      page_path: location.pagePath,
      page_location: location.pageLocation,
    })
    return true
  } catch {
    return false
  }
}

/** Keep GA's global page context safe for automatic Enhanced Measurement events. */
export function setAnalyticsPageContext(
  href: string,
  options: { measurementId?: string | null; gtag?: Gtag } = {},
): boolean {
  const measurementId = options.measurementId === undefined ? GA4_MEASUREMENT_ID : options.measurementId
  const gtag = resolveGtag(options.gtag)
  const location = sanitizePageUrl(href)
  if (!measurementId || !gtag || !location) return false

  try {
    gtag('set', 'page_location', location.pageLocation)
    gtag('config', measurementId, {
      update: true,
      send_page_view: false,
      page_location: location.pageLocation,
    })
    return true
  } catch {
    return false
  }
}

export { ATTRIBUTION_STORAGE_KEY }
