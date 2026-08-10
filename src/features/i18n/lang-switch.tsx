import { useRouter } from '@tanstack/react-router'
import { Globe } from 'lucide-react'
import { defaultLocale, type Locale } from './locale'
import { useTranslation } from './provider'

/** Compact globe toggle — switches between the two locales (en ⇄ zh). */
export function LangSwitch() {
  const router = useRouter()
  const { locale, t } = useTranslation()
  const next: Locale = locale === 'en' ? 'zh' : 'en'

  function switchTo(target: Locale) {
    // Read the current path/search/hash as plain strings (the handler only runs
    // client-side). useLocation().search is a null-prototype object that throws
    // on string coercion, so we use window.location here instead.
    const { pathname, search, hash } = window.location
    const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
    const newPath =
      target === defaultLocale ? stripped : `/${target}${stripped === '/' ? '' : stripped}`
    const href = newPath + search + hash
    // 持久化语言偏好：auth 邮件（验证/重置）按此 cookie 选语言（见 localeFromRequest），
    // 否则 zh 用户在英文浏览器上会收到英文邮件。
    document.cookie = `locale=${target}; path=/; max-age=31536000; samesite=lax`
    router.navigate({ href, replace: true } as never)
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(next)}
      aria-label={t('common.language')}
      className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-transparent px-2.5 text-sm font-semibold text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground md:h-[38px]"
    >
      <Globe size={17} />
      <span>{locale === 'zh' ? '中文' : 'EN'}</span>
    </button>
  )
}
