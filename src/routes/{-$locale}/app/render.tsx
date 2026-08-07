import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Download, Film, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { requireUser } from '@/features/auth/middleware'
import { getEntitlement } from '@/features/billing/middleware'
import { createRenderJobFn, listRenderJobsFn, syncRenderJobsFn } from '@/features/render-jobs/actions'
import type { RenderJobStatus, RenderJobView } from '@/features/render-jobs/render-job.shared'
import { AppShell } from '@/components/app/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/features/i18n/provider'
import { fmtDateTime } from '@/lib/format-date'

export const Route = createFileRoute('/{-$locale}/app/render')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async ({ params }) => {
    const [user, ent, jobs] = await Promise.all([
      requireUser({ data: { locale: (params as { locale?: string }).locale } }),
      getEntitlement(),
      listRenderJobsFn(),
    ])
    return { user, ent, jobs }
  },
  component: RenderJobsPage,
})

const STATUS_VARIANT: Record<RenderJobStatus, 'free' | 'pro' | 'ok' | 'warn'> = {
  submitting: 'warn', queued: 'warn', running: 'pro', completed: 'ok', failed: 'free',
}

function RenderJobsPage() {
  const initial = Route.useLoaderData()
  const { t } = useTranslation()
  const [jobs, setJobs] = useState(initial.jobs)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const hasActive = jobs.some((job) => ['submitting', 'queued', 'running'].includes(job.status))

  useEffect(() => {
    if (!hasActive) return
    const timer = window.setInterval(() => {
      void syncRenderJobsFn().then(setJobs).catch(() => undefined)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [hasActive])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    const data = new FormData()
    data.set('title', title)
    if (file) data.set('file', file)
    setBusy(true)
    try {
      const result = await createRenderJobFn({ data })
      if (!result.ok) {
        toast.error(t(`renderJobs.errors.${result.reason}`))
        return
      }
      toast.success(t('renderJobs.submitted'))
      setTitle('')
      if (fileRef.current) fileRef.current.value = ''
      setJobs(await syncRenderJobsFn())
    } catch {
      toast.error(t('renderJobs.errors.unknown'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell user={initial.user} isPro={initial.ent.plan === 'pro'} active="render" crumb={t('renderJobs.nav')} paymentFailed={initial.ent.paymentFailed}>
      <div className="mb-6">
        <h1 className="page-h">{t('renderJobs.title')}</h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">{t('renderJobs.subtitle')}</p>
      </div>

      <Card className="max-w-xl p-5">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="render-title">{t('renderJobs.titleLabel')}</Label>
            <Input id="render-title" value={title} maxLength={120} required onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="render-file">{t('renderJobs.fileLabel')}</Label>
            <Input ref={fileRef} id="render-file" type="file" accept="video/mp4" required />
            <p className="m-0 text-xs text-fg-3">{t('renderJobs.fileHint')}</p>
          </div>
          <div>
            <Button type="submit" disabled={busy}>
              <Upload size={16} /> {busy ? t('renderJobs.uploading') : t('renderJobs.submit')}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 max-w-3xl">
        <h2 className="mb-3 text-[15px] font-semibold">{t('renderJobs.mine')}</h2>
        {jobs.length === 0 && <p className="text-sm text-fg-3">{t('renderJobs.empty')}</p>}
        <div className="grid gap-3">
          {jobs.map((job: RenderJobView) => (
            <Card key={job.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Film size={16} className="text-fg-3" />
                    <span className="font-semibold">{job.title}</span>
                    <Badge variant={STATUS_VARIANT[job.status]}>{t(`renderJobs.status.${job.status}`)}</Badge>
                  </div>
                  <p className="mb-0 mt-1.5 truncate text-sm text-fg-2">{job.fileName}</p>
                  <p className="mb-0 mt-1 font-mono text-xs text-fg-3">
                    {job.phase ? `${job.phase} · ` : ''}{fmtDateTime(job.createdAt)}
                  </p>
                  {job.error && <p className="mb-0 mt-2 text-sm text-destructive">{job.error}</p>}
                </div>
                {job.readyToDownload && (
                  <a href={`/api/render-outputs/${job.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    <Download size={15} /> {t('renderJobs.download')}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
