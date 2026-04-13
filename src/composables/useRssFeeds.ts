import { computed, ref, watch } from 'vue'

import type { FeedItem, LoadedFeed } from '@/types/rss'
import { stripHtml } from '@/lib/text'
import { clearRssState, loadRssState, saveRssState } from '@/lib/storage/rss-store'

interface RssParserItem {
  title?: string
  link?: string
  pubDate?: string
  isoDate?: string
  content?: string
  contentSnippet?: string
  guid?: string
  description?: string
  'content:encoded'?: string
}

interface RssParserFeed {
  title?: string
  feedUrl?: string
  items?: RssParserItem[]
}

function itemId(feedUrl: string, item: RssParserItem, index: number): string {
  const g = item.guid
  if (typeof g === 'string' && g) return `${feedUrl}::${g}`
  if (item.link) return `${feedUrl}::${item.link}`
  return `${feedUrl}::${index}::${item.title ?? ''}`
}

function mapItem(
  raw: RssParserItem,
  feedUrl: string,
  feedTitle: string,
  index: number,
): FeedItem {
  const encoded = raw['content:encoded']
  const contentHtml =
    (typeof encoded === 'string' && encoded) ||
    (typeof raw.content === 'string' && raw.content) ||
    (typeof raw.description === 'string' && raw.description) ||
    ''
  const plain = stripHtml(contentHtml)
  const excerpt =
    (raw.contentSnippet && raw.contentSnippet.trim()) ||
    (plain.length > 320 ? `${plain.slice(0, 317)}…` : plain)

  return {
    id: itemId(feedUrl, raw, index),
    title: (raw.title && raw.title.trim()) || 'Untitled',
    link:
      raw.link?.trim() ||
      (typeof raw.guid === 'string' && /^https?:\/\//.test(raw.guid) ? raw.guid : '#'),
    pubDate: raw.pubDate || raw.isoDate,
    excerpt,
    contentHtml,
    feedUrl,
    feedTitle,
  }
}

async function fetchFeedByUrl(url: string): Promise<LoadedFeed> {
  const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`)
  const data = (await res.json()) as RssParserFeed & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'Request failed')
  }
  const items = data.items ?? []
  const feedTitle = (data.title && data.title.trim()) || new URL(url).hostname
  return {
    url,
    title: feedTitle,
    items: items.map((it, i) => mapItem(it, url, feedTitle, i)),
  }
}

export function useRssFeeds() {
  const loadedFeeds = ref<LoadedFeed[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasHydrated = ref(false)
  const isPersistencePaused = ref(false)

  const allItems = computed<FeedItem[]>(() => {
    const out: FeedItem[] = []
    for (const f of loadedFeeds.value) {
      out.push(...f.items)
    }
    out.sort((a, b) => {
      const ta = a.pubDate ? Date.parse(a.pubDate) : 0
      const tb = b.pubDate ? Date.parse(b.pubDate) : 0
      return tb - ta
    })
    return out
  })

  void (async () => {
    try {
      const persisted = await loadRssState()
      if (persisted) {
        if (loadedFeeds.value.length === 0) {
          loadedFeeds.value = persisted
        } else {
          const existing = new Set(loadedFeeds.value.map((f) => f.url))
          loadedFeeds.value = [...loadedFeeds.value, ...persisted.filter((f) => !existing.has(f.url))]
        }
      }
    } catch {
      // If persistence is unavailable (private mode / blocked), keep in-memory behavior.
    } finally {
      hasHydrated.value = true
    }
  })()

  let saveTimer: number | null = null

  function clearPendingSave() {
    if (!saveTimer) return
    window.clearTimeout(saveTimer)
    saveTimer = null
  }

  watch(
    loadedFeeds,
    () => {
      if (!hasHydrated.value) return
      if (isPersistencePaused.value) return
      clearPendingSave()
      saveTimer = window.setTimeout(() => {
        void saveRssState(loadedFeeds.value)
      }, 250)
    },
    { deep: true },
  )

  async function addFeed(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    if (loadedFeeds.value.some((f) => f.url === trimmed)) {
      error.value = 'That feed is already in your directory.'
      return
    }
    loading.value = true
    error.value = null
    try {
      const feed = await fetchFeedByUrl(trimmed)
      loadedFeeds.value = [...loadedFeeds.value, feed]
      void saveRssState(loadedFeeds.value)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load feed'
    } finally {
      loading.value = false
    }
  }

  function removeFeed(url: string) {
    loadedFeeds.value = loadedFeeds.value.filter((f) => f.url !== url)
    void saveRssState(loadedFeeds.value)
  }

  async function refreshFeeds() {
    const existingFeeds = loadedFeeds.value.map((feed) => ({ url: feed.url, title: feed.title }))

    loading.value = true
    error.value = null
    isPersistencePaused.value = true
    clearPendingSave()

    try {
      await clearRssState()

      if (existingFeeds.length === 0) {
        loadedFeeds.value = []
        return
      }

      const refreshed = await Promise.allSettled(existingFeeds.map((feed) => fetchFeedByUrl(feed.url)))
      const nextFeeds: LoadedFeed[] = []
      const failedUrls: string[] = []

      refreshed.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          nextFeeds.push(result.value)
          return
        }

        failedUrls.push(existingFeeds[index]!.url)
        nextFeeds.push({
          url: existingFeeds[index]!.url,
          title: existingFeeds[index]!.title,
          items: [],
        })
      })

      loadedFeeds.value = nextFeeds
      await saveRssState(nextFeeds)

      if (failedUrls.length > 0) {
        error.value =
          failedUrls.length === 1
            ? `Could not refresh ${failedUrls[0]}.`
            : `Could not refresh ${failedUrls.length} feeds.`
      }
    } catch (e) {
      loadedFeeds.value = []
      error.value = e instanceof Error ? e.message : 'Could not refresh feeds'
    } finally {
      isPersistencePaused.value = false
      loading.value = false
    }
  }

  return {
    loadedFeeds,
    allItems,
    loading,
    error,
    addFeed,
    removeFeed,
    refreshFeeds,
  }
}
