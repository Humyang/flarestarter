import { test, expect } from 'vitest'
import { buildRobots, buildSitemap, localeHead } from '@/features/seo/seo'
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
  expect(xml).not.toContain(`${origin}/pricing`)
  expect(xml).not.toContain(`${origin}/changelog`)
  expect(xml).not.toContain(`${origin}/sponsor`)
  expect(xml).not.toContain(`${origin}/waitlist`)
  expect(xml).not.toContain(`${origin}/status`)
})

test('sitemap includes single-locale docs paths without hreflang alternates', () => {
  const xml = buildSitemap(origin, ['/docs', '/docs/install'])
  // exact <url> block match — alternates would sit between </loc> and </url>
  expect(xml).toContain(`<url><loc>${origin}/docs</loc></url>`)
  expect(xml).toContain(`<url><loc>${origin}/docs/install</loc></url>`)
  // no zh-prefixed docs URL, and no alternate hreflang for docs
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
})
