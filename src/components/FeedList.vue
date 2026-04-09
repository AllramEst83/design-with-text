<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue'
import type { ComponentPublicInstance, VNodeRef } from 'vue'

import { usePretextFeedLayout } from '@/composables/usePretextFeedLayout'
import type { FeedItem } from '@/types/rss'

function truncateText(text: string | undefined, maxChars: number): string {
  if (!text) return ''
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}…`
}

const pubDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
  hour12: false,
})

function formatPubDate(pubDate: string | undefined): string {
  if (!pubDate) return '—'
  const date = new Date(pubDate)
  if (Number.isNaN(date.getTime())) return '—'
  return pubDateFormatter.format(date)
}

const props = withDefaults(
  defineProps<{
    items: FeedItem[]
    /** Drives virtual row height recalculation when the app text scale changes. */
    fontScale?: number
  }>(),
  { fontScale: 100 },
)

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
const fontScaleRef = toRef(props, 'fontScale')
const { heights, interItemGapPx } = usePretextFeedLayout(itemsRef, listWidth, fontScaleRef)

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

const measureRow: VNodeRef = (node) => {
  if (!node) return
  if (!(node instanceof Element)) return
  virtualizer.value.measureElement(node)
}
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
            :data-index="v.index"
            :ref="measureRow"
            :style="{
              transform: `translateY(${v.start}px)`,
            }"
          >
            <article
              class="cursor-pointer border-t border-outline-variant/20 bg-surface-container-low px-5 py-6 transition-colors hover:border-outline-variant/35 hover:bg-surface-container"
              role="button"
              tabindex="0"
              @click="emit('select', items[v.index]!)"
              @keydown.enter="emit('select', items[v.index]!)"
            >
              <p class="font-label text-[0.625rem] uppercase tracking-wider text-secondary">
                {{ items[v.index]?.feedTitle }} · {{ formatPubDate(items[v.index]?.pubDate) }}
              </p>
              <h3 class="font-headline mt-2 text-[1.125rem] font-bold leading-snug text-on-surface">
                {{ items[v.index]?.title }}
              </h3>
              <p class="font-body mt-3 text-base leading-[1.6] text-on-surface-variant">
                {{ truncateText(items[v.index]?.excerpt, 100) }}
              </p>
              <p class="news-link mt-4 font-label text-xs font-bold text-primary">Open reader →</p>
            </article>
            <div
              class="shrink-0"
              aria-hidden="true"
              :style="{ height: `${interItemGapPx}px` }"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
