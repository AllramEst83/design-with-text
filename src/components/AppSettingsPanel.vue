<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  fontScale: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:fontScale': [value: number]
}>()

const draftFontScale = ref(props.fontScale)

watch(
  () => props.fontScale,
  (next) => {
    draftFontScale.value = next
  },
)

function closePanel() {
  emit('update:modelValue', false)
}

function onFontScalePreviewInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  const value = Number(target.value)
  if (!Number.isFinite(value)) return
  draftFontScale.value = value
}

function commitFontScale() {
  const value = Math.round(draftFontScale.value)
  if (!Number.isFinite(value)) return
  if (value === props.fontScale) return
  emit('update:fontScale', value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div class="absolute inset-0 bg-inverse-surface/45" aria-hidden="true" @click="closePanel" />
      <section class="relative z-10 w-full max-w-xl border border-outline/20 bg-surface p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="settings-title" class="font-headline text-2xl font-bold text-primary">
              Settings
            </h2>
            <p class="font-label mt-2 text-[0.625rem] uppercase tracking-wider text-secondary">
              App text scale (reader mode is not affected)
            </p>
          </div>
          <button
            type="button"
            class="font-label text-[0.625rem] uppercase tracking-widest text-primary underline decoration-1 underline-offset-2"
            @click="closePanel"
          >
            Close
          </button>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="font-label text-[0.625rem] uppercase tracking-wider text-secondary" for="app-font-scale">
              Font size
            </label>
            <span class="font-label text-[0.625rem] uppercase tracking-wider text-primary">
              {{ draftFontScale }}%
            </span>
          </div>
          <input
            id="app-font-scale"
            class="w-full accent-primary"
            type="range"
            min="85"
            max="125"
            step="1"
            :value="draftFontScale"
            @input="onFontScalePreviewInput"
            @change="commitFontScale"
            @pointerup="commitFontScale"
            @touchend="commitFontScale"
          />
          <p class="font-body text-sm text-on-surface-variant">
            This scales the main app typography. Reader mode keeps using its own typography controls.
          </p>
        </div>
      </section>
    </div>
  </Teleport>
</template>

