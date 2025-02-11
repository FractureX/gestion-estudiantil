import {
  URL_USUARIO_SELECT_INFO,
} from "./urls.js";
import { makeRequest } from "./request.js";
import { getSubjectsProgress } from './functions.js';

function getColor() {
  const colors = [
    "bg-light-blue",
    "bg-light-cyan",
    "bg-light-teal",
    "bg-light-sky",
    "bg-light-aqua",
    "bg-light-azure",
    "bg-light-steelblue",
    "bg-light-powderblue",
    "bg-light-royalblue",
    "bg-light-turquoise"
  ];
  let index = Math.floor((Math.random() * 10))
  if (index > 0 && index !== 10) {
    index = index - 1
  }
  return colors[index]
}

function getSubjectHTML(usuario, materia, id_materia_periodo) {
  return `
  <div class="col-md-6">
    <div class="card h-100 ${getColor()}">
      <div class="card-body">
        <h5 class="card-title text-secondary">
          ${materia.nombre}
        </h5>
        <p class="card-text">Progreso: ${materia.progreso}%</p>
        <div class="progress mb-3">
          <div class="progress-bar ${getColor()}" role="progressbar" style="width: ${materia.progreso}%"
            aria-valuenow="${materia.progreso}" aria-valuemin="0" aria-valuemax="100">
          </div>
        </div>

        ${usuario.data.rol.id === 2 ? `<div class="d-flex gap-2">
          <button class="btn btn-primary cargar-pdf" data-id-materia-periodo="${id_materia_periodo}">
            Cargar PDF
          </button>
        </div>` : ``}
      </div>
    </div>
  </div>
`;
}

async function onLoad() {
  // Obtener la información de usuario
  const usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  let userInfo = null
  if (sessionStorage.getItem("access_token_estudiante")) {
    userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token_estudiante"), {});
  } else {
    if (usuario.data.rol.id === 1) {
      return
    }
    userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  }

  // Información de las materias
  const progressData = await getSubjectsProgress(userInfo)
  const subjects = document.querySelector("#subjects")
  progressData.forEach(data => {
    subjects.innerHTML += getSubjectHTML(usuario, { "nombre": data.nombre_materia, "progreso": data.progreso.toFixed(2) }, data.id_materia_periodo);
  });

  // Añadir evento a los botones
  document.querySelectorAll(".cargar-pdf").forEach(button => {
    button.addEventListener("click", (event) => {
      const id_materia_periodo = event.target.getAttribute("data-id-materia-periodo");
      window.location.href = `/subjects-upload?id_materia_periodo=${id_materia_periodo}`;
    });
  });
}

document.addEventListener("DOMContentLoaded", onLoad);