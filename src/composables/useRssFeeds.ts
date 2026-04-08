import { computed, ref, watch } from 'vue'

import type { FeedItem, LoadedFeed } from '@/types/rss'
import { stripHtml } from '@/lib/text'
import { loadRssState, saveRssState } from '@/lib/storage/rss-store'

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

export function useRssFeeds() {
  const loadedFeeds = ref<LoadedFeed[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasHydrated = ref(false)

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
  watch(
    loadedFeeds,
    () => {
      if (!hasHydrated.value) return
      if (saveTimer) window.clearTimeout(saveTimer)
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
      const res = await fetch(`/api/rss?url=${encodeURIComponent(trimmed)}`)
      const data = (await res.json()) as RssParserFeed & { error?: string }
      if (!res.ok) {
        throw new Error(data.error || res.statusText || 'Request failed')
      }
      const items = data.items ?? []
      const feed: LoadedFeed = {
        url: trimmed,
        title: (data.title && data.title.trim()) || new URL(trimmed).hostname,
        items: items.map((it, i) => mapItem(it, trimmed, data.title ?? trimmed, i)),
      }
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

  return {
    loadedFeeds,
    allItems,
    loading,
    error,
    addFeed,
    removeFeed,
  }
}
