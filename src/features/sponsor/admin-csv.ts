import type { AdminSponsorRow } from './sponsor.server'

function cell(v: string): string {
  // Neutralize spreadsheet formula prefixes (CSV injection) — see waitlist/csv.ts.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function sponsorsToCsv(rows: AdminSponsorRow[]): string {
  // Both amount columns ship: amount_cents/currency reconciles against Stripe, while
  // amount_usd_cents is what wall tiering and cross-currency totals are based on.
  const header = 'email,github,amount_cents,currency,amount_usd_cents,mode,status,message,hidden,created_at'
  const body = rows.map((r) => {
    const created = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
    return [cell(r.email ?? ''), cell(r.github ?? ''), String(r.amount), cell(r.currency), String(r.amountUsd ?? r.amount), cell(r.mode), cell(r.status), cell(r.message ?? ''), r.hidden ? '1' : '0', cell(created)].join(',')
  })
  return [header, ...body].join('\n') + '\n'
}
