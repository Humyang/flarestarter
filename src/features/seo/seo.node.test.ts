import { test, expect } from 'vitest'
import {
  buildHomepageJsonLd,
  buildLlmsFullText,
  buildLlmsIndex,
  buildRobots,
  buildSitemap,
  localeHead,
} from '@/features/seo/seo'
import { localizePath } from '@/features/i18n/locale'

const origin = 'https://app.example.com'

test('localizePath: en no prefix, zh prefixed', () => {
  expect(localizePath('en', '/')).toBe('/')
  expect(localizePath('zh', '/')).toBe('/zh')
  expect(localizePath('en', '/pricing')).toBe('/pricing')
  expect(localizePath('zh', '/pricing')).toBe('/zh/pricing')
})

test('robots disallows app/admin/api + lists sitemap', () => {
  const r = buildRobots(origin)
  expect(r).toContain('Disallow: /*/app')
  expect(r).toContain('Disallow: /app')
  expect(r).toContain('Disallow: /*/admin')
  expect(r).toContain('Disallow: /api')
  expect(r).toContain(`Sitemap: ${origin}/sitemap.xml`)
})

test('sitemap lists both locales of the customer homepage with hreflang', () => {
  const xml = buildSitemap(origin)
  expect(xml).toContain('<urlset')
  expect(xml).toContain(`<loc>${origin}/</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh</loc>`)
  expect(xml).toContain('hreflang="en"')
  expect(xml).toContain('hreflang="zh"')
  expect(xml).toContain('hreflang="x-default"')
  expect(xml).toContain(`<loc>${origin}/pricing</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh/pricing</loc>`)
  expect(xml).not.toContain(`${origin}/changelog`)
  expect(xml).not.toContain(`${origin}/sponsor`)
  expect(xml).not.toContain(`${origin}/waitlist`)
  expect(xml).not.toContain(`${origin}/status`)
})

test('sitemap ignores legacy docs paths even when a caller supplies them', () => {
  const xml = buildSitemap(origin, ['/docs', '/docs/install'])
  expect(xml).not.toContain(`${origin}/docs`)
  expect(xml).not.toContain(`${origin}/zh/docs`)
})

test('localeHead: canonical + hreflang alternates + og', () => {
  const head = localeHead({ origin, locale: 'zh', path: '/pricing', title: 'T', description: 'D' })
  expect(head.links.find((l) => l.rel === 'canonical')?.href).toBe(`${origin}/zh/pricing`)
  expect(head.links.some((l) => l.rel === 'alternate' && l.hrefLang === 'en' && l.href === `${origin}/pricing`)).toBe(true)
  expect(head.links.some((l) => l.rel === 'alternate' && l.hrefLang === 'zh' && l.href === `${origin}/zh/pricing`)).toBe(true)
  expect(head.links.some((l) => l.hrefLang === 'x-default')).toBe(true)
  expect(head.meta.some((m) => m.title === 'T')).toBe(true)
  expect(head.meta.some((m) => m.property === 'og:url' && m.content === `${origin}/zh/pricing`)).toBe(true)
  expect(head.meta.some((m) => m.property === 'og:image' && m.content === `${origin}/og/smart-clip.png`)).toBe(true)
  expect(head.meta.some((m) => m.property === 'og:image:width' && m.content === '1200')).toBe(true)
  expect(head.meta.some((m) => m.property === 'og:image:height' && m.content === '630')).toBe(true)
  expect(head.meta.some((m) => m.name === 'twitter:image' && m.content === `${origin}/og/smart-clip.png`)).toBe(true)
})

test('homepage JSON-LD contains only verified product facts', () => {
  const jsonLd = buildHomepageJsonLd({ origin, locale: 'en' })
  expect(jsonLd['@context']).toBe('https://schema.org')
  expect(jsonLd['@graph']).toHaveLength(3)
  const software = jsonLd['@graph'].find((entry) => entry['@type'] === 'SoftwareApplication')
  expect(software).toBeDefined()
  expect(software).not.toHaveProperty('offers')
  expect(JSON.stringify(jsonLd)).not.toMatch(/aggregateRating|review|InStock|199|499/i)
})

test('llms pages expose product facts, not template internals', () => {
  const index = buildLlmsIndex(origin)
  const full = buildLlmsFullText(origin)
  expect(index).toContain('MP4 files up to 100 MB')
  expect(full).toContain('Retry a failed task')
  expect(`${index}\n${full}`).not.toMatch(/fork|wrangler|D1|environment variable|deploy/i)
})
