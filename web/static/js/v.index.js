import {
  URL_USUARIO_SELECT_INFO,
  URL_EVALUACION_SELECT_BY_ID_USUARIO,
  URL_HISTORIAL_SELECT_BY_ID_USUARIO
} from "./urls.js";
import { makeRequest } from "./request.js";
import { getSubjectsProgress, getWeeksBetweenDates, fetchFileAndCreateURL, getPagesPerWeek } from './functions.js';

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

async function onLoad() {
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

  // Información de las evaluaciones
  await putEvaluationsInfo(usuario, userInfo)

  // Información de las actividades recientes
  await putRecentActivities(userInfo)

  // Añadir evento a los botones
  document.querySelectorAll(".cargar-pdf").forEach(button => {
    button.addEventListener("click", (event) => {
      const id_materia_periodo = event.target.getAttribute("data-id-materia-periodo");
      window.location.href = `/subjects-upload?id_materia_periodo=${id_materia_periodo}`;
    });
  });
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
        ${usuario.data.rol.id !== 1 ? `<div class="d-flex gap-2">
          <button class="btn btn-primary cargar-pdf" data-id-materia-periodo="${id_materia_periodo}">
            Cargar PDF
          </button>
        </div>` : ``}
      </div>
    </div>
  </div>
`;
}

async function getEvaluationHTML(userInfo, evaluacion, dayFormatted, monthFormatted, yearFormatted, hoursFormatted, minutesFormatted, ampm, iniciarEvaluacion, verDetalles) {

  const weeks = getWeeksBetweenDates(evaluacion.documento_pdf.fecha, evaluacion.fecha_evaluacion);
  const fileURL = await fetchFileAndCreateURL(evaluacion.documento_pdf.archivo);

  const pagesPerWeek = await getPagesPerWeek(fileURL, weeks);

  return `
    <div class="col-md-6">
      <div class="card h-100 ${getColor()}">
        <div class="card-body">
          <h5 class="card-title text-secondary">${evaluacion.documento_pdf.materia_periodo.materia.nombre} - ${evaluacion.titulo}</h5>
          <p class="card-text">
            <b>Fecha</b>: ${dayFormatted}/${monthFormatted}/${yearFormatted} ${hoursFormatted}:${minutesFormatted} ${ampm}<br>
            <b>Duración</b>: ${evaluacion.duracion}<br>
            <b>Páginas por semana</b>: ${pagesPerWeek}
          </p>
          ${userInfo.data.rol.id === 2 && iniciarEvaluacion ? `<a href="/evaluation?id_evaluation=${evaluacion.id}" class="btn btn-warning">Iniciar evaluación</a>` : ``}
          ${verDetalles ? `<a href="/evaluation-details?id_evaluation=${evaluacion.id}" class="btn btn-primary">Ver detalles</a>` : ``}
        </div>
      </div>
    </div>
  `;
}

async function putEvaluationsInfo(usuario, userInfo) {
  const evaluaciones = await makeRequest(URL_EVALUACION_SELECT_BY_ID_USUARIO, 'GET', { "usuario": userInfo.data.id }, null, {}, sessionStorage.getItem("access_token"), {});
  const div_evaluaciones = document.querySelector("#evaluations");
  let innerHtml = ``;

  for (const evaluacion of evaluaciones.data) {
    const fechaEvaluacion = evaluacion.fecha_evaluacion.split('T');
    const fecha = fechaEvaluacion[0];
    const hora = fechaEvaluacion[1].replace('Z', '');

    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes, seconds] = hora.split(':').map(Number);

    const fechaLocal = new Date(year, month - 1, day, hours, minutes, seconds);
    const dayFormatted = String(fechaLocal.getDate()).padStart(2, '0');
    const monthFormatted = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const yearFormatted = fechaLocal.getFullYear();
    let hoursFormatted = fechaLocal.getHours();
    const minutesFormatted = String(fechaLocal.getMinutes()).padStart(2, '0');
    const ampm = hoursFormatted >= 12 ? 'PM' : 'AM';
    hoursFormatted = hoursFormatted % 12 || 12;

    const [horasDuracion, minutosDuracion, segundosDuracion] = evaluacion.duracion.split(":").map(Number);
    const duracionMilisegundos = (horasDuracion * 60 * 60 + minutosDuracion * 60 + segundosDuracion) * 1000;
    const fechaConDuracion = new Date(fechaLocal.getTime() + duracionMilisegundos);

    const fechaActual = new Date();
    let iniciarEvaluacion = fechaActual > fechaLocal && fechaActual <= fechaConDuracion;
    let verDetalles = fechaActual > fechaConDuracion;

    if (fechaActual < fechaConDuracion) {
      innerHtml += await getEvaluationHTML(usuario, evaluacion, dayFormatted, monthFormatted, yearFormatted, hoursFormatted, minutesFormatted, ampm, iniciarEvaluacion, verDetalles);
    }
  }
  div_evaluaciones.innerHTML = innerHtml;
}

async function putRecentActivities(userInfo) {
  const recentActivities = await makeRequest(URL_HISTORIAL_SELECT_BY_ID_USUARIO, 'GET', { "usuario": userInfo.data.id }, null, {}, sessionStorage.getItem("access_token"), {});
  const div_containerRecentActivities = document.querySelector("#containerRecentActivities");
  const div_recentActivities = document.querySelector("#recentActivities");

  if (recentActivities.data.length === 0) {
    return
  }
  div_containerRecentActivities.style.opacity = 1;

  let innerHtml = ``

  recentActivities.data.forEach(recentActivity => {
    // Crear un objeto Date a partir del string ISO
    const date = new Date(recentActivity.fecha);

    // Obtener las partes de la fecha en UTC
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Los meses van de 0 a 11
    const year = date.getUTCFullYear();

    // Obtener las partes de la hora en UTC
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Convertir a formato 12 horas y determinar AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convertir 0 a 12 para medianoche

    // Formatear la cadena de salida
    innerHtml += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${recentActivity.descripcion}</span>
        <small class="text-muted">${day}/${month}/${year} ${hours}:${minutes} ${ampm}</small>
      </li>
    `
  });

  div_recentActivities.innerHTML = innerHtml
}

document.addEventListener("DOMContentLoaded", onLoad);