<script setup lang="ts">
import FeedInput from '@/components/FeedInput.vue'
import type { LoadedFeed } from '@/types/rss'

const props = withDefaults(
  defineProps<{
    loadedFeeds: LoadedFeed[]
    loading: boolean
    error: string | null
    showSourceFilter?: boolean
    sourceFilterFeeds?: LoadedFeed[]
    selectedUrls?: string[]
  }>(),
  {
    showSourceFilter: false,
    sourceFilterFeeds: () => [],
    selectedUrls: () => [],
  },
)

const emit = defineEmits<{
  add: [url: string]
  remove: [url: string]
  refresh: []
  openSettings: []
  'update:selectedUrls': [urls: string[]]
  selectAll: []
  selectNone: []
}>()

function toggleSourceUrl(url: string) {
  const s = new Set(props.selectedUrls)
  if (s.has(url)) s.delete(url)
  else s.add(url)
  emit('update:selectedUrls', [...s])
}
</script>

<template>
  <div class="rule-column flex h-full w-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto p-5">
      <div v-if="showSourceFilter && sourceFilterFeeds.length > 0" class="mb-4 lg:hidden">
        <p class="mb-2 font-label text-[0.5625rem] uppercase tracking-widest text-secondary">Filter by source</p>
        <div class="flex gap-2 mb-3">
          <button
            type="button"
            class="flex-1 bg-primary py-2 font-label text-[0.625rem] font-bold uppercase tracking-wider text-on-primary hover:bg-primary-container hover:text-on-primary-container"
            @click="emit('selectAll')"
          >
            Select all
          </button>
          <button
            type="button"
            class="flex-1 border border-outline/30 bg-transparent py-2 font-label text-[0.625rem] font-bold uppercase tracking-wider text-secondary hover:border-primary/40 hover:text-primary"
            @click="emit('selectNone')"
          >
            Select none
          </button>
        </div>
        <ul class="max-h-48 space-y-1 overflow-y-auto">
          <li
            v-for="feed in sourceFilterFeeds"
            :key="feed.url"
            class="flex cursor-pointer items-center gap-3 px-1 py-1.5 transition-colors hover:bg-surface-container-low"
            role="checkbox"
            :aria-checked="selectedUrls.includes(feed.url)"
            @click="toggleSourceUrl(feed.url)"
          >
            <span
              class="flex h-4 w-4 shrink-0 items-center justify-center border border-outline/40 bg-surface-container-lowest"
              :class="selectedUrls.includes(feed.url) ? 'border-primary bg-primary/10' : ''"
              aria-hidden="true"
            >
              <span
                v-show="selectedUrls.includes(feed.url)"
                class="material-symbols-outlined text-[14px] text-primary"
              >
                check
              </span>
            </span>
            <span class="min-w-0 font-label text-xs leading-snug text-on-surface">
              {{ feed.title }}
            </span>
          </li>
        </ul>
        <div style="margin: 1.0rem 0; height: 1px; width: 100%; background-color: currentColor; opacity: 0.15; flex-shrink: 0;"></div>
      </div>

      <FeedInput :loading="loading" :error="error" @add="(url) => emit('add', url)" />

      <div style="margin: 1.0rem 0; height: 1px; width: 100%; background-color: currentColor; opacity: 0.15; flex-shrink: 0;"></div>

      <div class="space-y-6">
        <div>
          <h2 class="font-label text-[0.625rem] font-bold uppercase tracking-widest text-primary">
            The Directory
          </h2>
          <p class="font-label mt-1 text-[0.625rem] uppercase tracking-wider text-secondary">
            Feeds you have added
          </p>
        </div>

        <ul v-if="loadedFeeds.length > 0" class="space-y-6">
          <li
            v-for="feed in loadedFeeds"
            :key="feed.url"
            class="group flex items-start justify-between gap-2"
          >
            <div class="min-w-0 flex-1">
              <p class="font-label truncate text-[0.625rem] font-bold uppercase tracking-wider text-on-surface">
                {{ feed.title }}
              </p>
              <p class="font-label mt-1 truncate text-[0.5625rem] text-secondary/70">
                {{ feed.url }}
              </p>
            </div>
            <button
              type="button"
              class="font-label shrink-0 cursor-pointer text-[0.5625rem] uppercase tracking-widest text-secondary/60 underline decoration-1 underline-offset-2 transition-colors hover:text-error"
              @click="emit('remove', feed.url)"
            >
              Remove
            </button>
          </li>
        </ul>
        <p v-else class="font-label text-[0.625rem] text-secondary">
          No feeds added yet.
        </p>
      </div>
    </div>
    <div class="shrink-0 space-y-3 border-t border-outline/15 p-5">
      <button
        type="button"
        class="flex w-full items-center gap-2 font-label text-[0.625rem] uppercase tracking-widest text-secondary transition-colors hover:text-on-surface disabled:cursor-not-allowed disabled:text-secondary/50"
        :disabled="loading || loadedFeeds.length === 0"
        @click="emit('refresh')"
      >
        <span class="material-symbols-outlined text-[15px]">refresh</span>
        {{ loading ? 'Refreshing feeds' : 'Refresh feeds' }}
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 font-label text-[0.625rem] uppercase tracking-widest text-secondary transition-colors hover:text-on-surface"
        @click="emit('openSettings')"
      >
        <span class="material-symbols-outlined text-[15px]">settings</span>
        Settings
      </button>
    </div>
  </div>
</template>
