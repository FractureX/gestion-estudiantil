import { URL_USUARIO_UPDATE } from './urls.js';
import { sendOtpCode, verifyEmail, verifyOtpCode, showNotification } from './functions.js';
import { makeRequest } from './request.js';
import { USUARIO_CORREO_NO_EXISTENTE, OTP_INVALIDO, OTP_ENVIADO } from './messages.js';

async function validateForm() {
  let id = null;
  let email = document.getElementById('email').value;
  let password = document.getElementById('password').value;
  if (!email || !password) {
    return null
  }
  id = await verifyEmail()
  if (id === null) {
    showNotification("error", USUARIO_CORREO_NO_EXISTENTE)
    return null;
  }
  if (!await verifyOtpCode()) {
    showNotification("error", OTP_INVALIDO)
    return null;
  }
  return {
    "id": id,
    "data": {
      "email": email,
      "password": password
    }
  }
}

async function recover(event) {
  // Evitar que se refresque la página
  event.preventDefault();

  // Validar formulario
  const data = await validateForm();
  if (data === null) {
    return
  }
  // Actualizar
  const response = await makeRequest(
    URL_USUARIO_UPDATE,            // baseUrl
    'PATCH',        // method
    {},             // params (query params)
    data.data,      // body data
    { 'Content-Type': 'application/json' }, // headers
    null,           // token (si lo necesitas, pásalo aquí)
    { id: data.id } // pathParams
  );
  if (response.status !== 200) {
    return;
  }
  window.location.href = "/login/";
}

async function handleSendOtpCode(event) {
  event.preventDefault();
  if (await verifyEmail() === null) {
    showNotification("error", USUARIO_CORREO_NO_EXISTENTE)
    return;
  }
  showNotification()
  await sendOtpCode();
  showNotification("success", OTP_ENVIADO)
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
  // Añadir evento de "Enviar Código"
  const sendCodeButton = document.getElementById("sendOtp");
  sendCodeButton.addEventListener("click", (event) => handleSendOtpCode(event));

  // Añadir evento de submit
  const recoverForm = document.getElementById("recoverForm");
  if (recoverForm) {
    recoverForm.addEventListener("submit", (event) => recover(event));
  }
})