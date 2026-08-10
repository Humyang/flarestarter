import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'
import { useTranslation } from '@/features/i18n/provider'
import { trackMarketingCta } from '@/features/analytics/marketing'

/** Sticky Smart Clip header. Links + CTA collapse into a hamburger menu on mobile. */
export function SiteNav({ theme, loggedIn = false }: { theme: 'light' | 'dark'; loggedIn?: boolean }) {
  const { t, locale } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const navLinks = (
    <>
      <Link to="/{-$locale}" hash="render-workflow" className="rounded-md px-2 py-3 text-sm font-medium text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground md:py-2">
        {t('marketing.navFeatures')}
      </Link>
      <Link to="/{-$locale}/pricing" className="rounded-md px-2 py-3 text-sm font-medium text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground md:py-2">
        {t('marketing.navPricing')}
      </Link>
    </>
  )

  const cta = loggedIn
    ? <Link to="/{-$locale}/app/render" onClick={() => trackMarketingCta({ ctaId: 'nav_render', placement: 'site_nav', locale, destination: '/app/render' })} className={buttonVariants({ size: 'sm', className: 'min-h-11 md:min-h-0' })}>{t('marketing.heroCtaPrimary')}</Link>
    : <Link to="/{-$locale}/register" search={{ next: '/app/render' }} onClick={() => trackMarketingCta({ ctaId: 'nav_register', placement: 'site_nav', locale, destination: '/register' })} className={buttonVariants({ size: 'sm', className: 'min-h-11 md:min-h-0' })}>{t('marketing.heroCtaPrimary')}</Link>

  return (
    <header
      className="sticky top-0 z-30 border-b border-border backdrop-blur"
      style={{ background: 'color-mix(in srgb, var(--background) 82%, transparent)' }}
    >
      <nav className="flex h-16 items-center gap-3 px-4 md:px-7">
      <Link to="/{-$locale}" aria-label="Smart Clip" className="shrink-0">
          <Logo />
        </Link>
        <div className="flex-1" />

        {/* desktop */}
        <div className="hidden items-center gap-1 md:flex">{navLinks}</div>
        <div className="flex items-center gap-1">
          <ThemeToggle theme={theme} />
          <LangSwitch />
        </div>
        <div className="hidden md:block">{cta}</div>

        {/* mobile hamburger */}
        <button
          type="button"
          className="inline-flex h-12 w-12 items-center justify-center rounded-lg text-fg-2 hover:bg-bg-alt hover:text-foreground md:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          {navLinks}
          <div className="mt-2">{cta}</div>
        </div>
      )}
    </header>
  )
}
