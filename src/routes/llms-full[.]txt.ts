import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsFullText } from '@/features/seo/seo'

const handler = async () => {
  const { env } = await import('@/lib/env')
  return new Response(buildLlmsFullText(new URL(env.BETTER_AUTH_URL).origin), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}

export const Route = createFileRoute('/llms-full.txt')({
  server: { handlers: { GET: handler } },
})
