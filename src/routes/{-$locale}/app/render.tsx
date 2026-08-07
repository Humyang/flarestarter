import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CircleCheck, Clock3, Download, LoaderCircle, RotateCcw, TriangleAlert, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { requireUser } from '@/features/auth/middleware'
import { getEntitlement } from '@/features/billing/middleware'
import { createRenderJobFn, listRenderJobsFn, retryRenderJobFn, syncRenderJobsFn } from '@/features/render-jobs/actions'
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

const PHASE_KEYS: Record<string, string> = {
  submit: 'submitting',
  'awaiting-agent': 'awaitingAgent',
  'agent-claimed': 'agentClaimed',
  'source-download': 'sourceDownload',
  'source-imported': 'sourceImported',
  'smart-clip-submit': 'smartClipSubmit',
  'subtitle-preparation': 'subtitlePreparation',
  'smart-editing': 'smartEditing',
  'awaiting-edit': 'awaitingEdit',
  'render-queued': 'renderQueued',
  rendering: 'rendering',
  done: 'done',
  'agent-failed': 'agentFailed',
  'agent-timeout': 'agentTimeout',
  'sync-error': 'syncError',
}

const PHASE_PROGRESS: Record<string, number> = {
  submit: 10,
  'awaiting-agent': 22,
  'agent-claimed': 30,
  'source-download': 38,
  'source-imported': 46,
  'smart-clip-submit': 52,
  'subtitle-preparation': 60,
  'smart-editing': 68,
  'awaiting-edit': 74,
  'render-queued': 80,
  rendering: 90,
  done: 100,
}

type Translate = (key: string, params?: Record<string, string | number>) => string

function jobPhase(job: RenderJobView, t: Translate) {
  const fallback = job.status === 'failed' ? 'failed' : job.status === 'submitting' ? 'submitting' : job.status
  return t(`renderJobs.phase.${PHASE_KEYS[job.phase ?? ''] ?? fallback}`)
}

function jobProgress(job: RenderJobView) {
  if (job.status === 'completed' || job.status === 'failed') return 100
  if (job.status === 'submitting') return 10
  if (job.status === 'queued') return PHASE_PROGRESS[job.phase ?? ''] ?? 22
  return PHASE_PROGRESS[job.phase ?? ''] ?? 34
}

function friendlyError(job: RenderJobView, t: Translate) {
  if (!job.error) return null
  if (job.phase === 'agent-timeout') return t('renderJobs.errors.agentTimeout')
  if (job.error.includes('SUCCESS_WITH_NO_VALID_FRAGMENT')) return t('renderJobs.errors.noSpeech')
  if (/fetch failed|timeout|timed out|network|connection/i.test(job.error)) return t('renderJobs.errors.temporary')
  return t('renderJobs.errors.processing')
}

function StatusIcon({ status }: { status: RenderJobStatus }) {
  if (status === 'completed') return <CircleCheck size={18} className="text-success" />
  if (status === 'failed') return <TriangleAlert size={18} className="text-destructive" />
  if (status === 'running') return <LoaderCircle size={18} className="animate-spin text-primary" />
  if (status === 'queued') return <Clock3 size={18} className="text-fg-2" />
  return <Upload size={18} className="text-fg-2" />
}

function RenderJobsPage() {
  const initial = Route.useLoaderData()
  const { t } = useTranslation()
  const [jobs, setJobs] = useState(initial.jobs)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
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

  async function retry(jobId: string) {
    setRetryingId(jobId)
    try {
      const result = await retryRenderJobFn({ data: { id: jobId } })
      setJobs(result.jobs)
      if (result.ok) toast.success(t('renderJobs.retried'))
      else toast.error(t(`renderJobs.errors.${result.reason}`))
    } catch {
      toast.error(t('renderJobs.errors.unknown'))
    } finally {
      setRetryingId(null)
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

      <div className="mt-8 max-w-4xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-[15px] font-semibold">{t('renderJobs.mine')}</h2>
          {hasActive && <Badge variant="pro" dot>{t('renderJobs.active')}</Badge>}
        </div>
        {jobs.length === 0 && <p className="text-sm text-fg-3">{t('renderJobs.empty')}</p>}
        <div className="grid gap-3">
          {jobs.map((job: RenderJobView) => {
            const progress = jobProgress(job)
            const error = friendlyError(job, t)
            const recoveryCount = Math.max(0, job.agentAttemptCount - 1)
            return (
              <Card key={job.id} className="overflow-hidden rounded-[8px] p-0">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-border bg-bg-alt">
                        <StatusIcon status={job.status} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{job.title}</span>
                          <Badge variant={STATUS_VARIANT[job.status]}>{t(`renderJobs.status.${job.status}`)}</Badge>
                        </div>
                        <p className="mb-0 mt-1 truncate text-sm text-fg-2">{job.fileName}</p>
                      </div>
                    </div>
                    <div className="flex min-h-9 items-center gap-2">
                      {job.status === 'failed' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={retryingId !== null}
                          onClick={() => void retry(job.id)}
                        >
                          <RotateCcw size={15} /> {retryingId === job.id ? t('renderJobs.retrying') : t('renderJobs.retry')}
                        </Button>
                      )}
                      {job.readyToDownload && (
                        <a href={`/api/render-outputs/${job.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                          <Download size={15} /> {t('renderJobs.download')}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-fg-2">{jobPhase(job, t)}</span>
                      <span className="text-fg-3">{t('renderJobs.updated', { time: fmtDateTime(job.updatedAt) })}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-inset" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${job.status === 'failed' ? 'bg-destructive' : job.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {recoveryCount > 0 && job.status !== 'completed' && (
                      <div className="flex items-center gap-1.5 text-xs text-fg-3">
                        <RotateCcw size={12} /> {t('renderJobs.recovered', { count: recoveryCount })}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 border-l-2 border-destructive pl-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
