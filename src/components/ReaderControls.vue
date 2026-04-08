<script setup lang="ts">
import { computed } from 'vue'

import { bgTokens, type ReaderBgPreset, type ReaderSettings } from '@/composables/useReaderTheme'

const props = defineProps<{
  open: boolean
  settings: ReaderSettings
}>()

const emit = defineEmits<{
  'update:open': [v: boolean]
  'update:settings': [v: ReaderSettings]
}>()

const panelOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

function patch(p: Partial<ReaderSettings>) {
  emit('update:settings', { ...props.settings, ...p })
}

const fontChoices = [
  { label: 'Newsreader', value: 'Newsreader, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Public Sans', value: '"Public Sans", sans-serif' },
] as const

const presets: { id: ReaderBgPreset; label: string }[] = [
  { id: 'wheat', label: 'Wheat white' },
  { id: 'sepia', label: 'Sepia archive' },
  { id: 'velvet', label: 'Crushed velvet' },
]

const activeTokens = computed(() => bgTokens[props.settings.bgPreset])

const panelVars = computed(() => {
  const t = activeTokens.value
  return {
    '--controls-bg': t.bg,
    '--controls-fg': t.fg,
    '--controls-muted': t.muted,
    '--controls-border': `color-mix(in srgb, ${t.muted} 22%, transparent)`,
  } as Record<string, string>
})
</script>

<template>
  <div class="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="panelOpen"
        class="controls-glass pointer-events-auto max-h-[min(80vh,520px)] w-[min(92vw,320px)] overflow-y-auto border p-5 shadow-[0_20px_40px_rgba(106,93,67,0.08)]"
        :style="panelVars"
        role="dialog"
        aria-label="Reader settings"
      >
        <h3 class="font-label text-[12px] font-bold uppercase tracking-wider text-primary">Typography</h3>
        <div class="mt-4 space-y-4">
          <label class="block">
            <span class="font-label text-[10px] uppercase tracking-wider text-[var(--controls-muted)]">Font size</span>
            <input
              type="range"
              class="mt-2 w-full accent-primary"
              min="14"
              max="28"
              :value="settings.fontSizePx"
              @input="patch({ fontSizePx: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="font-label text-[10px] text-[var(--controls-muted)]">{{ settings.fontSizePx }}px</span>
          </label>

          <label class="block">
            <span class="font-label text-[10px] uppercase tracking-wider text-[var(--controls-muted)]">Font family</span>
            <select
              class="mt-2 w-full border-0 border-b bg-transparent py-2 font-body text-[14px] text-[var(--controls-fg)] outline-none focus:border-b-2 focus:border-primary"
              :value="settings.fontFamily"
              @change="patch({ fontFamily: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="f in fontChoices" :key="f.value" :value="f.value">
                {{ f.label }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="font-label text-[10px] uppercase tracking-wider text-[var(--controls-muted)]">Line height</span>
            <input
              type="range"
              class="mt-2 w-full accent-primary"
              min="1.5"
              max="1.9"
              step="0.05"
              :value="settings.lineHeight"
              @input="patch({ lineHeight: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="font-label text-[10px] text-[var(--controls-muted)]">{{ settings.lineHeight.toFixed(2) }}</span>
          </label>

          <label class="block">
            <span class="font-label text-[10px] uppercase tracking-wider text-[var(--controls-muted)]">Column width</span>
            <input
              type="range"
              class="mt-2 w-full accent-primary"
              min="28"
              max="52"
              step="1"
              :value="settings.maxWidthRem"
              @input="patch({ maxWidthRem: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="font-label text-[10px] text-[var(--controls-muted)]">{{ settings.maxWidthRem }}rem</span>
          </label>

          <label class="block">
            <span class="font-label text-[10px] uppercase tracking-wider text-[var(--controls-muted)]">Letter spacing</span>
            <input
              type="range"
              class="mt-2 w-full accent-primary"
              min="-0.02"
              max="0.08"
              step="0.005"
              :value="settings.letterSpacingEm"
              @input="patch({ letterSpacingEm: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="font-label text-[10px] text-[var(--controls-muted)]">
              {{ settings.letterSpacingEm.toFixed(3) }}em
            </span>
          </label>
        </div>

        <h3 class="font-label mt-8 text-[12px] font-bold uppercase tracking-wider text-primary">Paper</h3>
        <div class="mt-3 grid grid-cols-1 gap-2">
          <button
            v-for="p in presets"
            :key="p.id"
            type="button"
            class="flex items-center gap-3 border px-3 py-2 text-left font-label text-[12px] uppercase tracking-wider transition-colors"
            :class="
              settings.bgPreset === p.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-[var(--controls-muted)] hover:border-primary/40'
            "
            @click="patch({ bgPreset: p.id })"
          >
            <span
              class="h-6 w-6 shrink-0 border"
              :style="{ background: bgTokens[p.id].bg }"
              aria-hidden="true"
            />
            {{ p.label }}
          </button>
        </div>
      </div>
    </Transition>

    <button
      type="button"
      class="pointer-events-auto flex h-12 w-12 items-center justify-center bg-primary text-on-primary shadow-[0_20px_40px_rgba(106,93,67,0.08)] transition-colors hover:bg-primary-container hover:text-on-primary-container"
      :aria-expanded="panelOpen"
      aria-label="Reader appearance"
      @click="panelOpen = !panelOpen"
    >
      <span class="material-symbols-outlined text-[22px]">tune</span>
    </button>
  </div>
</template>

<style scoped>
.controls-glass {
  background-color: color-mix(in srgb, var(--controls-bg) 84%, transparent);
  border-color: var(--controls-border);
  color: var(--controls-fg);
  backdrop-filter: blur(20px);
}

.controls-glass select {
  border-bottom-color: var(--controls-border);
}

.controls-glass button {
  border-color: var(--controls-border);
}
</style>
