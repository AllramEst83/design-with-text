

import { prepare, layout, type PreparedText } from '@chenglou/pretext'
import type { Ref } from 'vue'
import { nextTick, ref, watch } from 'vue'

import type { FeedItem } from '@/types/rss'
import { stripHtml } from '@/lib/text'

/** Must match `FeedList.vue` article vertical padding (`py-6`). */
const PY_REM = 1.5
/** Must match metadata → title (`mt-2`). */
const MT_META_TITLE_REM = 0.5
/** Must match title → excerpt (`mt-3`). */
const MT_TITLE_BODY_REM = 0.75
/** Must match excerpt → link (`mt-4`). */
const MT_BODY_LINK_REM = 1
/** Must match horizontal padding (`px-5`). */
const PX_REM = 1.25
/** Label line-height factor (metadata row). */
const META_LH = 1.35
/** Title: `leading-snug` ≈ 1.375 */
const TITLE_LH_FACTOR = 1.375
/** Body: `leading-[1.6]` */
const BODY_LH_FACTOR = 1.6
/** Link row: `text-xs` with comfortable line box */
const LINK_LH_FACTOR = 1.25

/** Space between feed cards (drives both estimate + DOM spacer). */
const FEED_INTER_ITEM_GAP_PX = 5

/** Card top border contributes to row height (see `FeedList.vue`). */
const FEED_CARD_BORDER_PX = 1

function getRootFontPx(): number {
  if (typeof document === 'undefined') return 16
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(px) && px > 0 ? px : 16
}

function rem(r: number, rootPx: number): number {
  return r * rootPx
}

function makeCacheKey(item: FeedItem): string {
  return `${item.id}\0${item.title}\0${item.excerpt}\0${item.feedTitle}\0${item.pubDate ?? ''}`
}

export function usePretextFeedLayout(
  items: Ref<FeedItem[]>,
  listWidth: Ref<number>,
  fontScale: Ref<number>,
) {
  const heights = ref<number[]>([])
  const interItemGapPx = ref(FEED_INTER_ITEM_GAP_PX)
  const prepMeta = new Map<string, PreparedText>()
  const prepTitle = new Map<string, PreparedText>()
  const prepBody = new Map<string, PreparedText>()

  let lastRootPx = 0

  function clearPrepCaches() {
    prepMeta.clear()
    prepTitle.clear()
    prepBody.clear()
  }

  function rebuild() {
    const rootPx = getRootFontPx()
    if (Math.abs(rootPx - lastRootPx) > 0.01) {
      clearPrepCaches()
      lastRootPx = rootPx
    }

    const horizontalPad = rem(PX_REM * 2, rootPx)
    const w = Math.max(120, listWidth.value - horizontalPad)
    const rowHeights: number[] = []

    const metaFontSizePx = rem(0.625, rootPx)
    const titleFontSizePx = rem(1.125, rootPx)
    const bodyFontSizePx = rem(1, rootPx)
    const linkFontSizePx = rem(0.75, rootPx)

    const metaFont = `400 ${metaFontSizePx}px "Public Sans", sans-serif`
    const titleFont = `600 ${titleFontSizePx}px Newsreader, serif`
    const bodyFont = `400 ${bodyFontSizePx}px Newsreader, serif`

    const metaLineHeightPx = META_LH * metaFontSizePx
    const titleLineHeightPx = TITLE_LH_FACTOR * titleFontSizePx
    const bodyLineHeightPx = BODY_LH_FACTOR * bodyFontSizePx
    const linkLineHeightPx = LINK_LH_FACTOR * linkFontSizePx

    for (const item of items.value) {
      const key = makeCacheKey(item)

      let pMeta = prepMeta.get(key)
      if (!pMeta) {
        const metaText = `${item.feedTitle} · ${item.pubDate ?? '—'}`
        pMeta = prepare(metaText, metaFont)
        prepMeta.set(key, pMeta)
      }

      let pt = prepTitle.get(key)
      if (!pt) {
        pt = prepare(item.title, titleFont)
        prepTitle.set(key, pt)
      }

      let pb = prepBody.get(key)
      if (!pb) {
        pb = prepare(stripHtml(item.excerpt) || ' ', bodyFont)
        prepBody.set(key, pb)
      }

      const hMeta = layout(pMeta, w, metaLineHeightPx).height
      const hTitle = layout(pt, w, titleLineHeightPx).height
      const hBody = layout(pb, w, bodyLineHeightPx).height

      const card =
        rem(PY_REM, rootPx) +
        hMeta +
        rem(MT_META_TITLE_REM, rootPx) +
        hTitle +
        rem(MT_TITLE_BODY_REM, rootPx) +
        hBody +
        rem(MT_BODY_LINK_REM, rootPx) +
        linkLineHeightPx +
        rem(PY_REM, rootPx) +
        FEED_CARD_BORDER_PX +
        FEED_INTER_ITEM_GAP_PX

      rowHeights.push(card)
    }

    heights.value = rowHeights
  }

  watch(
    [items, listWidth, fontScale],
    async () => {
      await nextTick()
      rebuild()
    },
    { deep: true, immediate: true },
  )

  return { heights, interItemGapPx }
}
