<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import AppSettingsPanel from '@/components/AppSettingsPanel.vue'
import FeedList from '@/components/FeedList.vue'
import FeedSidebarContent from '@/components/FeedSidebarContent.vue'
import FeedSourceFilter from '@/components/FeedSourceFilter.vue'
import ReaderMode from '@/components/ReaderMode.vue'
import { useFeedSourceFilter } from '@/composables/useFeedSourceFilter'
import { useRssFeeds } from '@/composables/useRssFeeds'
import type { FeedItem } from '@/types/rss'

const { loadedFeeds, allItems, loading, error, addFeed, removeFeed, refreshFeeds } = useRssFeeds()

const { selectedFeedUrls, filteredItems, selectAllSources, selectNoSources } = useFeedSourceFilter(
  loadedFeeds,
  allItems,
)

const selected = ref<FeedItem | null>(null)
const readerOpen = ref(false)
const isDesktop = ref(false)
const isDesktopSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)
const isSettingsOpen = ref(false)
const appFontScale = ref(100)

const APP_FONT_SCALE_KEY = 'app-font-scale'

let viewportQuery: MediaQueryList | null = null

function syncViewport(query: MediaQueryList | MediaQueryListEvent) {
  isDesktop.value = query.matches
  if (query.matches) {
    isMobileSidebarOpen.value = false
  }
}

function openReader(item: FeedItem) {
  selected.value = item
  readerOpen.value = true
}

function closeReader() {
  readerOpen.value = false
}

async function onAddFeed(url: string) {
  await addFeed(url)
  if (!isDesktop.value) {
    isMobileSidebarOpen.value = false
  }
}

function toggleDesktopSidebar() {
  isDesktopSidebarCollapsed.value = !isDesktopSidebarCollapsed.value
}

