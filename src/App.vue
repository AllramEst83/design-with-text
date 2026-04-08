<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import FeedList from '@/components/FeedList.vue'
import FeedSidebarContent from '@/components/FeedSidebarContent.vue'
import FeedSourceFilter from '@/components/FeedSourceFilter.vue'
import ReaderMode from '@/components/ReaderMode.vue'
import { useFeedSourceFilter } from '@/composables/useFeedSourceFilter'
import { useRssFeeds } from '@/composables/useRssFeeds'
import type { FeedItem } from '@/types/rss'

const { loadedFeeds, allItems, loading, error, addFeed, removeFeed } = useRssFeeds()

const { selectedFeedUrls, filteredItems, selectAllSources, selectNoSources } = useFeedSourceFilter(
  loadedFeeds,
  allItems,
)

const selected = ref<FeedItem | null>(null)
const readerOpen = ref(false)
const isDesktop = ref(false)
const isDesktopSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)

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

onMounted(() => {
  viewportQuery = window.matchMedia('(min-width: 1024px)')
  syncViewport(viewportQuery)
  viewportQuery.addEventListener('change', syncViewport)
})

onUnmounted(() => {
  viewportQuery?.removeEventListener('change', syncViewport)
})
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-background text-on-surface">
    <header class="shrink-0 border-b-2 border-primary bg-surface px-6 py-5 md:px-10">
      <div
        class="mx-auto flex w-full flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p class="font-label text-[10px] uppercase tracking-widest text-secondary">
            Volume I — The Digital Archivist
          </p>
          <h1
            class="font-headline mt-1 text-3xl font-black uppercase tracking-tight text-primary md:text-5xl"
          >
            Hypertext Gazette
          </h1>
        </div>
        <p class="font-label max-w-sm text-right text-[10px] uppercase tracking-wider text-secondary md:pb-1">
          Curated RSS dispatches · Reader mode with archival typography
        </p>
      </div>
    </header>

    <main
      class="mx-auto flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden px-6 py-6 lg:flex-row lg:items-stretch lg:justify-center lg:gap-6 lg:px-8 lg:py-6"
    >
      <aside
        class="hidden shrink-0 overflow-hidden bg-surface-container-low lg:flex lg:flex-col lg:self-stretch relative"
        :class="isDesktopSidebarCollapsed ? 'w-14' : 'w-80'"
      >
        <div v-if="isDesktopSidebarCollapsed" class="flex w-full items-start justify-center px-2 py-4">
          <button
            type="button"
            class="rounded-sm border border-outline/30 bg-surface px-2 py-3 font-label text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-surface-container"
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
              class="rounded-sm border border-outline/30 bg-surface px-2 py-1 font-label text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-surface-container"
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
          />
        </template>
      </aside>

      <section class="mx-auto flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden pt-2 lg:pt-0">
        <div
          class="mb-4 flex shrink-0 flex-col gap-4 border-t-2 border-secondary/20 pt-2 md:flex-row md:items-end md:justify-between md:gap-8"
        >
          <div class="min-w-0">
            <h2 class="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
              Dispatch
            </h2>
            <p class="font-label mt-2 text-[10px] uppercase tracking-wider text-secondary">
              Newest items across your feeds
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3 md:gap-4">
            <button
              type="button"
              class="rounded-sm border border-outline/40 px-3 py-2 font-label text-[10px] uppercase tracking-wider text-primary transition-colors hover:bg-surface-container-low lg:hidden"
              @click="openMobileSidebar"
            >
              Sources
            </button>
            <FeedSourceFilter
              v-model:selected-urls="selectedFeedUrls"
              :feeds="loadedFeeds"
              @select-all="selectAllSources"
              @select-none="selectNoSources"
            />
          </div>
        </div>

        <FeedList class="min-h-0 flex-1" :items="filteredItems" @select="openReader" />
      </section>
    </main>

    <footer class="shrink-0 border-t-4 border-double border-outline-variant bg-surface-dim px-6 py-3 text-center">
      <p class="font-body text-xs italic text-secondary">
        Editorial Reader · Pretext-powered feed virtualization
      </p>
    </footer>

    <ReaderMode v-if="selected && readerOpen" :item="selected" @close="closeReader" />

    <Teleport to="body">
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 z-40 flex lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Feed directory"
      >
        <div class="absolute inset-0 bg-inverse-surface/45" aria-hidden="true" @click="closeMobileSidebar" />
        <aside class="relative z-10 h-full w-full overflow-hidden bg-surface">
          <div class="flex items-center justify-between border-b border-outline/20 px-5 py-4">
            <h2 class="font-label text-xs uppercase tracking-widest text-primary">Sources</h2>
            <button
              type="button"
              class="font-label text-[10px] uppercase tracking-wider text-primary underline decoration-1 underline-offset-2"
              @click="closeMobileSidebar"
            >
              Close
            </button>
          </div>
          <FeedSidebarContent
            :loaded-feeds="loadedFeeds"
            :loading="loading"
            :error="error"
            @add="onAddFeed"
            @remove="removeFeed"
          />
        </aside>
      </div>
    </Teleport>
  </div>
</template>
