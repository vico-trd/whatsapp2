<script setup>
import { ref } from 'vue'
import { auth, googleProvider } from '../firebase.js'
import { signInWithPopup } from 'firebase/auth'

// Cuando Firebase autentica, emitimos los datos del usuario al padre (App.vue)
const emit = defineEmits(['login-exitoso'])

const formNombre    = ref('')
const formEstado    = ref('Disponible')
const formAvatar    = ref('')       // base64 de la imagen subida
const avatarPreview = ref('')       // preview de la imagen en el formulario
const avatarInput   = ref(null)     // referencia al <input type="file"> oculto
const errorLogin    = ref('')       // mensaje de error que ve el usuario
const cargando      = ref(false)    // true mientras Firebase procesa

const estados = ['Disponible', 'Ocupado', 'En el trabajo', 'No molestar', 'Solo emergencias']

// Redimensiona la imagen a 100px con Canvas antes de guardarla en base64
function seleccionarAvatar(e) {
  const archivo = e.target.files[0]
  if (!archivo) return
  const img    = new Image()
  const reader = new FileReader()
  reader.onload = () => {
    img.src = reader.result
    img.onload = () => {
      const canvas  = document.createElement('canvas')
      const MAX     = 100
      const ratio   = Math.min(MAX / img.width, MAX / img.height)
      canvas.width  = img.width  * ratio
      canvas.height = img.height * ratio
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      const base64       = canvas.toDataURL('image/jpeg', 0.8)
      avatarPreview.value = base64
      formAvatar.value    = base64
    }
  }
  reader.readAsDataURL(archivo)
}

// Abre el popup de Google, autentica y emite los datos al padre
async function login() {
  errorLogin.value = ''
  cargando.value   = true
  try {
    const resultado     = await signInWithPopup(auth, googleProvider)
    const usuarioGoogle = resultado.user

    // Nombre: usa el que escribió el usuario, o el de Google como reserva
    const nombre = formNombre.value.trim() || usuarioGoogle.displayName || 'Usuario'
    // Avatar: usa el que subió, o la foto de Google como reserva
    const avatar = formAvatar.value || usuarioGoogle.photoURL || '🙂'

    emit('login-exitoso', { nombre, estado: formEstado.value, avatar })
  } catch (e) {
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      errorLogin.value = 'Cerraste la ventana de Google sin iniciar sesión'
    } else {
      errorLogin.value = 'Error al entrar con Google: ' + e.message
    }
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-pantalla">
    <div class="login-caja">
      <h1>💬 WhatsApp 2</h1>
      <p>Identifícate para entrar al chat</p>

      <label>Tu nombre en el chat <span class="label-opcional">(opcional, si no se usa el de Google)</span></label>
      <input v-model="formNombre" placeholder="Escribe tu nombre..." />

      <label>Tu estado</label>
      <select v-model="formEstado">
        <option v-for="e in estados" :key="e">{{ e }}</option>
      </select>

      <label>Tu imagen de avatar</label>
      <div class="avatar-upload" @click="avatarInput.click()">
        <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview" />
        <span v-else class="avatar-placeholder">📷 Subir foto</span>
        <input ref="avatarInput" type="file" accept="image/*" @change="seleccionarAvatar" />
      </div>

      <p v-if="errorLogin" class="error-login">⚠️ {{ errorLogin }}</p>

      <button class="btn-google" @click="login" :disabled="cargando">
        <svg viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        {{ cargando ? 'Entrando...' : 'Entrar con Google' }}
      </button>
    </div>
  </div>
</template>