function openMobileSidebar() {
  isMobileSidebarOpen.value = true
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function openSettings() {
  isSettingsOpen.value = true
  isMobileSidebarOpen.value = false
}

function onArticleFetched(itemId: string, feedUrl: string, html: string) {
  for (const feed of loadedFeeds.value) {
    if (feed.url !== feedUrl) continue
    const item = feed.items.find((i) => i.id === itemId)
    if (item) {
      item.fullArticleHtml = html
      break
    }
  }
}

function onArticleViewed(itemId: string, feedUrl: string, status: 'success' | 'failed') {
  for (const feed of loadedFeeds.value) {
    if (feed.url !== feedUrl) continue
    const item = feed.items.find((i) => i.id === itemId)
    if (!item) continue
    item.viewedAtMs = Date.now()
    item.extractionStatus = status
    break
  }
}

onMounted(() => {
  const persistedScale = window.localStorage.getItem(APP_FONT_SCALE_KEY)
  const parsedScale = Number(persistedScale)
  if (Number.isFinite(parsedScale) && parsedScale >= 85 && parsedScale <= 125) {
    appFontScale.value = parsedScale
  }
  document.documentElement.style.fontSize = `${appFontScale.value}%`
  viewportQuery = window.matchMedia('(min-width: 1024px)')
  syncViewport(viewportQuery)
  viewportQuery.addEventListener('change', syncViewport)
})

watch(appFontScale, (scale) => {
  window.localStorage.setItem(APP_FONT_SCALE_KEY, String(scale))
  document.documentElement.style.fontSize = `${scale}%`
})

onUnmounted(() => {
  viewportQuery?.removeEventListener('change', syncViewport)
  document.documentElement.style.fontSize = ''
})
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-background text-on-surface">

    <!-- ── Mobile header ─────────────────────────────────────── -->
    <header class="shrink-0 border-b-2 border-primary bg-surface lg:hidden">
      <div class="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          class="shrink-0 p-1 text-primary transition-colors hover:bg-surface-container-low"
          :aria-expanded="isMobileSidebarOpen"
          aria-label="Open navigation menu"
          @click="openMobileSidebar()"
        >
          <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <div class="min-w-0 flex-1">
          <p class="font-label text-[0.5625rem] uppercase tracking-widest text-secondary">The Digital Archivist</p>
          <h1 class="font-headline text-xl font-black uppercase leading-none tracking-tight text-primary">
            Hypertext Gazette
          </h1>
        </div>
      </div>
    </header>

    <!-- ── Desktop header ─────────────────────────────────────── -->
    <header class="hidden shrink-0 border-b-2 border-primary bg-surface px-10 py-5 lg:block">
      <div class="mx-auto flex w-full flex-row items-end justify-between">
        <div>
          <p class="font-label text-[0.625rem] uppercase tracking-widest text-secondary">
            The Digital Archivist
          </p>
          <h1 class="font-headline mt-1 text-5xl font-black uppercase tracking-tight text-primary">
            Hypertext Gazette
          </h1>
        </div>
        <p class="font-label max-w-sm pb-1 text-right text-[0.625rem] uppercase tracking-wider text-secondary">
          RSS dispatches · Reader mode
        </p>
      </div>
    </header>

    <main
      class="mx-auto flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden px-4 py-3 lg:flex-row lg:items-stretch lg:justify-center lg:gap-6 lg:px-8 lg:py-6"
    >
      <!-- Desktop sidebar -->
      <aside
        class="hidden shrink-0 overflow-hidden bg-surface-container-low lg:flex lg:flex-col lg:self-stretch relative"
        :class="isDesktopSidebarCollapsed ? 'w-14' : 'w-80'"
      >
        <div v-if="isDesktopSidebarCollapsed" class="flex w-full items-start justify-center px-2 py-4">
          <button
            type="button"
            class="rounded-sm border border-outline/30 bg-surface px-2 py-3 font-label text-[0.625rem] uppercase tracking-widest text-primary transition-colors hover:bg-surface-container"
            @click="toggleDesktopSidebar"
            title="Open Directory"
          >
            <span class="material-symbols-outlined text-[16px]">menu_open</span>
          </button>
        </div>
        <template v-else>
          <div class="flex justify-end p-2 pb-0">
            <button
              type="button"
              class="rounded-sm border border-outline/30 bg-surface px-2 py-1 font-label text-[0.625rem] uppercase tracking-widest text-primary transition-colors hover:bg-surface-container"
              @click="toggleDesktopSidebar"
              title="Close Directory"
            >
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <FeedSidebarContent
            :loaded-feeds="loadedFeeds"
            :loading="loading"
            :error="error"
            @add="onAddFeed"
            @remove="removeFeed"
            @refresh="refreshFeeds"
            @open-settings="openSettings"
          />
        </template>
      </aside>

      <section class="mx-auto flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
        <!-- Desktop-only section header -->
        <div class="mb-4 hidden shrink-0 flex-col gap-4 border-t-2 border-secondary/20 pt-2 lg:flex lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div class="min-w-0">
            <h2 class="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
              Dispatch
            </h2>
            <p class="font-label mt-2 text-[0.625rem] uppercase tracking-wider text-secondary">
              Newest items across your feeds
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <FeedSourceFilter
              v-model:selected-urls="selectedFeedUrls"
              :feeds="loadedFeeds"
              @select-all="selectAllSources"
              @select-none="selectNoSources"
            />
          </div>
        </div>

        <FeedList class="min-h-0 flex-1" :items="filteredItems" :font-scale="appFontScale" @select="openReader" />
      </section>
    </main>

    <footer class="shrink-0 border-t-4 border-double border-outline-variant bg-surface-dim px-6 py-3 text-center">
      <p class="font-body text-xs italic text-secondary">
        Editorial Reader · Pretext-powered feed virtualization
      </p>
    </footer>

    <ReaderMode
      v-if="selected && readerOpen"
      :item="selected"
      @close="closeReader"
      @article-fetched="onArticleFetched"
      @article-viewed="onArticleViewed"
    />
    <AppSettingsPanel v-model="isSettingsOpen" v-model:font-scale="appFontScale" />

    <!-- Mobile drawer -->
    <Teleport to="body">
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 z-40 flex lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Feed directory"
      >
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isMobileSidebarOpen"
            class="absolute inset-0 bg-inverse-surface/45"
            aria-hidden="true"
            @click="closeMobileSidebar"
          />
        </Transition>
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <aside
            v-if="isMobileSidebarOpen"
            class="relative z-10 flex h-full w-[85vw] max-w-xs flex-col overflow-hidden bg-surface-container-low"
          >
            <div class="flex items-center justify-between border-b border-outline/20 px-5 py-4">
              <h2 class="font-label text-xs uppercase tracking-widest text-primary">Directory</h2>
              <button
                type="button"
                class="flex items-center gap-1 font-label text-[0.625rem] uppercase tracking-wider text-primary underline decoration-1 underline-offset-2"
                @click="closeMobileSidebar"
              >
                <span class="material-symbols-outlined text-[14px]">close</span>
                Close
              </button>
            </div>
            <FeedSidebarContent
              :loaded-feeds="loadedFeeds"
              :loading="loading"
              :error="error"
              :show-source-filter="true"
              :source-filter-feeds="loadedFeeds"
              :selected-urls="selectedFeedUrls"
              @add="onAddFeed"
              @remove="removeFeed"
              @refresh="refreshFeeds"
              @open-settings="openSettings"
              @update:selected-urls="(urls) => selectedFeedUrls = urls"
              @select-all="selectAllSources"
              @select-none="selectNoSources"
            />
          </aside>
        </Transition>
      </div>
    </Teleport>
  </div>
</template>
