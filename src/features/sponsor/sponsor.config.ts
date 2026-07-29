import type { WechatCurrency } from './currency'

export interface SponsorTier {
  amountCents: number
  nameKey: string
  popular?: boolean
}

/** Single customization panel. Forkers edit THIS file (+ i18n sponsor.* copy)
 *  to retune amounts, thresholds, and which parts show. */
export const sponsorConfig = {
  currency: 'usd' as const,
  minCents: 100, // $1
  maxCents: 1_000_000, // $10,000
  messageMaxLen: 80,
  modes: { once: true, monthly: true }, // enable/disable each period
  fields: { github: true, message: true }, // enable/disable optional fields
  /** WeChat Pay via Stripe's `wechat_pay` — no WeChat merchant account involved.
   *  One-time sponsorships only: wechat_pay supports neither subscription nor setup
   *  mode (recurring is still private preview).
   *
   *  `currency` is constrained by the Stripe MERCHANT country and Stripe rejects a
   *  mismatch: cny -> all countries, hkd -> HK, usd -> US, sgd -> SG, jpy -> JP,
   *  gbp -> UK, aud -> AU, cad -> CA, eur/dkk/nok/sek/chf -> respective countries.
   *  The customer always sees a converted CNY amount in WeChat regardless.
   *
   *  `usdRate` = 1 USD in `currency`. Applied once at checkout and frozen into the
   *  order (see currency.ts), so changing it only affects new orders. */
  wechat: {
    currency: 'hkd' as WechatCurrency,
    usdRate: 7.8, // HKD is pegged to 7.75-7.85, so FX drift is negligible
  },
  wall: { enabled: true, goldCents: 10000, backersCents: 2500 }, // Gold ≥ gold; Backers ≥ backers; Supporters below
  tiers: {
    monthly: [
      { amountCents: 500, nameKey: 'supporter' },
      { amountCents: 2500, nameKey: 'backer', popular: true },
      { amountCents: 10000, nameKey: 'sponsor' },
    ],
    once: [
      { amountCents: 1500, nameKey: 'coffee' },
      { amountCents: 7500, nameKey: 'believer', popular: true },
      { amountCents: 30000, nameKey: 'patron' },
    ],
  } satisfies { monthly: SponsorTier[]; once: SponsorTier[] },
}

/** Whether to offer WeChat Pay: Stripe is configured and the kill switch is off.
 *
 *  On by default — whether the Stripe account has actually enabled wechat_pay is not
 *  detectable from here, so enable it in Dashboard -> Payment methods before shipping,
 *  and set `STRIPE_WECHAT_PAY_ENABLED=false` to pull it offline.
 *
 *  Takes env as a param instead of importing `@/lib/env`, so this module stays
 *  client-importable. */
export function isWechatPayEnabled(env: {
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  STRIPE_WECHAT_PAY_ENABLED?: string
}): boolean {
  return !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WEBHOOK_SECRET && env.STRIPE_WECHAT_PAY_ENABLED !== 'false'
}
