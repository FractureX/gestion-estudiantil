import { URL_USUARIO_CREATE, URL_PERIODO_SELECT_ALL, URL_USUARIO_LOGIN } from './urls.js';
import { sendOtpCode, verifyEmail, getOtpCode, verifyOtpCode, showNotification, verifyCedula } from './functions.js';
import { makeRequest } from './request.js';
import { OTP_INVALIDO, USUARIO_CREACION_PROBLEMA, USUARIO_CORREO_EN_USO, OTP_ENVIADO } from './messages.js';

// Funciones
async function loadData() {
  const periodSelect = document.getElementById('period');

  // Cargar los datos usando fetch
  try {
    const response = await makeRequest(
      URL_PERIODO_SELECT_ALL, // baseUrl
      'GET',                 // method
      {},                    // params (query params)
      null,                  // body data (no aplica para GET)
      {},                    // headers
      null,                  // token
      {}                     // pathParams
    );

    // Suponiendo que data es un array de objetos con 'id' y 'nombre'
    if (response.status === 200) {
      response.data.forEach(period => {
        const option = document.createElement('option');
        option.value = period.id;
        option.textContent = period.nombre;
        periodSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al obtener los datos de los periodos:', error);
  }
}

async function validateForm() {
  let names = document.getElementById('names').value;
  let surnames = document.getElementById('surnames').value;
  let cedula = document.getElementById('cedula').value;
  let period = parseInt(document.getElementById('period').value);
  let email = document.getElementById('email').value;
  let password = document.getElementById('password').value;
  if (!names || !surnames || !cedula || !period || !email || !password || getOtpCode().length === 0) {
    return null;
  }
  // if (!await verifyCedula()) {
  //   showNotification("error", OTP_INVALIDO)
  //   return null;
  // }
  if (!await verifyOtpCode()) {
    showNotification("error", OTP_INVALIDO)
    return null;
  }
  return {
    "nombres": names,
    "apellidos": surnames,
    "cedula": cedula,
    "email": email,
    "password": password,
    "periodo": period,
    "rol": 2
  }
}

async function register(event) {
  // Evitar que se refresque la página
  event.preventDefault();

  // Validar formulario
  const data = await validateForm();
  if (data === null) {
    return
  }
  // Registrar
  try {
    // Crear usuario
    const createResponse = await makeRequest(
      URL_USUARIO_CREATE,    // baseUrl
      'POST',                // method
      {},                    // params (query params)
      data,                  // body data
      { 'Content-Type': 'application/json' }, // headers
      null,                  // token
      {}                     // pathParams
    );

    if (createResponse.status !== 201) {
      showNotification("error", USUARIO_CREACION_PROBLEMA)
      return;
    }

    // Obtener token después de registrar al usuario
    const tokenResponse = await makeRequest(
      URL_USUARIO_LOGIN,     // baseUrl
      'POST',                // method
      {},                    // params
      { email: data.email, password: data.password }, // body data
      { 'Content-Type': 'application/json' }, // headers
      null,                  // token
      {}                     // pathParams
    );

    if (tokenResponse.status !== 200) {
      showNotification("error", TOKEN_PROBLEMA_OBTENIENDO)
      return;
    }
    sessionStorage.setItem("access_token", tokenResponse.data.access_token);
    window.location.href = "/";
  } catch (error) {
    showNotification("error", USUARIO_CREACION_PROBLEMA)
  }
}

async function handleSendOtpCode(event) {
  event.preventDefault();
  if (await verifyEmail() !== null) {
    showNotification("warning", USUARIO_CORREO_EN_USO)
    return;
  }
  await sendOtpCode();
  showNotification("success", OTP_ENVIADO)
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
  // Cargar información
  loadData();

  // Añadir evento de "Enviar Código"
  const sendCodeButton = document.getElementById("sendOtp");
  sendCodeButton.addEventListener("click", (event) => handleSendOtpCode(event));

  // Añadir evento de submit
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => register(event));
  }
})