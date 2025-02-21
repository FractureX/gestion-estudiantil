import {
  URL_MATERIA_PERIODO_SELECT_ALL,
  URL_MATERIA_PERIODO_UPDATE,
  URL_MATERIA_PERIODO_CREATE,
  URL_MATERIA_PERIODO_DELETE,
  URL_PERIODO_SELECT_ALL,
  URL_MATERIA_SELECT_ALL,
  URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO_ID_MATERIA
} from "./urls.js";
import { makeRequest } from "./request.js";
import { INSERT_MESSAGE, UPDATE_MESSAGE, REGISTRO_ELIMINAR, MATERIA_PERIODO_EXISTENTE, DELETE_MESSAGE } from './messages.js';
import { showNotification } from './functions.js'

let materias_periodo = null;

async function onLoad() {
  putInfo()
}

async function putInfo() {
  // Obtener información de los periodos
  const periodos = await makeRequest(URL_PERIODO_SELECT_ALL, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));
  periodos.data.forEach(periodo => {
    document.getElementById("periodo").innerHTML += `<option value=${periodo.id}>${periodo.nombre}</option>`
  });

  // Obtener información de las materias
  const materias = await makeRequest(URL_MATERIA_SELECT_ALL, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));
  materias.data.forEach(materia => {
    document.getElementById("materia").innerHTML += `<option value=${materia.id}>${materia.nombre}</option>`
  });

  // Obtener información de las materias por periodo
  materias_periodo = await makeRequest(URL_MATERIA_PERIODO_SELECT_ALL, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  // Obtener el tbody
  const table_body = document.getElementById("table-body")

  // Insertar los registros
  materias_periodo.data.forEach(materia_periodo => {
    table_body.innerHTML += `
      <tr>
        <td>${materia_periodo.id}</td>
        <td>${materia_periodo.periodo.nombre}</td>
        <td>${materia_periodo.materia.nombre}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editarRegistro(${materia_periodo.id})">Modificar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarRegistro(${materia_periodo.id})">Eliminar</button>
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
  const materia = Number(document.getElementById('materia').value)
  const periodo = Number(document.getElementById('periodo').value)
  if (id) {
    // Modificar
    await makeRequest(URL_MATERIA_PERIODO_UPDATE, 'PATCH', {}, { "materia": materia, "periodo": periodo }, { 'Content-Type': 'application/json' }, sessionStorage.getItem("access_token"), { "id": id })
    showNotification("success", UPDATE_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  } else {
    // Agregar
    const registro = await makeRequest(
      URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO_ID_MATERIA,
      'GET',
      { "periodo": periodo, "materia": materia },
      {},
      { 'Content-Type': 'application/json' },
      sessionStorage.getItem("access_token"),
      {}
    );
    if (registro.data.length > 0) {
      showNotification("error", MATERIA_PERIODO_EXISTENTE)
      return;
    }
    await makeRequest(URL_MATERIA_PERIODO_CREATE, 'POST', {}, { "materia": materia, "periodo": periodo }, { 'Content-Type': 'application/json' }, sessionStorage.getItem("access_token"), {})
    showNotification("success", INSERT_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  }
}

export async function editarRegistro(id) {
  materias_periodo.data.forEach(materia_periodo => {
    if (materia_periodo.id === id) {
      document.getElementById('registroId').value = id;
      document.getElementById('periodo').value = materia_periodo.periodo.id;
      document.getElementById('materia').value = materia_periodo.materia.id;
    }
  });
}

export async function eliminarRegistro(id) {
  const result = await window.confirmDeletion();
  if (result === 1) {
    await makeRequest(URL_MATERIA_PERIODO_DELETE, 'DELETE', {}, null, {}, sessionStorage.getItem("access_token"), { "id": id })
    showNotification("success", DELETE_MESSAGE)
    setTimeout(() => {
      window.location.reload()
    }, 3000);
  }
}

export function limpiarFormulario() {
  document.getElementById('registroForm').reset();
  document.getElementById('registroId').value = '';
}

// Asignar las funciones al ámbito global
window.crudRegistro = crudRegistro;
window.editarRegistro = editarRegistro;
window.eliminarRegistro = eliminarRegistro;
window.limpiarFormulario = limpiarFormulario;