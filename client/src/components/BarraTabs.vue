<script setup>
// Props que llegan desde App.vue
defineProps({
  tabs:        { type: Array,  default: () => [] },
  tabActualId: { type: String, default: null }
})

// Eventos que emite hacia App.vue
const emit = defineEmits(['cambiar-tab', 'cerrar-tab'])
</script>

<template>
  <div class="tabs-bar">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab', { activo: tab.id === tabActualId }]"
      @click="emit('cambiar-tab', tab.id)"
    >
      {{ tab.tipo === 'sala' ? '#' : '🔒' }} {{ tab.nombre }}
      <!-- Solo los chats privados tienen botón de cerrar -->
      <span
        v-if="tab.tipo === 'privada'"
        class="tab-cerrar"
        @click.stop="emit('cerrar-tab', tab.id)"
      >✕</span>
    </div>
  </div>
</template>
