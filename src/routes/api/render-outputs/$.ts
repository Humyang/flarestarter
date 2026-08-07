import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { createAuth } from '@/features/auth/auth.server'
import { renderJob } from '@/features/render-jobs/render-job.schema'

const handler = async ({ request }: { request: Request }) => {
  const db = createDb(env.DB)
  const session = await createAuth(env, db).api.getSession({ headers: request.headers })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })
  const id = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  const [job] = await db.select().from(renderJob)
    .where(and(eq(renderJob.id, id), eq(renderJob.userId, session.user.id))).limit(1)
  if (!job?.outputKey) return new Response('Not found', { status: 404 })
  const object = await env.BUCKET.get(job.outputKey)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers({
    'Content-Type': 'video/mp4',
    'Content-Disposition': `attachment; filename="${job.id}.mp4"`,
    'Content-Length': String(object.size),
  })
  return new Response(object.body, { headers })
}

export const Route = createFileRoute('/api/render-outputs/$')({
  server: { handlers: { GET: handler } },
})
