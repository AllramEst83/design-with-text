import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'editorial-reader-settings-v1'

export type ReaderBgPreset = 'wheat' | 'sepia' | 'velvet'

export interface ReaderSettings {
  fontSizePx: number
  fontFamily: string
  lineHeight: number
  maxWidthRem: number
  letterSpacingEm: number
  bgPreset: ReaderBgPreset
}

const defaults: ReaderSettings = {
  fontSizePx: 18,
  fontFamily: 'Newsreader, serif',
  lineHeight: 1.6,
  maxWidthRem: 40,
  letterSpacingEm: 0,
  bgPreset: 'wheat',
}

export const bgTokens: Record<
  ReaderBgPreset,
  { bg: string; fg: string; link: string; muted: string }
> = {
  wheat: {
    bg: '#faf9f3',
    fg: '#1b1c19',
    link: '#4b4bd4',
    muted: '#6a5d43',
  },
  sepia: {
    bg: '#e6dcc6',
    fg: '#1b1c19',
    link: '#4b4bd4',
    muted: '#5f5138',
  },
  velvet: {
    bg: '#1a1a22',
    fg: '#e8e6e1',
    link: '#babbff',
    muted: '#cfc5b8',
  },
}

function load(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const p = JSON.parse(raw) as Partial<ReaderSettings>
    return {
      ...defaults,
      ...p,
      fontSizePx: clampNum(p.fontSizePx, 14, 28, defaults.fontSizePx),
      lineHeight: clampNum(p.lineHeight, 1.5, 1.9, defaults.lineHeight),
      maxWidthRem: clampNum(p.maxWidthRem, 28, 52, defaults.maxWidthRem),
      letterSpacingEm: clampNum(p.letterSpacingEm, -0.02, 0.08, defaults.letterSpacingEm),
      bgPreset: (['wheat', 'sepia', 'velvet'] as const).includes(p.bgPreset as ReaderBgPreset)
        ? (p.bgPreset as ReaderBgPreset)
        : defaults.bgPreset,
    }
  } catch {
    return { ...defaults }
  }
}

function clampNum(v: unknown, min: number, max: number, d: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isFinite(n)) return Math.min(max, Math.max(min, n))
  return d
}

const settings = ref<ReaderSettings>(
  typeof localStorage !== 'undefined' ? load() : { ...defaults },
)

watch(
  settings,
  (s) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      }
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

export function useReaderTheme() {
  const palette = computed(() => bgTokens[settings.value.bgPreset])

  /** Canvas / Pretext font string — avoid `system-ui` per Pretext docs. */
  const pretextFontString = computed(() => {
    const s = settings.value
    return `400 ${s.fontSizePx}px ${normalizeFamilyForCanvas(s.fontFamily)}`
  })

  const readerStyleVars = computed(() => {
    const s = settings.value
    const p = palette.value
    return {
      '--reader-bg': p.bg,
      '--reader-fg': p.fg,
      '--reader-link': p.link,
      '--reader-muted': p.muted,
      '--reader-font': s.fontFamily,
      '--reader-size': `${s.fontSizePx}px`,
      '--reader-leading': String(s.lineHeight),
      '--reader-max-width': `${s.maxWidthRem}rem`,
      '--reader-track': `${s.letterSpacingEm}em`,
    } as Record<string, string>
  })

  return { settings, palette, pretextFontString, readerStyleVars, bgTokens }
}

/** Map CSS font stack to a single family name for canvas.measureText */
function normalizeFamilyForCanvas(fontFamily: string): string {
  const first = fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') ?? 'Newsreader'
  if (first === 'serif' || first === 'sans-serif') return 'Georgia'
  return first
}
