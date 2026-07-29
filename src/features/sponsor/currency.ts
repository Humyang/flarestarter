import { sponsorConfig } from './sponsor.config'

/**
 * Sponsorships are priced in USD, but Stripe's `wechat_pay` cannot be charged in
 * USD outside a US account — so a WeChat row carries two amounts: what was really
 * charged (`amount` + `currency`) and the USD equivalent frozen at checkout
 * (`amountUsd`).
 *
 * The wall SUMS a handle's rows before comparing tier thresholds, so it must use
 * the frozen USD value: adding HKD minor units into USD cents reads HK$78 as $78.
 * Freezing rather than converting on read also keeps historical rows stable when
 * `usdRate` is later adjusted.
 */

/** Presentment currencies Stripe supports for `wechat_pay`. Which ones are usable
 *  depends on the Stripe merchant country — see sponsor.config.ts. */
export type WechatCurrency =
  | 'cny' | 'hkd' | 'usd' | 'aud' | 'cad' | 'eur'
  | 'gbp' | 'jpy' | 'sgd' | 'dkk' | 'nok' | 'sek' | 'chf'

/** Currencies whose minor unit IS the whole unit. Only jpy among those above. */
const ZERO_DECIMAL: ReadonlySet<string> = new Set(['jpy'])

function minorPerUnit(currency: string): number {
  return ZERO_DECIMAL.has(currency.toLowerCase()) ? 1 : 100
}

/** USD cents to minor units of the WeChat presentment currency. The only FX
 *  conversion in the flow: it runs once at checkout and is frozen into the order. */
export function wechatChargeMinor(usdCents: number): number {
  const { currency, usdRate } = sponsorConfig.wechat
  return Math.round((usdCents / 100) * usdRate * minorPerUnit(currency))
}

/** Fallback for rows with no frozen USD value — those written before the
 *  `amount_usd` column, or with lost metadata. Display and tiering only.
 *  An unrecognized non-USD currency is returned as-is rather than guessed: a wrong
 *  guess silently corrupts wall tiers, whereas a low tier is admin-fixable. */
export function usdCentsFallback(minor: number, currency: string): number {
  const c = currency.toLowerCase()
  if (c === 'usd') return minor
  const { currency: wechatCurrency, usdRate } = sponsorConfig.wechat
  if (c === wechatCurrency.toLowerCase() && usdRate > 0) {
    return Math.round((minor / minorPerUnit(c) / usdRate) * 100)
  }
  return minor
}

const SYMBOLS: Record<string, string> = {
  usd: '$', hkd: 'HK$', cny: '¥', jpy: '¥', eur: '€', gbp: '£',
  aud: 'A$', cad: 'C$', sgd: 'S$', chf: 'CHF ', dkk: 'kr ', nok: 'kr ', sek: 'kr ',
}

/** Minor units to a symbol-prefixed string, e.g. 58500 + hkd -> `HK$585.00`. */
export function formatMinor(minor: number, currency: string): string {
  const c = currency.toLowerCase()
  const per = minorPerUnit(c)
  const symbol = SYMBOLS[c] ?? `${c.toUpperCase()} `
  return `${symbol}${(minor / per).toFixed(per === 1 ? 0 : 2)}`
}
