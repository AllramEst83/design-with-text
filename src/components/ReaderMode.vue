<script setup lang="ts">
import DOMPurify from 'dompurify'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

import type { ReaderSettings } from '@/composables/useReaderTheme'
import { useReaderTheme } from '@/composables/useReaderTheme'
import { useReaderPretextArticleHeight } from '@/composables/useReaderPretextArticle'
import type { FeedItem } from '@/types/rss'
import { stripHtml } from '@/lib/text'
import ReaderControls from './ReaderControls.vue'

const props = defineProps<{
  item: FeedItem
}>()

const emit = defineEmits<{
  close: []
}>()

const { settings, readerStyleVars } = useReaderTheme()

const controlsOpen = ref(false)
const proseInner = ref<HTMLElement | null>(null)
const proseWidth = ref(640)

let proseRo: ResizeObserver | null = null
onMounted(() => {
  proseRo = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width
    if (w) proseWidth.value = w
  })
  void nextTick(() => {
    if (proseInner.value && proseRo) proseRo.observe(proseInner.value)
  })
})
onUnmounted(() => proseRo?.disconnect())

const plainArticle = computed(
  () => stripHtml(props.item.contentHtml || props.item.excerpt) || props.item.title,
)

/** Pretext height estimate — font string matches reader CSS via `useReaderTheme`. */
const pretextHeight = useReaderPretextArticleHeight(plainArticle, proseWidth)

const safeHtml = computed(() =>
  DOMPurify.sanitize(props.item.contentHtml || props.item.excerpt, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'img',
      'figure',
      'figcaption',
      'h1',
      'h2',
      'h3',
      'h4',
      'code',
      'pre',
      'hr',
      'div',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'loading', 'rel', 'target'],
    ADD_ATTR: ['loading'],
  }),
)

function onSettingsUpdate(s: ReaderSettings) {
  Object.assign(settings.value, s)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex flex-col motion-safe:transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
    >
      <div
        class="absolute inset-0 bg-inverse-surface/40"
        aria-hidden="true"
        @click="emit('close')"
      />

      <div
        class="relative z-10 mx-auto flex h-full w-full max-w-screen-2xl flex-col overflow-hidden"
        :style="readerStyleVars"
      >
        <header
          class="editorial-glass flex shrink-0 items-start justify-between gap-4 border-b border-outline/10 px-4 py-4 md:px-8"
        >
          <div class="min-w-0">
            <p class="font-label text-[10px] uppercase tracking-wider text-[var(--reader-muted)]">
              {{ item.feedTitle }}
            </p>
            <h1
              id="reader-title"
              class="font-headline mt-1 text-2xl font-bold leading-tight text-[var(--reader-fg)] md:text-4xl"
            >
              {{ item.title }}
            </h1>
            <p class="font-label mt-2 text-[10px] text-[var(--reader-muted)]">
              {{ item.pubDate ?? '' }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <a
              class="news-link font-label text-xs font-bold text-[var(--reader-link)]"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Original →
            </a>
            <button
              type="button"
              class="bg-primary px-4 py-2 font-label text-xs font-bold uppercase tracking-wider text-on-primary hover:bg-primary-container hover:text-on-primary-container"
              @click="emit('close')"
            >
              Exit reader
            </button>
          </div>
        </header>

        <article
          class="reader-prose min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-12"
          :style="{
            background: 'var(--reader-bg)',
            color: 'var(--reader-fg)',
          }"
        >
          <div
            ref="proseInner"
            class="reader-prose-inner mx-auto"
            :style="{
              maxWidth: 'var(--reader-max-width)',
              fontFamily: 'var(--reader-font)',
              fontSize: 'var(--reader-size)',
              lineHeight: 'var(--reader-leading)',
              letterSpacing: 'var(--reader-track)',
            }"
            :data-pretext-estimate-height="Math.round(pretextHeight)"
          >
            <div class="reader-content" v-html="safeHtml" />
          </div>
        </article>

        <ReaderControls v-model:open="controlsOpen" :settings="settings" @update:settings="onSettingsUpdate" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.reader-content :deep(a) {
  color: var(--reader-link);
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}

.reader-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 1.5rem 0;
}

.reader-content :deep(blockquote) {
  font-style: italic;
  border-left: 2px solid color-mix(in srgb, var(--reader-muted) 40%, transparent);
  padding-left: 1rem;
  margin: 1rem 0;
}

@media (prefers-reduced-motion: reduce) {
  .reader-prose {
    scroll-behavior: auto;
  }
}
</style>
