<script setup>
// Props que llegan desde App.vue
defineProps({
  mensajes: { type: Array,  default: () => [] },
  socketId: { type: String, required: true }
})

// Comprueba si un tipo MIME corresponde a una imagen
function esImagen(mimeType) {
  return mimeType && mimeType.startsWith('image/')
}
</script>

<template>
  <ul class="mensajes">
    <li
      v-for="(msg, i) in mensajes"
      :key="i"
      :class="msg.tipo === 'aviso' ? 'aviso' : msg.de === socketId ? 'mio' : 'otro'"
    >
      <!-- Aviso del sistema: alguien entró o salió -->
      <span v-if="msg.tipo === 'aviso'">{{ msg.texto }}</span>

      <!-- Mensaje con archivo adjunto -->
      <template v-else-if="msg.tipo === 'archivo'">
        <span class="msg-autor">{{ msg.de === socketId ? 'Tú' : msg.nombre }}</span>
        <img v-if="esImagen(msg.mimeType)" :src="msg.archivo" class="imagen-chat" />
        <a :href="msg.archivo" :download="msg.nombreArchivo" class="btn-descarga">
          {{ esImagen(msg.mimeType) ? '⬇ Descargar imagen' : '📎 ' + msg.nombreArchivo }}
        </a>
      </template>

      <!-- Mensaje de texto normal -->
      <template v-else>
        <span class="msg-autor">{{ msg.de === socketId ? 'Tú' : msg.nombre }}</span>
        <span class="msg-texto">{{ msg.texto }}</span>
      </template>
    </li>
  </ul>
</template>
