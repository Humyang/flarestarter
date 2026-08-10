import { createFileRoute } from '@tanstack/react-router'
import { buildSitemap } from '@/features/seo/seo'

const handler = async () => {
  const { env } = await import('@/lib/env')
  return new Response(buildSitemap(new URL(env.BETTER_AUTH_URL).origin), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}

export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: handler } },
})
