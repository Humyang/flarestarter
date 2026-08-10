import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, CircleCheck, Clock3, Download, FileVideo, Languages, LoaderCircle, RotateCcw, Search, Sparkles, TriangleAlert, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { requireUser } from '@/features/auth/middleware'
import { getEntitlement } from '@/features/billing/middleware'
import { createRenderJobFn, listRenderJobsFn, retryRenderJobFn, syncRenderJobsFn } from '@/features/render-jobs/actions'
import {
  DEFAULT_SUBTITLE_ANIMATION_ID,
  SUBTITLE_ANIMATION_IDS,
  SUBTITLE_TRANSLATION_LANGUAGES,
  type RenderJobStatus,
  type RenderJobView,
  type SubtitleAnimationId,
  type SubtitleTranslationLanguage,
} from '@/features/render-jobs/render-job.shared'
import { AppShell } from '@/components/app/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/features/i18n/provider'
import { fmtDateTime } from '@/lib/format-date'
import { trackEvent } from '@/features/analytics/ga4'

export const Route = createFileRoute('/{-$locale}/app/render')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async ({ params }) => {
    const user = await requireUser({ data: {
      locale: (params as { locale?: string }).locale,
      next: '/app/render',
      entry: 'register',
    } })
    const [ent, jobs] = await Promise.all([
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

type RenderAnalyticsEvent = 'render_start' | 'render_complete'

function trackRenderEventOnce(
  eventName: RenderAnalyticsEvent,
  job: RenderJobView,
  locale: 'en' | 'zh',
  memorySeen: Set<string>,
) {
  if (typeof window === 'undefined') return
  const key = `smart_clip:ga4:${eventName}:v1:${job.id}`
  if (memorySeen.has(key)) return

  let storage: Storage | undefined
  try {
    storage = window.localStorage
    if (storage.getItem(key) === '1') {
      memorySeen.add(key)
      return
    }
  } catch {
    storage = undefined
  }

  const sent = trackEvent(eventName, {
    locale,
    animation_id: job.subtitleAnimationId,
    translation_language: job.subtitleTranslationLanguage,
  })
  if (!sent) return

  memorySeen.add(key)
  try {
    storage?.setItem(key, '1')
  } catch {
    // Analytics must not interrupt the render workflow when storage is unavailable.
  }
}

function trackResultDownload() {
  if (typeof window === 'undefined') return
  const key = 'smart_clip:ga4:first_download:v1'
  let storage: Storage | undefined
  let firstDownload = true
  try {
    storage = window.localStorage
    firstDownload = storage.getItem(key) !== '1'
  } catch {
    storage = undefined
  }

  if (!trackEvent('result_download', { first_download: firstDownload })) return
  if (!firstDownload) return
  try {
    storage?.setItem(key, '1')
  } catch {
    // Analytics must not interrupt a download when storage is unavailable.
  }
}

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

function previewLanguage(locale: 'en' | 'zh', translationLanguage: SubtitleTranslationLanguage) {
  if (translationLanguage === 'en') return 'en'
  if (translationLanguage === 'zh' || translationLanguage === 'zh-tw') return 'zh'
  return locale
}

function SubtitleAnimationPreview({
  animationId,
  translationLanguage,
  locale,
  t,
}: {
  animationId: SubtitleAnimationId
  translationLanguage: SubtitleTranslationLanguage
  locale: 'en' | 'zh'
  t: Translate
}) {
  const language = previewLanguage(locale, translationLanguage)
  const videoPath = `/subtitle-composition-preview/${language}/${animationId}.webm`
  return (
    <div
      className="subtitle-live-preview"
      role="img"
      aria-label={t('renderJobs.preview.aria', { animation: t(`renderJobs.animation.${animationId}`) })}
    >
      <video
        key={`${language}-${animationId}`}
        src={videoPath}
        poster={`/subtitle-composition-preview/${language}/${animationId}.jpg`}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="subtitle-live-preview__image"
      />
      <div className="subtitle-live-preview__topline">
        <span className="inline-flex items-center gap-1.5"><span className="subtitle-live-preview__dot" />{t('renderJobs.preview.live')}</span>
        <span>{t('renderJobs.preview.frame')}</span>
      </div>
      <div className="subtitle-live-preview__language">{t(`renderJobs.translation.${translationLanguage}`)}</div>
      <div className="subtitle-live-preview__timeline" aria-hidden="true"><span /></div>
    </div>
  )
}

function RenderJobsPage() {
  const initial = Route.useLoaderData()
  const { t, locale } = useTranslation()
  const [jobs, setJobs] = useState(initial.jobs)
  const [title, setTitle] = useState('')
  const [translationLanguage, setTranslationLanguage] = useState<SubtitleTranslationLanguage>('original')
  const [animationId, setAnimationId] = useState<SubtitleAnimationId>(DEFAULT_SUBTITLE_ANIMATION_ID)
  const [animationSearch, setAnimationSearch] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [animationLibraryOpen, setAnimationLibraryOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const trackedRenderEvents = useRef(new Set<string>())
  const hasActive = jobs.some((job) => ['submitting', 'queued', 'running'].includes(job.status))
  const normalizedAnimationSearch = animationSearch.trim().toLocaleLowerCase()
  const filteredAnimationIds = SUBTITLE_ANIMATION_IDS.filter((id) => (
    !normalizedAnimationSearch || `${id} ${t(`renderJobs.animation.${id}`)}`.toLocaleLowerCase().includes(normalizedAnimationSearch)
  ))

  function applyJobs(nextJobs: RenderJobView[]) {
    const previousJobs = jobsRef.current
    for (const job of nextJobs) {
      const previous = previousJobs.find((item) => item.id === job.id)
      if (job.status === 'completed' && previous && previous.status !== 'completed') {
        trackRenderEventOnce('render_complete', job, locale, trackedRenderEvents.current)
      }
    }
    jobsRef.current = nextJobs
    setJobs(nextJobs)
  }

  const jobsRef = useRef(initial.jobs)

  useEffect(() => {
    if (!hasActive) return
    const timer = window.setInterval(() => {
      void syncRenderJobsFn().then(applyJobs).catch(() => undefined)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [hasActive])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    const data = new FormData()
    data.set('title', title)
    data.set('subtitleTranslationLanguage', translationLanguage)
    data.set('subtitleAnimationId', animationId)
    if (file) data.set('file', file)
    setBusy(true)
    try {
      const result = await createRenderJobFn({ data })
      if (!result.ok) {
        toast.error(t(`renderJobs.errors.${result.reason}`))
        return
      }
      trackRenderEventOnce('render_start', result.job, locale, trackedRenderEvents.current)
      toast.success(t('renderJobs.submitted'))
      setTitle('')
      if (fileRef.current) fileRef.current.value = ''
      applyJobs(await syncRenderJobsFn())
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
      applyJobs(result.jobs)
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
      <div className="mb-6 max-w-6xl">
        <h1 className="page-h">{t('renderJobs.title')}</h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">{t('renderJobs.subtitle')}</p>
      </div>

      <Card className="form-surface max-w-6xl overflow-hidden p-0">
        <form onSubmit={submit} className="grid gap-0">
          <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-10">
            <section className="grid min-w-0 content-start gap-5" aria-labelledby="render-source-heading">
              <div className="form-section-heading">
                <span className="form-step">01</span>
                <div>
                  <h2 id="render-source-heading" className="form-section-title">{t('renderJobs.sourceStep')}</h2>
                  <p className="form-section-copy">{t('renderJobs.sourceStepHint')}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="render-title">{t('renderJobs.titleLabel')}</Label>
                <Input id="render-title" value={title} maxLength={120} required onChange={(e) => setTitle(e.target.value)} placeholder={t('renderJobs.titlePlaceholder')} />
                <div className="flex items-center justify-between gap-3 text-xs text-fg-3">
                  <span>{t('renderJobs.titleHint')}</span>
                  <span className="tabular-nums">{title.length}/120</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="render-file">{t('renderJobs.fileLabel')}</Label>
                <label htmlFor="render-file" className={`file-dropzone ${selectedFileName ? 'file-dropzone--selected' : ''}`}>
                  <span className="file-dropzone__icon"><FileVideo size={22} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{selectedFileName || t('renderJobs.fileDrop')}</span>
                    <span className="mt-1 block text-xs text-fg-3">{t('renderJobs.fileHint')}</span>
                  </span>
                  <span className="file-dropzone__action">{t('renderJobs.fileAction')}</span>
                </label>
                <Input ref={fileRef} id="render-file" type="file" accept="video/mp4" required className="sr-only" onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subtitle-language" className="flex items-center gap-1.5">
                  <Languages size={15} aria-hidden="true" /> {t('renderJobs.translationLabel')}
                </Label>
                <select
                  id="subtitle-language"
                  name="subtitleTranslationLanguage"
                  value={translationLanguage}
                  onChange={(event) => setTranslationLanguage(event.target.value as SubtitleTranslationLanguage)}
                  className="h-11 w-full rounded-[7px] border border-input bg-bg px-3 text-sm text-fg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  {SUBTITLE_TRANSLATION_LANGUAGES.map((language) => (
                    <option key={language} value={language}>{t(`renderJobs.translation.${language}`)}</option>
                  ))}
                </select>
                <p className="m-0 text-xs leading-5 text-fg-3">{t('renderJobs.translationHint')}</p>
              </div>
            </section>

            <fieldset className="grid min-w-0 content-start gap-3 border-0 p-0" aria-labelledby="render-style-heading">
              <legend className="sr-only">{t('renderJobs.animationLabel')}</legend>
              <div className="form-section-heading">
                <span className="form-step">02</span>
                <div>
                  <h2 id="render-style-heading" className="form-section-title">{t('renderJobs.styleStep')}</h2>
                  <p className="form-section-copy">{t('renderJobs.styleStepHint')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                <span className="flex items-center gap-1.5"><Sparkles size={15} aria-hidden="true" /> {t('renderJobs.animationLabel')}</span>
                <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{t('renderJobs.preview.live')}</span>
              </div>
              <div className="overflow-hidden rounded-[6px] border border-primary bg-bg ring-2 ring-primary/15">
                <SubtitleAnimationPreview animationId={animationId} translationLanguage={translationLanguage} locale={locale} t={t} />
                <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Check size={16} className="text-primary" aria-hidden="true" />
                    {t(`renderJobs.animation.${animationId}`)}
                  </span>
                </div>
              </div>
              <div className="mt-2 overflow-hidden rounded-[6px] border border-border bg-bg">
                <button
                  type="button"
                  aria-expanded={animationLibraryOpen}
                  aria-controls="subtitle-animation-library"
                  onClick={() => setAnimationLibraryOpen((open) => !open)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-bg-alt"
                >
                  <span>{t('renderJobs.browseAnimations', { count: SUBTITLE_ANIMATION_IDS.length })}</span>
                  <ChevronDown
                    size={17}
                    aria-hidden="true"
                    className={`shrink-0 text-fg-3 transition-transform ${animationLibraryOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {animationLibraryOpen && (
                  <div id="subtitle-animation-library" className="border-t border-border p-3">
                    <p className="mb-3 mt-0 text-xs text-fg-3">{t('renderJobs.animationLibraryDescription')}</p>
                    <div className="relative mb-3">
                      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
                      <Input
                        value={animationSearch}
                        onChange={(event) => setAnimationSearch(event.target.value)}
                        placeholder={t('renderJobs.searchAnimations')}
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-[430px] overflow-y-auto pr-1" role="radiogroup" aria-label={t('renderJobs.animationLabel')}>
                      {filteredAnimationIds.length === 0 ? (
                        <p className="py-10 text-center text-sm text-fg-3">{t('renderJobs.noAnimations')}</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {filteredAnimationIds.map((id) => {
                            const selected = animationId === id
                            return (
                              <button
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                key={id}
                                onClick={() => {
                                  setAnimationId(id)
                                  setAnimationSearch('')
                                }}
                                className={`group cursor-pointer overflow-hidden rounded-[6px] border bg-bg p-0 text-left transition-colors ${selected ? 'border-primary ring-2 ring-primary/15' : 'border-border hover:border-fg-3'}`}
                              >
                                <span className="block aspect-[328/160] overflow-hidden bg-inset">
                                  <video
                                    key={`${previewLanguage(locale, translationLanguage)}-${id}`}
                                    src={`/subtitle-composition-preview/${previewLanguage(locale, translationLanguage)}/${id}.webm`}
                                    poster={`/subtitle-composition-preview/${previewLanguage(locale, translationLanguage)}/${id}.jpg`}
                                    muted
                                    autoPlay
                                    loop
                                    playsInline
                                    preload="metadata"
                                    aria-hidden="true"
                                    className="size-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                  />
                                </span>
                                <span className="flex min-h-10 items-center justify-between gap-2 px-2.5 py-2 text-xs font-medium">
                                  <span>{t(`renderJobs.animation.${id}`)}</span>
                                  {selected && <Check size={15} className="shrink-0 text-primary" aria-hidden="true" />}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="mb-0 mt-2 text-xs text-fg-3">{t('renderJobs.animationHint')}</p>
            </fieldset>
          </div>
          <div className="form-actions">
            <div className="flex min-w-0 items-center gap-2 text-xs text-fg-3">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{t('renderJobs.formNote')}</span>
            </div>
            <Button type="submit" size="lg" disabled={busy}>
              <Upload size={16} aria-hidden="true" /> {busy ? t('renderJobs.uploading') : t('renderJobs.submit')}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 max-w-6xl">
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
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="pro">{t(`renderJobs.animation.${job.subtitleAnimationId}`)}</Badge>
                          <Badge variant="warn">{t(`renderJobs.translation.${job.subtitleTranslationLanguage}`)}</Badge>
                        </div>
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
                        <a
                          href={`/api/render-outputs/${job.id}`}
                          onClick={() => trackResultDownload()}
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                        >
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
