<script setup>
import { ref, computed, onMounted } from 'vue'
import { io } from 'socket.io-client'

// Importamos los componentes que hemos creado
import LoginForm       from './components/LoginForm.vue'
import PanelIzquierdo  from './components/PanelIzquierdo.vue'
import BarraTabs       from './components/BarraTabs.vue'
import ListaMensajes   from './components/ListaMensajes.vue'
import FormularioEnvio from './components/FormularioEnvio.vue'

// En desarrollo conecta a localhost:3000
// En producción conecta al mismo dominio (servidor y cliente están juntos)
const socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin)

// ════════════════════════════════════════════════════
// ESTADO GLOBAL (compartido entre componentes)
// ════════════════════════════════════════════════════
const logueado     = ref(false)
const miUsuario    = ref(null)

const SALAS        = ['General', 'Tecnología', 'Música', 'Gaming']
const tabs         = ref([])     // pestañas abiertas: [{ id, tipo, nombre, socketId? }]
const tabActualId  = ref(null)   // id de la pestaña activa
const mensajes     = ref({})     // { [tabId]: [ ...mensajes ] }
const usuarios     = ref([])     // lista de usuarios conectados
const quienEscribe = ref({})     // { [tabId]: nombre de quien escribe }

// La pestaña activa como objeto completo
const tabActual = computed(() => tabs.value.find(t => t.id === tabActualId.value))

// Los mensajes de la pestaña activa
const mensajesActuales = computed(() => mensajes.value[tabActualId.value] || [])

// Quien está escribiendo en la pestaña activa
const escribiendoActual = computed(() => quienEscribe.value[tabActualId.value] || '')

// ════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════

// LoginForm emite 'login-exitoso' con los datos del usuario → aquí los recibimos
function alLoguearse(datosUsuario) {
  miUsuario.value = datosUsuario
  socket.emit('login', datosUsuario)
  logueado.value = true
  abrirSala('General')  // entramos a la sala General automáticamente
}

// ════════════════════════════════════════════════════
// GESTIÓN DE PESTAÑAS (TABS)
// ════════════════════════════════════════════════════

function abrirSala(nombre) {
  const id = `sala_${nombre}`
  if (!tabs.value.find(t => t.id === id)) {
    tabs.value.push({ id, tipo: 'sala', nombre })
    mensajes.value[id] = []
  }
  tabActualId.value = id
  socket.emit('join room', nombre)
}

function abrirPrivado(usuario) {
  if (usuario.id === socket.id) return  // no chatear con uno mismo
  const id = `privado_${usuario.id}`
  if (!tabs.value.find(t => t.id === id)) {
    tabs.value.push({ id, tipo: 'privada', nombre: usuario.nombre, socketId: usuario.id })
    mensajes.value[id] = []
  }
  tabActualId.value = id
}

function cerrarTab(id) {
  const tab = tabs.value.find(t => t.id === id)
  if (tab?.tipo === 'sala') socket.emit('leave room', tab.nombre)
  tabs.value = tabs.value.filter(t => t.id !== id)
  delete mensajes.value[id]
  tabActualId.value = tabs.value[0]?.id || null
}

// ════════════════════════════════════════════════════
// EVENTOS DEL SERVIDOR (Socket.IO)
// ════════════════════════════════════════════════════
onMounted(() => {

  // Lista de usuarios actualizada (alguien entró o salió)
  socket.on('lista usuarios', lista => { usuarios.value = lista })

  // Aviso de sistema en una sala
  socket.on('aviso', ({ texto, sala }) => {
    const id = `sala_${sala}`
    if (mensajes.value[id]) mensajes.value[id].push({ tipo: 'aviso', texto })
  })

  // Mensaje de texto en una sala
  socket.on('chat message', msg => {
    const id = `sala_${msg.sala}`
    if (!mensajes.value[id]) mensajes.value[id] = []
    mensajes.value[id].push({ tipo: 'chat', ...msg })
  })

  // Mensaje privado de texto
  socket.on('private message', msg => {
    const otroId = msg.de === socket.id ? msg.para : msg.de
    const id     = `privado_${otroId}`
    if (!tabs.value.find(t => t.id === id)) {
      const nombre = msg.de === socket.id
        ? (usuarios.value.find(u => u.id === msg.para)?.nombre || 'Usuario')
        : msg.nombre
      tabs.value.push({ id, tipo: 'privada', nombre, socketId: otroId })
      mensajes.value[id] = []
    }
    mensajes.value[id].push({ tipo: 'chat', ...msg })
  })

  // Archivo en una sala
  socket.on('file message', msg => {
    const id = `sala_${msg.sala}`
    if (!mensajes.value[id]) mensajes.value[id] = []
    mensajes.value[id].push({ tipo: 'archivo', ...msg })
  })

  // Archivo privado
  socket.on('private file', msg => {
    const otroId = msg.de === socket.id ? msg.para : msg.de
    const id     = `privado_${otroId}`
    if (!tabs.value.find(t => t.id === id)) {
      const nombre = msg.de === socket.id
        ? (usuarios.value.find(u => u.id === msg.para)?.nombre || 'Usuario')
        : msg.nombre
      tabs.value.push({ id, tipo: 'privada', nombre, socketId: otroId })
      mensajes.value[id] = []
    }
    mensajes.value[id].push({ tipo: 'archivo', ...msg })
  })

  // Indicador de escritura en salas
  socket.on('typing', ({ nombre, escribiendo, sala }) => {
    quienEscribe.value[`sala_${sala}`] = escribiendo ? nombre : ''
  })

  // Indicador de escritura en chats privados
  socket.on('typing private', ({ nombre, escribiendo, de }) => {
    quienEscribe.value[`privado_${de}`] = escribiendo ? nombre : ''
  })
})

