<script setup>
import { ref } from 'vue'

// Props que llegan desde App.vue
defineProps({
  tabActual: { type: Object, default: null }
})

// Eventos que emite hacia App.vue (App.vue hace el socket.emit correspondiente)
const emit = defineEmits(['enviar', 'escribiendo', 'parar-typing', 'archivo'])

const input = ref('')        // texto que está escribiendo el usuario
let typingTimer = null       // temporizador para detectar cuando para de escribir

// Envía el mensaje y avisa al padre
function sendMessage() {
  if (!input.value.trim()) return
  emit('enviar', input.value.trim())
  input.value = ''
  // Paramos el indicador de escritura al enviar
  clearTimeout(typingTimer)
  emit('parar-typing')
}

// Se llama cada vez que el usuario escribe una letra
function alEscribir() {
  emit('escribiendo')
  clearTimeout(typingTimer)
  // Si lleva 1.5 segundos sin escribir, avisamos que paró
  typingTimer = setTimeout(() => emit('parar-typing'), 1500)
}

// Lee el archivo y emite sus datos en base64 al padre
function seleccionarArchivo(e) {
  const archivo = e.target.files[0]
  if (!archivo) return
  const reader = new FileReader()
  reader.onload = () => {
    emit('archivo', {
      archivo:       reader.result,
      nombreArchivo: archivo.name,
      mimeType:      archivo.type
    })
  }
  reader.readAsDataURL(archivo)
  e.target.value = ''  // limpiamos el input para poder subir el mismo archivo otra vez
}
</script>

<template>
  <form @submit.prevent="sendMessage">
    <!-- Botón para adjuntar archivo -->
    <label class="btn-archivo" title="Adjuntar archivo">
      📎
      <input type="file" @change="seleccionarArchivo" />
    </label>

    <!-- Campo de texto -->
    <input
      v-model="input"
      autocomplete="off"
      placeholder="Escribe un mensaje..."
      @input="alEscribir"
    />

    <!-- Botón enviar -->
    <button type="submit">&#9658;</button>
  </form>
</template>
