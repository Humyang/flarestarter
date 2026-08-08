export const MAX_RENDER_SOURCE_BYTES = 100 * 1024 * 1024
export const RENDER_JOB_STATUSES = ['submitting', 'queued', 'running', 'completed', 'failed'] as const
export type RenderJobStatus = (typeof RENDER_JOB_STATUSES)[number]

export const SUBTITLE_TRANSLATION_LANGUAGES = [
  'original', 'en', 'zh', 'zh-tw', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'id', 'vi',
] as const
export type SubtitleTranslationLanguage = (typeof SUBTITLE_TRANSLATION_LANGUAGES)[number]

export const SUBTITLE_ANIMATION_IDS = [
  'alternatingSides',
  'mirrorExpand',
  'stackedSubtitle',
  'historyStack',
  'mixedSubtitle',
  'bankDeposit',
  'crowdedLately',
  'crowdedLatelyV2',
  'aiProductivity',
  'pixelEconomy',
  'wardrobeTyping',
  'introvertCommunication',
  'boldSubtitleShadow',
  'yellowTypeBoxSequence',
  'coralCleaningSequence',
  'resolveExpectations',
  'inflationBreakdown',
  'dailyPersistence',
  'subtitleBadge',
  'calmingSequence',
  'savingsContract',
  'mindfulnessTitles',
  'feynmanNotes',
  'oilPriceTransmission',
  'kineticCamera',
  'makeupTitles',
  'goodFortuneSequence',
  'insuranceWarnings',
  'cyanSubtitleSequence',
  'realEstateSalesSequence',
  'officeStretchSequence',
  'calmFocusSequence',
  'brighteningRoutineSequence',
  'eyeReliefRoutineSequence',
  'warmupBilingualSequence',
  'shadowTitleSequence',
  'splitColorSequence',
  'glowOutlineSequence',
  'prismStorySequence',
  'iridescentRelaySequence',
] as const
export type SubtitleAnimationId = (typeof SUBTITLE_ANIMATION_IDS)[number]

export const DEFAULT_SUBTITLE_ANIMATION_ID: SubtitleAnimationId = 'bankDeposit'

export interface RenderSubtitleOptions {
  translationLanguage: SubtitleTranslationLanguage
  animationId: SubtitleAnimationId
}

export function readRenderSubtitleOptions(input: {
  translationLanguage: unknown
  animationId: unknown
}): RenderSubtitleOptions | null {
  const translationLanguage = String(input.translationLanguage ?? '')
  const animationId = String(input.animationId ?? '')
  if (!SUBTITLE_TRANSLATION_LANGUAGES.includes(translationLanguage as SubtitleTranslationLanguage)) return null
  if (!SUBTITLE_ANIMATION_IDS.includes(animationId as SubtitleAnimationId)) return null
  return {
    translationLanguage: translationLanguage as SubtitleTranslationLanguage,
    animationId: animationId as SubtitleAnimationId,
  }
}

export interface RenderJobView {
  id: string
  title: string
  fileName: string
  status: RenderJobStatus
  phase: string | null
  error: string | null
  agentAttemptCount: number
  subtitleTranslationLanguage: SubtitleTranslationLanguage
  subtitleAnimationId: SubtitleAnimationId
  readyToDownload: boolean
  createdAt: string
  updatedAt: string
}

export type RenderUploadReason = 'noFile' | 'empty' | 'type' | 'size' | 'title' | 'subtitleOptions' | 'smartClip'

export type RetryRenderJobResult =
  | { ok: true; jobs: RenderJobView[] }
  | { ok: false; reason: 'notRetryable' | 'smartClip'; jobs: RenderJobView[] }

export type CreateRenderJobResult =
  | { ok: true; job: RenderJobView }
  | { ok: false; reason: RenderUploadReason }

export function validateRenderUpload(input: { type: string; size: number; title: string }): RenderUploadReason | null {
  if (!input.title.trim() || input.title.trim().length > 120) return 'title'
  if (input.size <= 0) return 'empty'
  if (input.size > MAX_RENDER_SOURCE_BYTES) return 'size'
  if (input.type !== 'video/mp4') return 'type'
  return null
}
