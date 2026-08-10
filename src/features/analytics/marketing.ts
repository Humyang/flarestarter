import type { Locale } from '@/features/i18n/locale'
import { trackEvent } from './ga4'

/** Record a marketing CTA without sending rendered copy or query parameters. */
export function trackMarketingCta(input: {
  ctaId: string
  placement: string
  locale: Locale
  destination: string
}) {
  trackEvent('cta_click', {
    cta_id: input.ctaId,
    placement: input.placement,
    locale: input.locale,
    destination: input.destination,
  })
}
