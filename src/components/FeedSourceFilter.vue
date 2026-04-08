<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import type { LoadedFeed } from '@/types/rss'

const props = defineProps<{
  feeds: LoadedFeed[]
  selectedUrls: string[]
}>()

const emit = defineEmits<{
  'update:selectedUrls': [urls: string[]]
  selectAll: []
  selectNone: []
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function isSelected(url: string) {
  return props.selectedUrls.includes(url)
}

function toggle(url: string) {
  const s = new Set(props.selectedUrls)
  if (s.has(url)) s.delete(url)
  else s.add(url)
  emit('update:selectedUrls', [...s])
}

function onSelectAll() {
  emit('selectAll')
}

function onSelectNone() {
  emit('selectNone')
}

function onDocClick(e: MouseEvent) {
  if (!open.value || !root.value) return
  if (!root.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick, true))
onUnmounted(() => document.removeEventListener('click', onDocClick, true))
</script>

<template>
  <div ref="root" class="relative w-full shrink-0 md:w-auto md:min-w-[14rem]">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 border-0 border-b border-outline/30 bg-transparent py-2 pl-0 pr-1 font-label text-xs uppercase tracking-wider text-secondary outline-none transition-colors hover:text-on-surface focus:border-b-2 focus:border-primary focus:bg-surface-container-highest md:min-w-[14rem]"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="open = !open"
    >
      <span class="text-left">Sources</span>
      <span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
        {{ open ? 'expand_less' : 'expand_more' }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-show="open"
        class="editorial-glass absolute right-0 top-full z-40 mt-1 max-h-[min(60vh,320px)] w-[min(100vw-2rem,20rem)] overflow-y-auto border border-outline/10 shadow-[0_20px_40px_rgba(106,93,67,0.08)]"
        role="listbox"
        aria-label="Filter by feed source"
        @click.stop
      >
        <div
          class="sticky top-0 z-10 flex gap-2 border-b border-outline/10 bg-surface/95 px-3 py-2 backdrop-blur-sm"
        >
          <button
            type="button"
            class="flex-1 bg-primary py-2 font-label text-[0.625rem] font-bold uppercase tracking-wider text-on-primary hover:bg-primary-container hover:text-on-primary-container"
            @click="onSelectAll"
          >
            Select all
          </button>
          <button
            type="button"
            class="flex-1 border border-outline/30 bg-transparent py-2 font-label text-[0.625rem] font-bold uppercase tracking-wider text-secondary hover:border-primary/40 hover:text-primary"
            @click="onSelectNone"
          >
            Select none
          </button>
        </div>

        <p
          v-if="!feeds.length"
          class="px-3 py-4 font-label text-[0.625rem] text-secondary"
        >
          Add a feed to filter sources.
        </p>

        <ul v-else class="py-2">
          <li
            v-for="feed in feeds"
            :key="feed.url"
            class="flex cursor-pointer items-start gap-3 px-3 py-2 transition-colors hover:bg-surface-container-low"
            role="option"
            :aria-selected="isSelected(feed.url)"
            @click="toggle(feed.url)"
          >
            <span
              class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-outline/40 bg-surface-container-lowest"
              :class="isSelected(feed.url) ? 'border-primary bg-primary/10' : ''"
              aria-hidden="true"
            >
              <span
                v-show="isSelected(feed.url)"
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
      </div>
    </Transition>
  </div>
</template>
