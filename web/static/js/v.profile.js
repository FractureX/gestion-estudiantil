import {
  URL_USUARIO_SELECT_INFO,
  URL_USUARIO_UPDATE,
  URL_ROL_SELECT,
} from "./urls.js";
import { makeRequest } from "./request.js";
import { UPDATE_MESSAGE } from './messages.js';
import { getSubjectsProgress } from './functions.js'

let usuario = null;
let userInfo = null;
let rolesInfo = null;
let subjectsProgress = null;

async function onLoad() {
  // Obtener la información de usuario
  usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  if (sessionStorage.getItem("access_token_estudiante")) {
    userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token_estudiante"), {});
  } else {
    userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  }
  console.log(userInfo)

  // Obtener el progreso de las materias
  subjectsProgress = await getSubjectsProgress(userInfo);

  // Obtener información de los roles
  rolesInfo = await makeRequest(URL_ROL_SELECT, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  putInfo()

  // Añadir evento
  document.getElementById("editar").addEventListener("click", (event) => { handleEdit() })
}

async function handleEdit() {
  const inputNombre = document.getElementById("inputnombre")
  const inputApellido = document.getElementById("inputapellido")
  const inputPassword = document.getElementById("inputpassword")
  const rolselect = document.getElementById("rolselect")
  const editBtn = document.getElementById("editar")
  if (editBtn.textContent === "Editar Perfil") {
    // Se va a editar
    editBtn.textContent = "Guardar";
    inputNombre.textContent = ""
    inputApellido.textContent = ""
    inputPassword.value = ""
    inputNombre.style.display = "inline"
    inputApellido.style.display = "inline"
    inputPassword.style.display = "inline"
    rolselect.style.display = usuario.data.rol.id === 1 && userInfo.data.id !== usuario.data.id? "inline" : "none"
  } else {
    // Se va a guardar
    editBtn.textContent = "Editar Perfil";
    inputNombre.style.display = "none"
    inputApellido.style.display = "none"
    inputPassword.style.display = "none"
    rolselect.style.display = "none"
    const nombres = inputNombre.value
    const apellidos = inputApellido.value
    const data = {
      "nombres": nombres === "" ? userInfo.data.nombres : nombres,
      "apellidos": apellidos === "" ? userInfo.data.apellidos : apellidos,
      "rol": rolselect.value
    }
    console.log(`inputPassword.value: ${inputPassword.value}`)
    if (inputPassword.value !== "") {
      data['password'] = inputPassword.value
    }

    console.table(data)

    // Guardar
    await makeRequest(URL_USUARIO_UPDATE, 'PATCH', {}, data, { 'Content-Type': 'application/json' }, sessionStorage.getItem("access_token"), { "id": userInfo.data.id });
    alert(UPDATE_MESSAGE);
    window.location.reload();
  }
}

function getSubjectHtml(data) {
  return `
    <div class="mb-3">
      <div class="d-flex justify-content-between mb-1">
        <span>${data.nombre_materia}</span>
        <span>${data.progreso}%</span>
      </div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" style="width: ${data.progreso}%"
          aria-valuenow="${data.progreso}" aria-valuemin="0" aria-valuemax="100">
        </div>
      </div>
    </div>
  `
}

function putInfo() {
  // Información básica
  document.getElementById("role").innerHTML = `${userInfo.data.rol.nombre}`
  document.getElementById("inicial").innerHTML = `${userInfo.data.nombres[0]}${userInfo.data.apellidos[0]}`
  document.getElementById("nombre").textContent = `${userInfo.data.nombres} ${userInfo.data.apellidos}`
  document.getElementById("periodo").textContent = `${userInfo.data.periodo.nombre}`
  document.getElementById("email").textContent = `${userInfo.data.email}`

  // Información de los roles
  rolesInfo.data.forEach(rol => {
    let optionElement = document.createElement("option");
    optionElement.selected = true
    optionElement.value = rol.id;
    optionElement.textContent = rol.nombre;
    document.getElementById("rolselect").appendChild(optionElement);
  });
  document.getElementById("rolselect").value = userInfo.data.rol.id

  let presentados = 0
  let no_presentados = 0
  subjectsProgress.forEach(data => {
    presentados += data.presentados
    no_presentados += data.no_presentados

    document.getElementById("progreso").innerHTML += getSubjectHtml(data)
  });
  document.getElementById("evaluaciones-completadas").textContent = `${presentados}`
  document.getElementById("temas-dominados").textContent = `${presentados} / ${presentados + no_presentados}`
}

document.addEventListener("DOMContentLoaded", onLoad);