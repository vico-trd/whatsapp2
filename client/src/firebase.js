// Configuración e inicialización de Firebase para el cliente

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Proveedor de Google para el login
export const googleProvider = new GoogleAuthProvider()

// Datos de configuración del proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCURToVRiRkQwnkE7LDpfVbGthlobPz8ss",
  authDomain: "whtasapp2.firebaseapp.com",
  projectId: "whtasapp2",
  storageBucket: "whtasapp2.firebasestorage.app",
  messagingSenderId: "501142327188",
  appId: "1:501142327188:web:71ac793818a05664118981",
  measurementId: "G-Y06B1X80NG"
}

// Inicializamos la app de Firebase
const app = initializeApp(firebaseConfig)

// Exportamos el servicio de autenticación para usarlo en otros archivos
export const auth = getAuth(app)

export default app
