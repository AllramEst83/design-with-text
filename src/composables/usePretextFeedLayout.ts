import { prepare, layout, type PreparedText } from '@chenglou/pretext'
import type { Ref } from 'vue'
import { ref, watch } from 'vue'

import type { FeedItem } from '@/types/rss'
import { stripHtml } from '@/lib/text'

const TITLE_FONT = '600 1.125rem Newsreader'
const BODY_FONT = '400 1rem Newsreader'
/** Line heights in px matching 1.6 * font size */
const TITLE_LH = 1.6 * 18
const BODY_LH = 1.6 * 16

/** Inset rule band below each article — must match FeedList. */
export const FEED_ROW_GAP_PX = 28

/** Extra space between one item and the next (below the rule) — must match FeedList. */
export const FEED_ITEM_MARGIN_PX = 16

/** 1px top + 1px bottom border on each article — must match FeedList. */
export const FEED_CARD_BORDER_PX = 2

function makeCacheKey(item: FeedItem): string {
  return `${item.id}\0${item.title}\0${item.excerpt}`
}

export function usePretextFeedLayout(
  items: Ref<FeedItem[]>,
  listWidth: Ref<number>,
) {
  const heights = ref<number[]>([])
  const prepTitle = new Map<string, PreparedText>()
  const prepBody = new Map<string, PreparedText>()

  function rebuild() {
    const w = Math.max(120, listWidth.value - 48)
    const rowHeights: number[] = []

    for (const item of items.value) {
      const key = makeCacheKey(item)
      let pt = prepTitle.get(key)
      if (!pt) {
        pt = prepare(item.title, TITLE_FONT)
        prepTitle.set(key, pt)
      }
      let pb = prepBody.get(key)
      if (!pb) {
        pb = prepare(stripHtml(item.excerpt) || ' ', BODY_FONT)
        prepBody.set(key, pb)
      }

      const hTitle = layout(pt, w, TITLE_LH).height
      const hBody = layout(pb, w, BODY_LH).height
      const card =
        hTitle +
        8 +
        hBody +
        32 +
        28 +
        FEED_CARD_BORDER_PX +
        FEED_ROW_GAP_PX +
        FEED_ITEM_MARGIN_PX
      rowHeights.push(card)
    }

    heights.value = rowHeights
  }

  watch([items, listWidth], () => rebuild(), { deep: true, immediate: true })

  return { heights }
}
