import { createFileRoute } from '@tanstack/react-router'
import { source } from '@/features/docs/source'
import { getLLMText } from '@/features/docs/llm'

/**
 * Serves a docs page as LLM-friendly Markdown (`# title (url)` + body, no
 * frontmatter) — the target of the "Copy Markdown" button and handy for LLMs.
 * Slug is the path after `/docs-md/` (empty = the docs index).
 */
const handler = async ({ request }: { request: Request }) => {
  const path = new URL(request.url).pathname
    .replace(/^\/docs-md\/?/, '')
    .replace(/\.mdx?$/, '')
  // 畸形百分号编码（如 /docs-md/%zz）会让 decodeURIComponent 抛 URIError——是 404 不是 500。
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  const slugs = decoded.split('/').filter(Boolean)
  const page = source.getPage(slugs)
  if (!page) return new Response('Not found', { status: 404 })
  const text = getLLMText(page)
  if (text == null) return new Response('Not found', { status: 404 })
  return new Response(text, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}

export const Route = createFileRoute('/docs-md/$')({
  server: { handlers: { GET: handler } },
})
