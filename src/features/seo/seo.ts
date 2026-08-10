import { locales, defaultLocale, localizePath, type Locale } from '@/features/i18n/locale'

/**
 * Keep this list intentionally small. A URL belongs here only when it is a
 * canonical, user-facing acquisition page with stable copy and a crawlable
 * route. Private, operational, template, and legal-placeholder pages stay out
 * of the XML sitemap.
 */
export const INDEXABLE_MARKETING_PATHS = ['/', '/pricing'] as const

export const OG_IMAGE_PATH = '/og/smart-clip.png'

const VERIFIED_PRODUCT_FACTS = [
  'Smart Clip is a web workspace for turning one source video into a rendered MP4 result.',
  'The current render form accepts MP4 files up to 100 MB.',
  'A render can include a project title, a subtitle animation style, and a translation language.',
  'The product currently exposes 40 subtitle animation styles and 12 language options, including the original language.',
  'The render queue exposes queued, processing, completed, and failed states; failed jobs can be retried.',
  'Completed renders can be downloaded as MP4 files by the signed-in project owner.',
  'The product is in a controlled free beta. Future paid plans are not currently published.',
] as const

export function buildLlmsIndex(origin: string): string {
  return [
    '# Smart Clip',
    '',
    '> A web workspace for rendering subtitled videos from MP4 sources.',
    '',
    '## Product',
    '',
    ...VERIFIED_PRODUCT_FACTS.map((fact) => `- ${fact}`),
    '',
    '## Public pages',
    '',
    `- Homepage: ${origin}/`,
    `- 中文首页: ${origin}/zh`,
    `- Plans: ${origin}/pricing`,
    `- 中文版本: ${origin}/zh/pricing`,
    '',
    '## Scope',
    '',
    'Describe only the capabilities and limits listed above. Do not infer customer counts, performance guarantees, ratings, reviews, or paid-plan pricing.',
    '',
  ].join('\n')
}

export function buildLlmsFullText(origin: string): string {
  return [
    '# Smart Clip product facts',
    '',
    ...VERIFIED_PRODUCT_FACTS.map((fact) => `- ${fact}`),
    '',
    '## Render workflow',
    '',
    '1. Sign in and open the render workspace.',
    '2. Upload one MP4 source within the 100 MB limit and give the project a recognizable title.',
    '3. Choose one of the available subtitle styles and a language option.',
    '4. Submit the render and follow its queue status.',
    '5. Retry a failed task when needed, then download the completed MP4.',
    '',
    '## Links',
    '',
    `- ${origin}/`,
    `- ${origin}/zh`,
    `- ${origin}/pricing`,
    `- ${origin}/zh/pricing`,
    '',
  ].join('\n')
}

// Open Graph 要求 language_TERRITORY 形态（en_US），裸语言码会被严格解析器忽略。
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', zh: 'zh_CN' }

export function buildRobots(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /*/app',
    'Disallow: /app',
    'Disallow: /*/admin',
    'Disallow: /admin',
    'Disallow: /api',
    `Sitemap: ${origin}/sitemap.xml`,
    // LLM-friendly docs (no standard robots directive — comment for discovery).
    `# llms.txt: ${origin}/llms.txt`,
    `# llms-full.txt: ${origin}/llms-full.txt`,
    '',
  ].join('\n')
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }
    return entities[character] ?? character
  })
}

function alternates(origin: string, path: string): string {
  const links = locales.map(
    (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${origin}${localizePath(l, path)}"/>`,
  )
  links.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localizePath(defaultLocale, path)}"/>`,
  )
  return links.join('')
}

export function buildSitemap(origin: string, _legacySingleLocalePaths: string[] = []): string {
  const bilingual = locales.flatMap((l) =>
    INDEXABLE_MARKETING_PATHS.map(
      (p) => `<url><loc>${escapeXml(origin)}${escapeXml(localizePath(l, p))}</loc>${alternates(origin, p)}</url>`,
    ),
  )
  // The second argument is retained for source compatibility with older
  // callers, but legacy docs paths must never re-enter the public sitemap.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${bilingual.join('')}</urlset>`
}

export interface HeadLink {
  rel: string
  href: string
  hrefLang?: string  // React/HTML camelCase prop name (renders to the `hreflang` attribute)
}

export interface HeadMeta {
  title?: string
  name?: string
  property?: string
  content?: string
}

export interface HomepageJsonLdInput {
  origin: string
  locale: Locale
}

/**
 * JSON-LD for the public homepage. Every capability here is represented by
 * the current render workflow; intentionally no ratings, reviews, or future
 * paid-plan offers are emitted.
 */
export function buildHomepageJsonLd({ origin, locale }: HomepageJsonLdInput) {
  const url = `${origin}${localizePath(locale, '/')}`
  const description =
    locale === 'zh'
      ? '上传 MP4，选择字幕样式和语言，生成并下载 Smart Clip 成片。'
      : 'Upload an MP4, choose a subtitle style and language, and download a finished Smart Clip render.'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'Smart Clip',
        url: origin,
        logo: `${origin}/logo512.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'Smart Clip',
        url,
        inLanguage: locale,
        publisher: { '@id': `${origin}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${origin}/#software`,
        name: 'Smart Clip',
        url,
        description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        featureList: [
          'MP4 upload up to 100 MB',
          '40 subtitle animation styles',
          '12 language options',
          'Render queue status and retry for failed jobs',
          'Downloadable MP4 results',
        ],
      },
    ],
  }
}

export function localeHead(input: {
  origin: string
  locale: Locale
  path: string
  title: string
  description: string
}): { meta: HeadMeta[]; links: HeadLink[] } {
  const { origin, locale, path, title, description } = input
  const canonical = `${origin}${localizePath(locale, path)}`
  const links: HeadLink[] = [{ rel: 'canonical', href: canonical }]
  for (const l of locales) {
    links.push({ rel: 'alternate', hrefLang: l, href: `${origin}${localizePath(l, path)}` })
  }
  links.push({
    rel: 'alternate',
    hrefLang: 'x-default',
    href: `${origin}${localizePath(defaultLocale, path)}`,
  })
  const meta: HeadMeta[] = [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: `${origin}${OG_IMAGE_PATH}` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: `Smart Clip — ${title}` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: `${origin}${OG_IMAGE_PATH}` },
    { name: 'twitter:image:alt', content: `Smart Clip — ${title}` },
  ]
  return { meta, links }
}

export function noIndexMeta(meta: HeadMeta[] = []): HeadMeta[] {
  return [...meta, { name: 'robots', content: 'noindex,follow' }]
}
