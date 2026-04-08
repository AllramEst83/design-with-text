<script setup lang="ts">
import FeedInput from '@/components/FeedInput.vue'
import type { LoadedFeed } from '@/types/rss'

defineProps<{
  loadedFeeds: LoadedFeed[]
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  add: [url: string]
  remove: [url: string]
  openSettings: []
}>()
</script>

<template>
  <div class="rule-column flex h-full w-full flex-col overflow-y-auto p-5">
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

    <div class="mt-auto border-t border-outline/15 pt-4">
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
