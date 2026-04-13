<script setup lang="ts">
import DOMPurify from 'dompurify'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import type { ReaderSettings } from '@/composables/useReaderTheme'
import { useReaderTheme } from '@/composables/useReaderTheme'
import { useReaderPretextArticleHeight } from '@/composables/useReaderPretextArticle'
import type { FeedItem } from '@/types/rss'
import { stripHtml } from '@/lib/text'
import { formatPubDate } from '@/utils/date'
import ReaderControls from './ReaderControls.vue'

const SANITIZE_OPTS = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li',
    'blockquote', 'img', 'figure', 'figcaption',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'code', 'pre', 'hr', 'div', 'span',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    'sup', 'sub', 's', 'del', 'ins', 'mark', 'abbr', 'time',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'loading', 'rel', 'target', 'colspan', 'rowspan', 'datetime'],
  ADD_ATTR: ['loading'],
}

const props = defineProps<{
  item: FeedItem
}>()

const emit = defineEmits<{
  close: []
  articleFetched: [itemId: string, feedUrl: string, html: string]
  articleViewed: [itemId: string, feedUrl: string, status: 'success' | 'failed']
}>()

const { settings, readerStyleVars } = useReaderTheme()

const controlsOpen = ref(false)
const proseInner = ref<HTMLElement | null>(null)
const proseWidth = ref(640)
const isLoadingArticle = ref(false)
const fetchedArticleHtml = ref<string | null>(null)

async function fetchFullArticle() {
  const link = props.item.link?.trim()
  if (!link || link === '#') {
    emit('articleViewed', props.item.id, props.item.feedUrl, 'failed')
    return
  }
  if (props.item.fullArticleHtml) {
    fetchedArticleHtml.value = props.item.fullArticleHtml
    emit('articleViewed', props.item.id, props.item.feedUrl, 'success')
    return
  }

  isLoadingArticle.value = true
  try {
    const res = await fetch(`/api/extract-article?url=${encodeURIComponent(link)}`)
    if (res.status === 204 || !res.ok) {
      emit('articleViewed', props.item.id, props.item.feedUrl, 'failed')
      return
    }
    const data = (await res.json()) as { content?: string }
    if (data.content) {
      fetchedArticleHtml.value = data.content
      emit('articleFetched', props.item.id, props.item.feedUrl, data.content)
      emit('articleViewed', props.item.id, props.item.feedUrl, 'success')
      return
    }
    emit('articleViewed', props.item.id, props.item.feedUrl, 'failed')
  } catch {
    // Silently fall back to excerpt
    emit('articleViewed', props.item.id, props.item.feedUrl, 'failed')
  } finally {
    isLoadingArticle.value = false
  }
}

const displayContentHtml = computed(() =>
  fetchedArticleHtml.value
  || props.item.fullArticleHtml
  || props.item.contentHtml
  || props.item.excerpt,
)

let proseRo: ResizeObserver | null = null
onMounted(() => {
  proseRo = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width
    if (w) proseWidth.value = w
  })
  void nextTick(() => {
    if (proseInner.value && proseRo) proseRo.observe(proseInner.value)
  })
  void fetchFullArticle()
})
onUnmounted(() => proseRo?.disconnect())

watch(() => props.item.id, () => {
  fetchedArticleHtml.value = null
  void fetchFullArticle()
})

const plainArticle = computed(
  () => stripHtml(displayContentHtml.value) || props.item.title,
)

const pretextHeight = useReaderPretextArticleHeight(plainArticle, proseWidth)

const safeHtml = computed(() =>
  DOMPurify.sanitize(displayContentHtml.value, SANITIZE_OPTS),
)

