import {
  URL_USUARIO_SELECT_INFO,
  URL_EVALUACION_SELECT_BY_ID_USUARIO,
} from "./urls.js";
import { makeRequest } from "./request.js";
import { getPagesPerWeek, getWeeksBetweenDates, fetchFileAndCreateURL } from "./functions.js";

async function onLoad() {
  // Obtener información de usuario
  const usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  let evaluaciones = null

  if (sessionStorage.getItem("access_token_estudiante")) {
    const estudiante_access_token = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token_estudiante"), {});
    evaluaciones = await makeRequest(URL_EVALUACION_SELECT_BY_ID_USUARIO, 'GET', { "usuario": estudiante_access_token.data.id }, null, {}, sessionStorage.getItem("access_token_estudiante"), {});
  } else {
    if (usuario.data.rol.id === 1) {
      return
    }
    const estudiante_access_token = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
    evaluaciones = await makeRequest(URL_EVALUACION_SELECT_BY_ID_USUARIO, 'GET', { "usuario": estudiante_access_token.data.id }, null, {}, sessionStorage.getItem("access_token"), {});
  }

  // Contenedor de las evaluaciones
  const div_evaluaciones = document.querySelector("#evaluations");
  let innerHtml = ``
  evaluaciones.data.forEach(evaluacion => {
    
    // Extraer la fecha y la hora de la cadena ISO (sin la T y Z)
    const fechaEvaluacion = evaluacion.fecha_evaluacion.split('T');
    const fecha = fechaEvaluacion[0]; // '2024-11-18'
    const hora = fechaEvaluacion[1].replace('Z', ''); // '20:30:00' (sin 'Z')

    // Extraer componentes de la fecha
    const [year, month, day] = fecha.split('-').map(Number); // '2024', '11', '18'

    // Extraer componentes de la hora
    const [hours, minutes, seconds] = hora.split(':').map(Number); // '20', '30', '00'

    // Crear un nuevo objeto Date utilizando los componentes de la fecha y la hora
    const fechaLocal = new Date(year, month - 1, day, hours, minutes, seconds);

    // Obtener los componentes de la fecha y hora en la zona horaria local
    const dayFormatted = String(fechaLocal.getDate()).padStart(2, '0');
    const monthFormatted = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const yearFormatted = fechaLocal.getFullYear();
    let hoursFormatted = fechaLocal.getHours();
    const minutesFormatted = String(fechaLocal.getMinutes()).padStart(2, '0');
    const ampm = hoursFormatted >= 12 ? 'PM' : 'AM';
    hoursFormatted = hoursFormatted % 12 || 12; // Convertir a formato de 12 horas

    // Convertir la duración de "01:00:00" (HH:MM:SS) a milisegundos
    // const duracion = evaluacion.duracion; // "01:00:00"
    // const [horasDuracion, minutosDuracion, segundosDuracion] = duracion.split(":").map(Number);
    // const duracionMilisegundos = (horasDuracion * 60 * 60 + minutosDuracion * 60 + segundosDuracion) * 1000;

    // Crear la fecha con duración sumada
    // const fechaConDuracion = new Date(fechaLocal.getTime() + duracionMilisegundos);

    // Obtener la fecha actual
    // const fechaActual = new Date();

    // Comparar la fecha actual con la fecha original y la fecha con duración
    // let iniciarEvaluacion = false;
    // let verDetalles = false;
    let iniciarEvaluacion = true;
    let verDetalles = true;

    // Condiciones para verificar si se puede iniciar la evaluación o ver detalles
    // if (fechaActual > fechaLocal && fechaActual <= fechaConDuracion && evaluacion.duracion !== "00:00:00") {
    //   iniciarEvaluacion = true;
    // } else if (fechaActual > fechaConDuracion) {
    //   verDetalles = true;
    // }

    // Obtener la información para tener las páginas por semana
    const weeks = getWeeksBetweenDates(evaluacion.documento_pdf.fecha, evaluacion.fecha_evaluacion)
    fetchFileAndCreateURL(evaluacion.documento_pdf.archivo).then(fileURL => {
      getPagesPerWeek(fileURL, weeks).then(pagesPerWeek => {
        // Generar el HTML con la condición de "Iniciar evaluación" o "Ver detalles"
        innerHtml += `
          <div class="card mb-3 bg-light">
            <div class="card-body">
              <h5 class="card-title">${evaluacion.documento_pdf.materia_periodo.materia.nombre} - ${evaluacion.titulo}</h5>
              <p class="card-text">
                <b>Fecha</b>: ${dayFormatted}/${monthFormatted}/${yearFormatted} ${hoursFormatted}:${minutesFormatted} ${ampm}<br>
                ${evaluacion.duracion !== "00:00:00" ? `<b>Duración</b>: ${evaluacion.duracion}` : ''}<br>
                <b>Páginas por semana</b>: ${pagesPerWeek}
              </p>
              ${usuario.data.rol.id === 2 && iniciarEvaluacion ? `<a href="/evaluation?id_evaluation=${evaluacion.id}" class="btn btn-warning">Iniciar evaluación</a>` : ``}
              ${verDetalles ? `<a href="/evaluation-details?id_evaluation=${evaluacion.id}" class="btn btn-primary">Ver detalles</a>` : ``}
            </div>
          </div>
        `;
        div_evaluaciones.innerHTML = innerHtml
      })
    });
  });
}

document.addEventListener("DOMContentLoaded", onLoad);