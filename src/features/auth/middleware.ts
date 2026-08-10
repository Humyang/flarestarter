/**
 * Server-side auth utilities for route loaders and server functions.
 *
 * `requireUser()` returns `{ id, email }` where `id` is the user_id.
 * Business code should pass `id` to `scopeFromUser(id)` from `@/db/scope`
 * and use `ownedBy` / `withOwner` — never hand-write user filters.
 */
import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { readUser } from './readUser.server'

export const AUTH_RENDER_NEXT = '/app/render' as const
export type AuthNext = typeof AUTH_RENDER_NEXT
export type AuthEntry = 'login' | 'register'

export interface RequireUserInput {
  locale?: unknown
  next?: unknown
  entry?: unknown
}

interface NormalizedRequireUserInput {
  locale?: 'zh'
  next?: AuthNext
  entry: AuthEntry
}

export function readAuthNext(value: unknown): AuthNext | undefined {
  return value === AUTH_RENDER_NEXT ? AUTH_RENDER_NEXT : undefined
}

export function validateAuthSearch(search: Record<string, unknown>): { next?: AuthNext } {
  return { next: readAuthNext(search.next) }
}

export function authDestination(next: unknown): '/app' | AuthNext {
  return readAuthNext(next) ?? '/app'
}

export function normalizeRequireUserInput(input?: RequireUserInput): NormalizedRequireUserInput {
  return {
    locale: input?.locale === 'zh' ? 'zh' : undefined,
    next: readAuthNext(input?.next),
    entry: input?.entry === 'register' ? 'register' : 'login',
  }
}

export function authEntryHref(input: NormalizedRequireUserInput): string {
  const localePrefix = input.locale === 'zh' ? '/zh' : ''
  const href = `${localePrefix}/${input.entry}`
  return input.next ? `${href}?next=${encodeURIComponent(input.next)}` : href
}

export async function resolveRequiredUser<T>(
  read: () => Promise<T | null>,
  input: NormalizedRequireUserInput,
): Promise<T> {
  const user = await read()
  if (!user) {
    throw redirect({
      href: authEntryHref(input),
      reloadDocument: true,
    })
  }
  return user
}

export const getOptionalUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ id: string; email: string } | null> => readUser(),
)

export const requireUser = createServerFn({ method: 'GET' })
  // Server functions execute below /_serverFn during client navigation. A concrete
  // document href keeps auth redirects rooted at the public, localized route.
  .validator(normalizeRequireUserInput)
  .handler(async ({ data }) => resolveRequiredUser(readUser, data))

export const getEnabledSocialProviders = createServerFn({ method: 'GET' }).handler(async () => {
  const out: Array<'google' | 'github'> = []
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) out.push('google')
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) out.push('github')
  return out
})

/** Whether new accounts must confirm ownership before they can sign in. */
export const getEmailVerificationRequired = createServerFn({ method: 'GET' }).handler(
  async (): Promise<boolean> => Boolean(env.RESEND_API_KEY),
)

/** Public Turnstile site key for the auth forms, or null when bot protection is off. */
export const getTurnstileSiteKey = createServerFn({ method: 'GET' }).handler(
  async (): Promise<string | null> => env.TURNSTILE_SITE_KEY || null,
)
