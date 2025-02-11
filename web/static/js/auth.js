import { URL_USUARIO_LOGIN, URL_TOKEN_VALIDATE } from "./urls.js"
import { makeRequest } from './request.js';
import { USUARIO_CREDENCIALES_INVALIDAS, USUARIO_INGRESAR_DATOS, TOKEN_PROBLEMA_VALIDANDO } from './messages.js';
import { showNotification } from './functions.js'

export async function login(event) {
  event.preventDefault();
  const data = validateLoginForm();

  if (!data) {
    showNotification("warning", USUARIO_INGRESAR_DATOS);
    return;
  }

  try {
    const response = await makeRequest(
      URL_USUARIO_LOGIN,     // baseUrl
      'POST',                // method
      {},                    // params (query params)
      { email: data.email, password: data.password }, // body data
      { 'Content-Type': 'application/json' }, // headers
      null,                  // token
      {}                     // pathParams
    );

    if (response.data.access_token) {
      sessionStorage.setItem("access_token", response.data.access_token);
      window.location.href = "/";
    } else {
      showNotification("error", USUARIO_CREDENCIALES_INVALIDAS);
    }
  } catch (error) {
    console.error("Error en el login:", error);
  }
}

export function logout(event) {
  event.preventDefault()

  // Borrar el token
  sessionStorage.removeItem("access_token")
  sessionStorage.removeItem("access_token_estudiante")
  sessionStorage.removeItem("id_estudiante")
  window.location.href = "/login";
}

function validateLoginForm() {
  let email = document.getElementById('email').value;
  let password = document.getElementById('password').value;
  if (!email || !password) {
    return null;
  }
  return {
    email: email,
    password
  };
}

export async function validateToken() {
  console.log("validateToken")
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    // Redirige a /login si el token no existe
    window.location.href = "/login";
    return;
  }

  // Hacer una solicitud al servidor para verificar si el token es válido
  try {
    await makeRequest(
      URL_TOKEN_VALIDATE,  // baseUrl
      "GET",                   // method
      {},                      // params (query params)
      null,                    // body data
      { "Authorization": `Bearer ${token}` }, // headers
      null,                    // token
      {}                       // pathParams
    );
  } catch (error) {
    alert(TOKEN_PROBLEMA_VALIDANDO);
    window.location.href = "/login";  // Redirige en caso de error o token inválido
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => login(event));
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => logout(event));
  }
});