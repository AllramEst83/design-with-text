import { computed, ref, watch, type Ref } from 'vue'

import type { FeedItem, LoadedFeed } from '@/types/rss'

/**
 * Multi-select filter by feed URL. New feeds are selected by default when added;
 * removed feeds are dropped from the selection. Select all / none are explicit.
 */
export function useFeedSourceFilter(
  loadedFeeds: Ref<LoadedFeed[]>,
  allItems: Ref<FeedItem[]>,
) {
  const selectedFeedUrls = ref<string[]>([])
  const prevFeedUrlSet = ref<Set<string>>(new Set())

  watch(
    loadedFeeds,
    (feeds) => {
      const urls = feeds.map((f) => f.url)
      const valid = new Set(urls)
      const sel = new Set(selectedFeedUrls.value.filter((u) => valid.has(u)))

      for (const u of urls) {
        if (!prevFeedUrlSet.value.has(u)) {
          sel.add(u)
        }
      }

      prevFeedUrlSet.value = new Set(urls)
      selectedFeedUrls.value = [...sel]
    },
    { deep: true, immediate: true },
  )

  const filteredItems = computed(() =>
    allItems.value.filter((i) => selectedFeedUrls.value.includes(i.feedUrl)),
  )

  function selectAllSources() {
    selectedFeedUrls.value = loadedFeeds.value.map((f) => f.url)
  }

  function selectNoSources() {
    selectedFeedUrls.value = []
  }

  return {
    selectedFeedUrls,
    filteredItems,
    selectAllSources,
    selectNoSources,
  }
}
