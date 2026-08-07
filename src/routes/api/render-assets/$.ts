import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { handleRenderAssetRequest } from '@/features/render-jobs/render-asset.api'

const handler = ({ request }: { request: Request }) => handleRenderAssetRequest(request, {
  DB: env.DB,
  BUCKET: env.BUCKET,
})

export const Route = createFileRoute('/api/render-assets/$')({
  server: { handlers: { GET: handler } },
})
