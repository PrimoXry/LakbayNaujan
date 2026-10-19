<template>
  <span class="profile-avatar" :class="{ 'profile-avatar-large': large }">
    <img v-if="src && !failed" :src="src" :alt="`${name}'s profile picture`" @error="failed = true" />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
const props = defineProps<{ name: string; src: string | null; large?: boolean }>();
const failed = ref(false);
const initials = computed(() => props.name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || 'U');
watch(() => props.src, () => { failed.value = false; });
</script>
<style scoped>
.profile-avatar { display: inline-grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: var(--app-soft); color: var(--app-accent); border: 2px solid var(--app-border); font-size: 15px; font-weight: 800; }
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-avatar-large { width: 132px; height: 132px; font-size: 40px; }
</style>
