import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { User, Mail, Lock } from 'lucide-react'
import { signUp } from '@/features/auth/auth.client'
import {
  authDestination,
  getEmailVerificationRequired,
  getEnabledSocialProviders,
  getTurnstileSiteKey,
  validateAuthSearch,
} from '@/features/auth/middleware'
import { mapAuthError } from '@/features/auth/errors'
import { useTurnstile, captchaHeaders } from '@/features/auth/components/turnstile'
import { useTranslation } from '@/features/i18n/provider'
import { authPageHead } from '@/features/auth/head'
import { AuthCard, Field } from '@/features/auth/components/auth-card'
import { SocialButtons } from '@/features/auth/components/social-buttons'
import { Button } from '@/components/ui/button'
import { localizePath } from '@/features/i18n/locale'
import { trackEvent } from '@/features/analytics/ga4'

const SIGN_UP_START_KEY = 'smart_clip:ga4:sign_up_start:v1'
const SIGN_UP_KEY = 'smart_clip:ga4:sign_up:v1'

function trackAuthEventOnce(key: string, locale: 'en' | 'zh', eventName: 'sign_up_start' | 'sign_up') {
  if (typeof window === 'undefined') return

  let storage: Storage | undefined
  try {
    storage = window.sessionStorage
    if (storage.getItem(key) === '1') return
  } catch {
    storage = undefined
  }

  if (!trackEvent(eventName, { locale, method: 'email' })) return
  try {
    storage?.setItem(key, '1')
  } catch {
    // Analytics must not interrupt account creation when storage is unavailable.
  }
}

export const Route = createFileRoute('/{-$locale}/(auth)/register')({
  head: ({ params }) => authPageHead(params, 'registerTitle'),
  validateSearch: validateAuthSearch,
  loader: async () => {
    const [providers, turnstileSiteKey, emailVerificationRequired] = await Promise.all([
      getEnabledSocialProviders(),
      getTurnstileSiteKey(),
      getEmailVerificationRequired(),
    ])
    return { providers, turnstileSiteKey, emailVerificationRequired }
  },
  component: Register,
})

function Register() {
  const { providers, turnstileSiteKey, emailVerificationRequired } = Route.useLoaderData()
  const { next } = Route.useSearch()
  const { t, locale } = useTranslation()
  const router = useRouter()
  const { token, enabled, widget, reset } = useTurnstile(turnstileSiteKey)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    trackAuthEventOnce(SIGN_UP_START_KEY, locale, 'sign_up_start')
    setBusy(true)
    setError(null)
    const destination = authDestination(next)
    const res = await signUp.email({
      email,
      password,
      name,
      callbackURL: localizePath(locale, destination),
    }, captchaHeaders(token))
    setBusy(false)
    if (res.error) {
      setError(t(mapAuthError(res.error)))
      reset() // tokens are single-use
      return
    }
    trackAuthEventOnce(SIGN_UP_KEY, locale, 'sign_up')
    if (emailVerificationRequired) {
      setSent(true)
      return
    }
    await router.navigate(destination === '/app/render'
      ? { to: '/{-$locale}/app/render' }
      : { to: '/{-$locale}/app' })
  }

  if (sent) {
    return (
      <AuthCard title={t('auth.verifyTitle')} subtitle={t('auth.verifySent')}>
        <Link to="/{-$locale}/verify-email" search={{ next }} className="font-semibold text-primary">
          {t('auth.resendVerification')}
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
      <form onSubmit={submit} className="grid gap-[15px]">
        <Field id="name" label={t('auth.name')} icon={User} value={name}
          onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        <Field id="email" label={t('auth.email')} type="email" icon={Mail} value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        <Field id="password" label={t('auth.password')} icon={Lock} canToggle value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password"
          hint={t('auth.pwHint')} />
        <label className="flex items-start gap-2 text-[13px] leading-relaxed text-fg-2">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
          />
          <span>
            {t('auth.agreePrefix')}{' '}
            <Link to="/{-$locale}/terms" target="_blank" className="font-semibold text-primary">{t('auth.agreeTerms')}</Link>{' '}
            {t('auth.agreeAnd')}{' '}
            <Link to="/{-$locale}/privacy" target="_blank" className="font-semibold text-primary">{t('auth.agreePrivacy')}</Link>.
          </span>
        </label>
        {widget}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !termsAccepted || (enabled && !token)}>
          {t('auth.register')}
        </Button>
      </form>
      <SocialButtons providers={providers} callbackURL={localizePath(locale, authDestination(next))} />
      <p className="mt-5 text-center text-sm text-fg-2">
        {t('auth.haveAccount')}{' '}
        <Link to="/{-$locale}/login" search={{ next }} className="font-semibold text-primary">
          {t('auth.login')}
        </Link>
      </p>
    </AuthCard>
  )
}
