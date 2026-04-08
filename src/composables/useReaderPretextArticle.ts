import { prepare, layout } from '@chenglou/pretext'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

import { useReaderTheme } from '@/composables/useReaderTheme'

/**
 * Estimates article body height with Pretext using the same font string as
 * `--reader-size` / `--reader-font` (see `useReaderTheme().pretextFontString`).
 */
export function useReaderPretextArticleHeight(
  plainText: MaybeRefOrGetter<string>,
  contentWidthPx: MaybeRefOrGetter<number>,
) {
  const { pretextFontString, settings } = useReaderTheme()

  return computed(() => {
    const text = toValue(plainText)
    const w = Math.max(120, toValue(contentWidthPx))
    const lh = settings.value.fontSizePx * settings.value.lineHeight
    try {
      const prepared = prepare(text || ' ', pretextFontString.value)
      return layout(prepared, w, lh).height
    } catch {
      return 0
    }
  })
}
