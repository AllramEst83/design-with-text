import { createStore, del, get, set } from 'idb-keyval'

import type { LoadedFeed } from '@/types/rss'

interface PersistedRssStateV1 {
  version: 1
  savedAtMs: number
  loadedFeeds: LoadedFeed[]
}

interface PersistedSourcesLsV1 {
  version: 1
  savedAtMs: number
  sources: { url: string; title: string }[]
}

const DB_NAME = 'design-with-text'
const STORE_NAME = 'app'
const KEY = 'rss-state'
/** Small mirror so DevTools → Local Storage shows your feeds; full articles stay in IndexedDB. */
const SOURCES_LS_KEY = 'design-with-text:sources-v1'

const kv = createStore(DB_NAME, STORE_NAME)

/** Strip Vue proxies / non-cloneable refs so IndexedDB structured clone always succeeds. */
function feedsToPlain(feeds: LoadedFeed[]): LoadedFeed[] {
  return JSON.parse(JSON.stringify(feeds)) as LoadedFeed[]
}

function isLoadedFeed(value: unknown): value is LoadedFeed {
  if (!value || typeof value !== 'object') return false
  const v = value as LoadedFeed
  return typeof v.url === 'string' && typeof v.title === 'string' && Array.isArray(v.items)
}

function isPersistedRssStateV1(value: unknown): value is PersistedRssStateV1 {
  if (!value || typeof value !== 'object') return false
  const v = value as PersistedRssStateV1
  return (
    v.version === 1 &&
    typeof v.savedAtMs === 'number' &&
    Array.isArray(v.loadedFeeds) &&
    v.loadedFeeds.every(isLoadedFeed)
  )
}

function parseSourcesFromLocalStorage(): LoadedFeed[] | null {
  try {
    const raw = localStorage.getItem(SOURCES_LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const v = parsed as PersistedSourcesLsV1
    if (v.version !== 1 || !Array.isArray(v.sources)) return null
    return v.sources.map((s) => ({
      url: s.url,
      title: s.title,
      items: [],
    }))
  } catch {
    return null
  }
}

export async function loadRssState(): Promise<LoadedFeed[] | null> {
  const raw = await get(KEY, kv)
  if (isPersistedRssStateV1(raw)) {
    return feedsToPlain(raw.loadedFeeds)
  }

  // IndexedDB empty or invalid (e.g. after upgrade): recover feed list from localStorage mirror.
  const fromLs = parseSourcesFromLocalStorage()
  if (fromLs?.length) return fromLs

  return null
}

export async function saveRssState(loadedFeeds: LoadedFeed[]): Promise<void> {
  const plainFeeds = feedsToPlain(loadedFeeds)
  const payload: PersistedRssStateV1 = {
    version: 1,
    savedAtMs: Date.now(),
    loadedFeeds: plainFeeds,
  }
  await set(KEY, payload, kv)

  try {
    const snapshot: PersistedSourcesLsV1 = {
      version: 1,
      savedAtMs: Date.now(),
      sources: plainFeeds.map((f) => ({ url: f.url, title: f.title })),
    }
    localStorage.setItem(SOURCES_LS_KEY, JSON.stringify(snapshot))
  } catch {
    // Private mode / quota: IndexedDB still holds full data when it succeeded above.
  }
}

export async function clearRssState(): Promise<void> {
  await del(KEY, kv)
  try {
    localStorage.removeItem(SOURCES_LS_KEY)
  } catch {
    // ignore
  }
}
