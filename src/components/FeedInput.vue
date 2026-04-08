<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  add: [url: string]
}>()

const url = ref('')

function submit() {
  emit('add', url.value)
  url.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="font-label text-xs tracking-wider uppercase text-primary font-bold">Add a feed</h2>
    <p class="font-label text-[10px] text-secondary leading-relaxed">
      Paste one RSS URL at a time. Feeds load through the dev server proxy to avoid browser CORS limits.
    </p>
    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <label class="sr-only" for="feed-url">RSS feed URL</label>
      <input
        id="feed-url"
        v-model="url"
        type="url"
        name="url"
        placeholder="https://example.com/feed.xml"
        autocomplete="url"
        class="w-full bg-transparent font-body text-on-surface placeholder:text-outline/60 border-0 border-b border-outline/30 pb-2 text-sm outline-none transition-colors focus:border-b-2 focus:border-primary focus:bg-surface-container-highest"
      />
      <button
        type="submit"
        class="bg-primary text-on-primary py-3 font-label text-xs tracking-widest uppercase font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
        :disabled="loading || !url.trim()"
      >
        {{ loading ? 'Fetching…' : 'Add feed' }}
      </button>
    </form>
    <p v-if="props.error" class="font-label text-xs text-error" role="alert">
      {{ props.error }}
    </p>
  </div>
</template>
