import {
  URL_USUARIO_SELECT_INFO,
  URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO,
  URL_PREGUNTA_SELECT_BY_ID_USUARIO,
  URL_EVALUACION_SELECT_BY_ID_USUARIO
} from "./urls.js";
import { makeRequest } from "./request.js";
import { getLast4Weeks, filterData, getRandomColor, filterPreguntasGeneradas, filterEvaluacionesRealizadas, filterPromedioRespuestasCorrectas } from './functions.js'

let userInfo = null;
let materialesCargados = null;
let preguntasGeneradas = null;
let evaluacionesRealizadas = null;
let promedioRespuestasCorrectas = null;
let analisisPreguntasFallidas = null;
let temasMayorDificultad = null;
let evolucionCalificacionesPorEvaluacion = null;
let temasMasFallados = null;

async function onLoad() {
  const usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  userInfo = null
  if (sessionStorage.getItem("access_token_estudiante")) {
    userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token_estudiante"), {});
  } else {
    if (usuario.data.rol.id === 1) {
      return
    }
    userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  }

  await loadInfo()
  putInfo()
}

async function loadInfo() {
  // Materiales cargados
  materialesCargados = await makeRequest(URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`materialesCargados:`, materialesCargados.data)

  // Preguntas generadas
  preguntasGeneradas = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`preguntasGeneradas:`, preguntasGeneradas.data)

  // Evaluaciones realizadas
  evaluacionesRealizadas = await makeRequest(URL_EVALUACION_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`evaluacionesRealizadas:`, evaluacionesRealizadas.data)

  // Promedio respuestas correctas
  promedioRespuestasCorrectas = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`promedioRespuestasCorrectas:`, promedioRespuestasCorrectas.data)

  // Análisis de preguntas fallidas (Promedio respuestas incorrectas)
  analisisPreguntasFallidas = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`analisisPreguntasFallidas:`, analisisPreguntasFallidas.data)

  // Temas con mayor dificultad (Evaluar las respuestas incorrectas en comparación a las correctas)
  temasMayorDificultad = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`temasMayorDificultad:`, temasMayorDificultad.data)

  // Evolución de las calificaciones por evaluación
  evolucionCalificacionesPorEvaluacion = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`evolucionCalificacionesPorEvaluacion:`, evolucionCalificacionesPorEvaluacion.data)

  // Temas más fallados con su porcentaje
  temasMasFallados = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`temasMasFallados:`, temasMasFallados.data)
}

function putInfo() {
  createChartAndTable('GraficoMaterialesCargados', 'Documentos PDF cargados por materia', materialesCargados.data, 'contenedorTablaMateriales');
  createChartAndTable('GraficoPreguntasGeneradas', 'Cantidad de preguntas generadas por materia', preguntasGeneradas.data, 'contenedorTablaPreguntas');
  createChartAndTable('GraficoEvaluacionesRealizadas', 'Evaluaciones realizadas', evaluacionesRealizadas.data, 'contenedorEvaluacionesRealizadas');
  createChartAndTable('GraficoPromedioRespuestasCorrectas', 'Promedio de respuestas correctas', promedioRespuestasCorrectas.data, 'contenedorPromedioRespuestasCorrectas');
}

function createChartAndTable(canvasId, title, data, containerTablaId) {
  // Crear gráfico
  const labels = getLast4Weeks();
  const { datasetsArray, tableData } = getChartData(data, labels, canvasId);

  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasetsArray
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, stacked: true },
        x: { stacked: true }
      },
      plugins: {
        title: { display: true, text: title, font: { size: 16 } }
      }
    }
  });

  // Crear tabla
  const table = document.createElement('table');
  table.classList.add('table');

  const headerRow = table.insertRow();
  let headers = []
  if (canvasId === "GraficoMaterialesCargados" || canvasId === "GraficoMaterialesCargados" || canvasId === "GraficoMaterialesCargados") {
    headers = ['Color', 'Materia', 'Total'];
  } else if (canvasId === "GraficoMaterialesCargados") {
    headers = ['Color', 'Materia', 'Total'];
  }
  headers.forEach(headerText => {
    const headerCell = document.createElement('th');
    headerCell.textContent = headerText;
    headerRow.appendChild(headerCell);
  });

  tableData.forEach(item => {
    const row = table.insertRow();

    const colorCell = row.insertCell();
    const colorDiv = document.createElement('div');
    colorDiv.style.backgroundColor = datasetsArray.find(dataset => dataset.label === item.materia)?.backgroundColor || '#FFFFFF'; // Manejar casos sin color
    colorDiv.style.width = '20px';
    colorDiv.style.height = '20px';
    colorCell.appendChild(colorDiv);

    const materiaCell = row.insertCell();
    materiaCell.textContent = item.materia;

    const totalCell = row.insertCell();
    const total = item.datos_por_semana.reduce((sum, count) => sum + count, 0);
    totalCell.textContent = total;
  });

  const contenedorTabla = document.getElementById(containerTablaId);
  contenedorTabla.appendChild(table);
}

function getChartData(data, labels, canvasId) {
  if (data.length === 0) {
    return { datasetsArray: [], tableData: [] };
  }

  if (canvasId === 'GraficoMaterialesCargados') {
    return filterData(data, labels);
  } else if (canvasId === 'GraficoPreguntasGeneradas') {
    return filterPreguntasGeneradas(data, labels);
  } else if (canvasId === 'GraficoEvaluacionesRealizadas') {
    return filterEvaluacionesRealizadas(data, labels);
  } else if (canvasId === 'GraficoPromedioRespuestasCorrectas') {
    return filterPromedioRespuestasCorrectas(data, labels);
}

  return { datasetsArray: [], tableData: [] }; // Valor por defecto si no coincide ningún caso
}

document.addEventListener("DOMContentLoaded", onLoad);