// ════════════════════════════════════════════════════
// ACCIONES DEL FORMULARIO DE ENVÍO
// (FormularioEnvio emite eventos → aquí hacemos el socket.emit)
// ════════════════════════════════════════════════════

function alEnviar(texto) {
  const tab = tabActual.value
  if (!tab) return
  if (tab.tipo === 'sala') {
    socket.emit('chat message', { texto, sala: tab.nombre })
  } else {
    socket.emit('private message', { texto, para: tab.socketId })
  }
}

function alEscribir() {
  const tab = tabActual.value
  if (!tab) return
  if (tab.tipo === 'sala') {
    socket.emit('typing', { escribiendo: true, sala: tab.nombre })
  } else {
    socket.emit('typing private', { escribiendo: true, para: tab.socketId })
  }
}

function alPararTyping() {
  const tab = tabActual.value
  if (!tab) return
  if (tab.tipo === 'sala') {
    socket.emit('typing', { escribiendo: false, sala: tab.nombre })
  } else {
    socket.emit('typing private', { escribiendo: false, para: tab.socketId })
  }
}

function alArchivo(datos) {
  const tab = tabActual.value
  if (!tab) return
  if (tab.tipo === 'sala') {
    socket.emit('file message', { ...datos, sala: tab.nombre })
  } else {
    socket.emit('private file', { ...datos, para: tab.socketId })
  }
}
</script>

<template>

  <!-- Si no está logueado → mostramos el formulario de login -->
  <LoginForm v-if="!logueado" @login-exitoso="alLoguearse" />

  <!-- Si está logueado → mostramos la pantalla de chat -->
  <div v-else class="chat-pantalla">

    <!-- Panel izquierdo: perfil + salas + usuarios -->
    <PanelIzquierdo
      :miUsuario="miUsuario"
      :usuarios="usuarios"
      :salas="SALAS"
      :tabActualId="tabActualId"
      :socketId="socket.id"
      @abrir-sala="abrirSala"
      @abrir-privado="abrirPrivado"
    />

    <!-- Panel central: tabs + mensajes + formulario -->
    <div class="panel-central">

      <!-- Barra de pestañas -->
      <BarraTabs
        :tabs="tabs"
        :tabActualId="tabActualId"
        @cambiar-tab="id => tabActualId = id"
        @cerrar-tab="cerrarTab"
      />

      <!-- Sin ninguna pestaña abierta -->
      <div v-if="!tabActual" class="sin-chat">
        <p>Selecciona una sala o un usuario del panel izquierdo</p>
      </div>

      <template v-else>
        <!-- Lista de mensajes -->
        <ListaMensajes :mensajes="mensajesActuales" :socketId="socket.id" />

        <!-- Indicador de escritura -->
        <div class="escribiendo">
          <span v-if="escribiendoActual">{{ escribiendoActual }} está escribiendo...</span>
        </div>

        <!-- Formulario de texto + adjuntos -->
        <FormularioEnvio
          :tabActual="tabActual"
          @enviar="alEnviar"
          @escribiendo="alEscribir"
          @parar-typing="alPararTyping"
          @archivo="alArchivo"
        />
      </template>

    </div>
  </div>

</template>

