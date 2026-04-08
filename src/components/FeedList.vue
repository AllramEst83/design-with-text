<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import {
  FEED_ITEM_MARGIN_PX,
  FEED_ROW_GAP_PX,
  usePretextFeedLayout,
} from '@/composables/usePretextFeedLayout'
import type { FeedItem } from '@/types/rss'

const props = defineProps<{
  items: FeedItem[]
}>()

const emit = defineEmits<{
  select: [item: FeedItem]
}>()

const scrollEl = ref<HTMLElement | null>(null)
const listWidth = ref(480)

let ro: ResizeObserver | null = null

onMounted(() => {
  ro = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width
    if (w) listWidth.value = w
  })
  const el = scrollEl.value
  if (el) ro.observe(el)
})

onUnmounted(() => {
  ro?.disconnect()
})

const itemsRef = computed(() => props.items)
const { heights } = usePretextFeedLayout(itemsRef, listWidth)

const virtualizer = useVirtualizer(
  computed(() => ({
    count: props.items.length,
    getScrollElement: () => scrollEl.value,
    estimateSize: (index: number) => heights.value[index] ?? 160,
    overscan: 8,
  })),
)

watch(heights, () => {
  virtualizer.value.measure()
}, { deep: true })
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div
      ref="scrollEl"
      class="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
    >
      <div
        v-if="!items.length"
        class="font-body border border-outline/10 bg-surface-container-low p-8 text-center leading-relaxed text-secondary"
      >
        No articles match your source filter. Adjust Sources above, or add a feed in the directory.
      </div>
      <template v-else>
        <div
          class="relative w-full"
          :style="{ height: `${virtualizer.getTotalSize()}px` }"
        >
          <div
            v-for="v in virtualizer.getVirtualItems()"
            :key="items[v.index]?.id ?? v.index"
            class="absolute left-0 top-0 box-border w-full px-1"
            :style="{
              transform: `translateY(${v.start}px)`,
            }"
          >
            <article
              class="cursor-pointer border border-outline-variant/20 bg-surface-container-low px-5 py-6 transition-colors hover:border-outline-variant/35 hover:bg-surface-container"
              role="button"
              tabindex="0"
              @click="emit('select', items[v.index]!)"
              @keydown.enter="emit('select', items[v.index]!)"
            >
              <p class="font-label text-[10px] uppercase tracking-wider text-secondary">
                {{ items[v.index]?.feedTitle }} · {{ items[v.index]?.pubDate ?? '—' }}
              </p>
              <h3 class="font-headline mt-2 text-[1.125rem] font-bold leading-snug text-on-surface">
                {{ items[v.index]?.title }}
              </h3>
              <p class="font-body mt-3 text-base leading-[1.6] text-on-surface-variant">
                {{ items[v.index]?.excerpt }}
              </p>
              <p class="news-link mt-4 font-label text-xs font-bold text-primary">Open reader →</p>
            </article>
            <div
              class="pointer-events-none flex flex-col justify-center px-8"
              :style="{ height: `${FEED_ROW_GAP_PX}px` }"
              aria-hidden="true"
            >
              <div class="h-px w-full bg-outline-variant/25" />
            </div>
            <div
              class="shrink-0"
              :style="{ height: `${FEED_ITEM_MARGIN_PX}px` }"
              aria-hidden="true"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
