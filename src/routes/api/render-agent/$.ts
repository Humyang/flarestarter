import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { handleRenderAgentRequest } from '@/features/render-jobs/render-agent.api'

const handler = ({ request }: { request: Request }) => handleRenderAgentRequest(request, {
  DB: env.DB,
  BUCKET: env.BUCKET,
  AGENT_SHARED_SECRET: (env as unknown as { AGENT_SHARED_SECRET?: string }).AGENT_SHARED_SECRET,
})

export const Route = createFileRoute('/api/render-agent/$')({
  server: { handlers: { GET: handler, POST: handler, PUT: handler } },
})
