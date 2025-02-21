import {
  URL_MATERIA_SELECT_ALL, 
  URL_MATERIA_UPDATE, 
  URL_MATERIA_CREATE,
  URL_MATERIA_DELETE
} from "./urls.js";
import { makeRequest } from "./request.js";
import { MATERIA_INGRESAR_NOMBRE, INSERT_MESSAGE, UPDATE_MESSAGE, REGISTRO_ELIMINAR, DELETE_MESSAGE } from './messages.js';
import { showNotification } from './functions.js'

let materias = null;

async function onLoad() {
  putInfo()
}

async function putInfo() {
  // Obtener información de los materias
  materias = await makeRequest(URL_MATERIA_SELECT_ALL, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  // Obtener el tbody
  const table_body = document.getElementById("table-body")

  // Insertar los registros
  materias.data.forEach(materia => {
    table_body.innerHTML += `
      <tr>
        <td>${materia.id}</td>
        <td>${materia.nombre}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editarRegistro(${materia.id})">Modificar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarRegistro(${materia.id})">Eliminar</button>
        </td>
      </tr>
    `
  });
}

document.addEventListener("DOMContentLoaded", onLoad);

// Funciones del formulario y tabla
export async function crudRegistro(event) {
  event.preventDefault()
  const id = document.getElementById('registroId').value
  const nombre = document.getElementById('nombre').value
  if (!nombre) {
    showNotification("warning", MATERIA_INGRESAR_NOMBRE)
    return
  }
  if (id) {
    // Modificar
    await makeRequest(URL_MATERIA_UPDATE, 'PATCH', {}, {"nombre": nombre}, {'Content-Type': 'application/json'}, sessionStorage.getItem("access_token"), {"id": id});
    showNotification("success", UPDATE_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  } else {
    // Agregar
    await makeRequest(URL_MATERIA_CREATE, 'POST', {}, {"nombre": nombre}, {'Content-Type': 'application/json'}, sessionStorage.getItem("access_token"), {});
    showNotification("success", INSERT_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  }
}

export async function editarRegistro(id) {
  console.log("editarRegistro")
  materias.data.forEach(materia => {
    if (materia.id === id) {
      document.getElementById('registroId').value = id;
      document.getElementById('nombre').value = materia.nombre;
    }
  });
}

export async function eliminarRegistro(id) {
  const result = await window.confirmDeletion();
  if (result === 1) {
    await makeRequest(URL_MATERIA_DELETE, 'DELETE', {}, null, {}, sessionStorage.getItem("access_token"), {"id": id})
    showNotification("success", DELETE_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  }
}

export function limpiarFormulario() {
  console.log("limpiarFormulario")
  document.getElementById('registroForm').reset();
  document.getElementById('registroId').value = '';
}

// Asignar las funciones al ámbito global
window.crudRegistro = crudRegistro;
window.editarRegistro = editarRegistro;
window.eliminarRegistro = eliminarRegistro;
window.limpiarFormulario = limpiarFormulario;