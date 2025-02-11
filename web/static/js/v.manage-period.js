import {
  URL_PERIODO_SELECT_ALL, 
  URL_PERIODO_UPDATE, 
  URL_PERIODO_CREATE,
  URL_PERIODO_DELETE
} from "./urls.js";
import { makeRequest } from "./request.js";
import { PERIODO_INGRESAR_NOMBRE, INSERT_MESSAGE, UPDATE_MESSAGE, REGISTRO_ELIMINAR, DELETE_MESSAGE } from './messages.js';
import { showNotification } from './functions.js'

let periodos = null;

async function onLoad() {
  putInfo()
}

async function putInfo() {
  // Obtener información de los periodos
  periodos = await makeRequest(URL_PERIODO_SELECT_ALL, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  // Obtener el tbody
  const table_body = document.getElementById("table-body")

  // Insertar los registros
  periodos.data.forEach(periodo => {
    table_body.innerHTML += `
      <tr>
        <td>${periodo.id}</td>
        <td>${periodo.nombre}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editarRegistro(${periodo.id})">Modificar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarRegistro(${periodo.id})">Eliminar</button>
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
    showNotification("warning", PERIODO_INGRESAR_NOMBRE)
    return
  }
  if (id) {
    // Modificar
    await makeRequest(URL_PERIODO_UPDATE, 'PATCH', {}, {"nombre": nombre}, {'Content-Type': 'application/json'}, sessionStorage.getItem("access_token"), {"id": id});
    showNotification("success", UPDATE_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  } else {
    // Agregar
    await makeRequest(URL_PERIODO_CREATE, 'POST', {}, {"nombre": nombre}, {'Content-Type': 'application/json'}, sessionStorage.getItem("access_token"), {});
    showNotification("success", INSERT_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  }
}

export async function editarRegistro(id) {
  console.log("editarRegistro")
  periodos.data.forEach(periodo => {
    if (periodo.id === id) {
      document.getElementById('registroId').value = id;
      document.getElementById('nombre').value = periodo.nombre;
    }
  });
}

export async function eliminarRegistro(id) {
  console.log("eliminarRegistro")
  if (confirm(REGISTRO_ELIMINAR)) {
    await makeRequest(URL_PERIODO_DELETE, 'DELETE', {}, null, {}, sessionStorage.getItem("access_token"), {"id": id})
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