const originalHref = computed(() => {
  const href = props.item.link?.trim()
  if (!href || href === '#') return null
  return href
})

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
          class="reader-glass flex shrink-0 items-start justify-between gap-4 border-b border-outline/10 px-4 py-4"
        >
          <div class="min-w-0">
            <p class="font-label text-[10px] uppercase tracking-wider text-[var(--reader-muted)]">
              {{ item.feedTitle }}
            </p>
            <h1
              id="reader-title"
              class="font-headline mt-1 text-[24px] font-bold leading-tight text-[var(--reader-fg)] md:text-[36px]"
            >
              {{ item.title }}
            </h1>
            <p class="font-label mt-2 text-[10px] text-[var(--reader-muted)]">
              {{ formatPubDate(item.pubDate) }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <a
              v-if="originalHref"
              class="news-link font-label text-[12px] font-bold text-[var(--reader-link)]"
              :href="originalHref"
              target="_blank"
              rel="noopener noreferrer"
            >
              Original →
            </a>
            <button
              type="button"
              class="bg-primary px-4 py-2 font-label text-[12px] font-bold uppercase tracking-wider text-on-primary hover:bg-primary-container hover:text-on-primary-container"
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
          <div v-if="isLoadingArticle" class="flex flex-col items-center justify-center py-24">
            <div class="article-loading-pulse mb-4 h-1 w-24 bg-[var(--reader-muted)]" />
            <p class="font-label text-[11px] uppercase tracking-widest text-[var(--reader-muted)]">
              Extracting article&hellip;
            </p>
          </div>
          <div
            v-else
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
.reader-glass {
  background-color: color-mix(in srgb, var(--reader-bg) 82%, transparent);
  backdrop-filter: blur(20px);
}

.reader-glass {
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 768px) {
  .reader-glass {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.reader-content :deep(a) {
  color: var(--reader-link);
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}

.reader-content :deep(p) {
  margin: 1rem 0;
}

.reader-content :deep(h1),
.reader-content :deep(h2),
.reader-content :deep(h3),
.reader-content :deep(h4),
.reader-content :deep(h5),
.reader-content :deep(h6) {
  margin: 1.6rem 0 0.75rem;
  font-weight: 700;
  line-height: 1.15;
}

.reader-content :deep(h1) { font-size: 1.6em; }
.reader-content :deep(h2) { font-size: 1.35em; }
.reader-content :deep(h3) { font-size: 1.18em; }
.reader-content :deep(h4) { font-size: 1.05em; }
.reader-content :deep(h5),
.reader-content :deep(h6) { font-size: 0.98em; }

.reader-content :deep(ul),
.reader-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.25em;
}

.reader-content :deep(li) {
  margin: 0.35rem 0;
}

.reader-content :deep(hr) {
  margin: 2rem 0;
  border: 0;
  height: 1px;
  background: color-mix(in srgb, var(--reader-muted) 25%, transparent);
}

.reader-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.92em;
  background: color-mix(in srgb, var(--reader-muted) 12%, transparent);
  padding: 0.12em 0.35em;
  border-radius: 0.35em;
}

.reader-content :deep(pre) {
  margin: 1.25rem 0;
  padding: 1rem 1.1rem;
  overflow: auto;
  border: 1px solid color-mix(in srgb, var(--reader-muted) 18%, transparent);
  background: color-mix(in srgb, var(--reader-muted) 10%, transparent);
  border-radius: 0.75rem;
}

.reader-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.9em;
}

.reader-content :deep(img) {
  display: block;
  max-width: 100%;
  max-height: 60vh;
  height: auto;
  margin: 1.5rem auto;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--reader-muted) 18%, transparent);
  background: color-mix(in srgb, var(--reader-muted) 6%, transparent);
}

.reader-content :deep(figure) {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reader-content :deep(figcaption) {
  margin-top: 0.5rem;
  font-size: 0.9em;
  color: var(--reader-muted);
}

.reader-content :deep(blockquote) {
  font-style: italic;
  border-left: 2px solid color-mix(in srgb, var(--reader-muted) 40%, transparent);
  padding-left: 1rem;
  margin: 1rem 0;
}

.reader-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25rem 0;
  font-size: 0.95em;
}

.reader-content :deep(caption) {
  caption-side: bottom;
  margin-top: 0.5rem;
  font-size: 0.9em;
  color: var(--reader-muted);
}

.reader-content :deep(th),
.reader-content :deep(td) {
  border: 1px solid color-mix(in srgb, var(--reader-muted) 18%, transparent);
  padding: 0.6rem 0.7rem;
  vertical-align: top;
}

.reader-content :deep(th) {
  font-weight: 700;
  background: color-mix(in srgb, var(--reader-muted) 10%, transparent);
}

.reader-content :deep(abbr[title]) {
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .reader-prose {
    scroll-behavior: auto;
  }
  .article-loading-pulse {
    animation: none;
    opacity: 0.4;
  }
}

@keyframes loading-pulse {
  0%, 100% { opacity: 0.15; transform: scaleX(0.6); }
  50% { opacity: 0.5; transform: scaleX(1); }
}

.article-loading-pulse {
  animation: loading-pulse 1.8s ease-in-out infinite;
  transform-origin: center;
}
</style>
