import {
  URL_USUARIO_SELECT_INFO,
  URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO,
  URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO,
  URL_EVALUACION_SELECT_BY_ID_DOCUMENTO_PDF,
  URL_EVALUACION_SELECT_BY_ID_USUARIO,
  URL_PREGUNTA_SELECT_BY_ID_EVALUACION
} from "./urls.js";
import { makeRequest } from "./request.js";
import { getSubjectsProgress } from './functions.js';

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
    subjects.innerHTML += getSubjectProgressHTML({nombre: data.nombre_materia, progreso: data.progreso.toFixed(2)});
  });

  // Información de las estadísticas
  putStatistics(userInfo);

  // Información del rendimiento
  putPerformance(userInfo);
}

function getSubjectProgressHTML(subject) {
  return `
    <div class="d-flex justify-content-between">
      <span>${subject.nombre}</span>
      <span>${subject.progreso}%</span>
    </div>
    <div class="progress">
      <div class="progress-bar" role="progressbar" style="width: ${subject.progreso}%;"
        aria-valuenow="${subject.progreso}" aria-valuemin="0" aria-valuemax="100"></div>
    </div>
  `
}

async function putStatistics(userInfo) {

  // Obtener los componentes que reflejarán la información
  const divCompletedEvaluations = document.querySelector("#completedEvaluations")
  const divAverage = document.querySelector("#average")

  // Variables
  let conteoDivCompletedEvaluations = 0
  let promedioDivAverage = 0

  // Obtener las evaluaciones
  const evaluaciones = await makeRequest(URL_EVALUACION_SELECT_BY_ID_USUARIO, 'GET', { usuario: userInfo.data.id }, null, {}, sessionStorage.getItem("access_token"))

  // divCompletedEvaluations
  // Validar si las evaluaciones están en 00:00:00
  evaluaciones.data.forEach(evaluacion => {
    if (evaluacion.duracion === "00:00:00") {
      conteoDivCompletedEvaluations++
    }
  });
  divCompletedEvaluations.textContent = conteoDivCompletedEvaluations;

  // divAverage
  // Validar el puntaje de cada respuesta en cada evaluación
  for (const evaluacion of evaluaciones.data) {
    const respuestas = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_EVALUACION, 'GET', { evaluacion: evaluacion.id }, null, {}, sessionStorage.getItem("access_token"));
    let totalEvaluacion = 0;
    respuestas.data.forEach(respuesta => {
      totalEvaluacion += respuesta.puntaje;
    });
    totalEvaluacion /= respuestas.data.length;
    promedioDivAverage += totalEvaluacion;
  }
  promedioDivAverage = (promedioDivAverage / evaluaciones.data.length) * 10
  divAverage.textContent = promedioDivAverage.toFixed(2);

}

function generateWeeklyLabels(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels = [];
  let current = new Date(start);

  let weekCount = 1;
  while (current <= end) {
    labels.push(`Semana ${weekCount}`);
    current.setDate(current.getDate() + 7); // Avanzar 7 días
    weekCount++;
  }

  return labels;
}

async function putPerformance(userInfo) {
  // Obtener las evaluaciones
  const evaluaciones = await makeRequest(URL_EVALUACION_SELECT_BY_ID_USUARIO, 'GET', { usuario: userInfo.data.id }, null, {}, sessionStorage.getItem("access_token"));

  // Calcular los promedios de cada evaluación
  const evaluacionesConPromedio = [];
  for (const evaluacion of evaluaciones.data) {
    const respuestas = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_EVALUACION, 'GET', { evaluacion: evaluacion.id }, null, {}, sessionStorage.getItem("access_token"));
    let totalEvaluacion = 0;
    respuestas.data.forEach(respuesta => {
      totalEvaluacion += respuesta.puntaje;
    });
    const promedio = totalEvaluacion / respuestas.data.length;
    evaluacionesConPromedio.push({
      fecha: new Date(evaluacion.fecha_evaluacion),
      promedio: promedio
    });
  }

  // Determinar rango de fechas
  let startDate = null;
  let endDate = null;
  evaluacionesConPromedio.forEach(evaluacion => {
    const date = evaluacion.fecha;
    if (startDate === null && endDate === null) {
      startDate = date;
      endDate = date;
    } else {
      if (date < startDate) {
        startDate = date;
      }
      if (date > endDate) {
        endDate = date;
      }
    }
  });

  // Generar etiquetas de semanas
  const labels = generateWeeklyLabels(startDate, endDate);

  // Agrupar evaluaciones por semana
  const weekData = {};
  labels.forEach((label) => {
    weekData[label] = { sum: 0, count: 0 }; // Inicializar datos
  });

  evaluacionesConPromedio.forEach(evaluacion => {
    const weekIndex = Math.floor((evaluacion.fecha - startDate) / (7 * 24 * 60 * 60 * 1000));
    const weekLabel = labels[weekIndex];
    if (weekData[weekLabel]) {
      weekData[weekLabel].sum += evaluacion.promedio;
      weekData[weekLabel].count++;
    }
  });

  // Calcular el promedio semanal
  console.table(weekData)
  console.table(labels)
  const data = labels.map(label => {
    const week = weekData[label];
    if (week.count > 0) {
      return week.sum / week.count; // Promedio de la semana
    } else {
      return 0; // No hubo evaluaciones en esta semana
    }
  });

  

  // Crear el gráfico
  const ctx = document.getElementById('rendimientoChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rendimiento',
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", onLoad);