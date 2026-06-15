<script setup>
// Props que llegan desde App.vue
const props = defineProps({
  miUsuario:   { type: Object, required: true },
  usuarios:    { type: Array,  default: () => [] },
  salas:       { type: Array,  default: () => [] },
  tabActualId: { type: String, default: null },
  socketId:    { type: String, required: true }
})

// Eventos que emite hacia App.vue
const emit = defineEmits(['abrir-sala', 'abrir-privado'])

// Devuelve true si el avatar es una imagen (base64 o URL), false si es emoji
function avatarEsImagen(avatar) {
  return avatar && (avatar.startsWith('data:') || avatar.startsWith('http'))
}
</script>

<template>
  <div class="panel-izquierdo">

    <!-- Mi perfil -->
    <div class="mi-perfil">
      <img v-if="avatarEsImagen(miUsuario.avatar)" :src="miUsuario.avatar" class="avatar-img" />
      <span v-else class="avatar-emoji">{{ miUsuario.avatar }}</span>
      <div>
        <div class="nombre">{{ miUsuario.nombre }}</div>
        <div class="estado-texto">{{ miUsuario.estado }}</div>
      </div>
    </div>

    <!-- Lista de salas -->
    <div class="seccion-titulo">Salas</div>
    <ul class="lista-salas">
      <li
        v-for="sala in salas"
        :key="sala"
        :class="{ activo: tabActualId === `sala_${sala}` }"
        @click="emit('abrir-sala', sala)"
      ># {{ sala }}</li>
    </ul>

    <!-- Lista de usuarios conectados -->
    <div class="seccion-titulo">Usuarios ({{ usuarios.length }})</div>
    <ul class="lista-usuarios">
      <li
        v-for="u in usuarios"
        :key="u.id"
        :class="{ yo: u.id === socketId, activo: tabActualId === `privado_${u.id}` }"
        @click="emit('abrir-privado', u)"
      >
        <img v-if="avatarEsImagen(u.avatar)" :src="u.avatar" class="avatar-img" />
        <span v-else class="avatar-emoji">{{ u.avatar }}</span>
        <div>
          <div class="nombre">{{ u.nombre }} <span v-if="u.id === socketId">(tú)</span></div>
          <div class="estado-texto">{{ u.estado }}</div>
        </div>
      </li>
    </ul>

  </div>
</template>
