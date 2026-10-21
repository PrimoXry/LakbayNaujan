<template>
  <section class="photo-slider" role="region" aria-roledescription="carousel" :aria-label="`${name} photos`"
    tabindex="0" @keydown.left.prevent="goTo(active - 1)" @keydown.right.prevent="goTo(active + 1)"
    @mouseenter="isHovered = true" @mouseleave="isHovered = false"
    @focusin="isFocused = true" @focusout="isFocused = false">
    <div v-if="images.length" ref="track" class="photo-track" @scroll.passive="onScroll">
      <div v-for="(url, index) in images" :key="url" class="photo-slide" role="group" aria-roledescription="slide"
        :aria-label="`${index + 1} of ${images.length}`" :aria-hidden="active !== index">
        <img v-if="!failed.includes(url)" :src="url" :alt="`${name} — photo ${index + 1}`" :loading="index ? 'lazy' : 'eager'"
          draggable="false" @error="failed.push(url)" />
        <div v-else class="photo-placeholder">Photo unavailable</div>
      </div>
    </div>
    <div v-else class="photo-placeholder"><span aria-hidden="true">&#127807;</span><span>No photos yet</span></div>
    <template v-if="images.length > 1">
      <button type="button" class="photo-arrow previous" :aria-label="`Previous photo of ${name}`" @click.stop="goTo(active - 1)">&#10094;</button>
      <button type="button" class="photo-arrow next" :aria-label="`Next photo of ${name}`" @click.stop="goTo(active + 1)">&#10095;</button>
      <div class="photo-pagination">
        <button v-for="(_, index) in images" :key="index" type="button" class="photo-dot" :class="{ selected: active === index }"
          :aria-label="`Show photo ${index + 1} of ${name}`" :aria-current="active === index ? 'true' : undefined" @click.stop="goTo(index)"></button>
      </div>
      <span class="photo-count" aria-live="polite" aria-atomic="true">{{ active + 1 }} / {{ images.length }}</span>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { spotImages } from '../lib/spotPhotos';
const props = defineProps<{ name: string; imageUrls?: string[]; imageUrl?: string | null; autoPlay?: boolean }>();
const images = computed(() => spotImages({ image_urls: props.imageUrls, image_url: props.imageUrl }));
const track = ref<HTMLElement | null>(null);
const active = ref(0);
const failed = ref<string[]>([]);
const isHovered = ref(false);
const isFocused = ref(false);
let autoPlayTimer: ReturnType<typeof setInterval> | undefined;
let isMounted = false;

function goTo(index: number) {
  if (!images.value.length) return;
  active.value = (index + images.value.length) % images.value.length;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  track.value?.scrollTo({ left: active.value * track.value.clientWidth, behavior: reducedMotion ? 'auto' : 'smooth' });
}

function startAutoPlay() {
  if (autoPlayTimer) clearInterval(autoPlayTimer);
  autoPlayTimer = undefined;
  if (!isMounted || !props.autoPlay || images.value.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  autoPlayTimer = setInterval(() => {
    if (document.hidden || isHovered.value || isFocused.value) return;
    goTo(active.value + 1);
  }, 2000);
}

function onScroll() {
  if (!track.value?.clientWidth) return;
  active.value = Math.max(0, Math.min(images.value.length - 1, Math.round(track.value.scrollLeft / track.value.clientWidth)));
}

watch(images, () => {
  active.value = 0; failed.value = [];
  if (track.value) track.value.scrollLeft = 0;
}, { flush: 'post' });
watch(() => [props.autoPlay, images.value.length], startAutoPlay);

onMounted(() => {
  isMounted = true;
  startAutoPlay();
});

onBeforeUnmount(() => {
  isMounted = false;
  if (autoPlayTimer) clearInterval(autoPlayTimer);
});
</script>

<style scoped>
.photo-slider { position: relative; width: 100%; height: 100%; min-height: 160px; overflow: hidden; background: var(--app-soft, #dfebe1); border-radius: inherit; }
.photo-slider:focus-visible { outline: 3px solid var(--app-accent, #26784e); outline-offset: -3px; }
.photo-track { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
.photo-track::-webkit-scrollbar { display: none; }
.photo-slide { flex: 0 0 100%; min-width: 0; height: 100%; scroll-snap-align: start; scroll-snap-stop: always; }
.photo-slide img { display: block; width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; background: linear-gradient(145deg, #bcdbc7, #397454); color: white; font-size: 14px; }
.photo-placeholder > span:first-child { font-size: 38px; }
.photo-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 40px; border: 1px solid #ffffff77; border-radius: 12px; background: #163624aa; color: white; cursor: pointer; }
.previous { left: 8px; } .next { right: 8px; }
.photo-pagination { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; padding: 2px 6px; border-radius: 24px; background: #163624aa; }
.photo-dot { width: 16px; height: 24px; padding: 0; border: 0; background: transparent; cursor: pointer; display: grid; place-items: center; }
.photo-dot::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #ffffff77; }
.photo-dot.selected::after { background: white; width: 8px; height: 8px; }
.photo-count { position: absolute; bottom: 12px; right: 12px; padding: 4px 7px; border-radius: 8px; background: #163624bb; color: white; font-size: 11px; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .photo-track { scroll-behavior: auto; } }
</style>
