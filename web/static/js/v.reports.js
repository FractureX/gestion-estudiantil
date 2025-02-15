import {
  URL_USUARIO_SELECT_INFO,
  URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO,
  URL_PREGUNTA_SELECT_BY_ID_USUARIO,
  URL_EVALUACION_SELECT_BY_ID_USUARIO, 
  URL_REPORTE_PDF
} from "./urls.js";
import { makeRequest } from "./request.js";
import { getLast4Weeks, filterData, filterPreguntasGeneradas, filterEvaluacionesRealizadas, filterAnalisisRespuestas, filterTemasMayorDificultad, filterEvolucionCalificaciones, saveDivsAsImages } from './functions.js'
// import { Chart } from './chart.js'
// import {} from './html2canvas.js'

let userInfo = null;
let materialesCargados = null;
let preguntasGeneradas = null;
let evaluacionesRealizadas = null;
let promedioRespuestasCorrectas = null;
let analisisPreguntasFallidas = null;
let temasMayorDificultad = null;
let evolucionCalificaciones = null;
let temasMasFallados = null;

let materialesCargadosDatasetsArray = null
let materialesCargadosTableData = null
let preguntasGeneradasDatasetsArray = null
let preguntasGeneradasTableData = null
let evaluacionesRealizadasDatasetsArray = null
let evaluacionesRealizadasTableData = null

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

  // Acción para el botón de descargar PDF
  console.log("Antes de la acción")
  document.getElementById("btn-download-pdf").addEventListener("click", (_) => handleDownloadPdf())
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
  evolucionCalificaciones = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`evolucionCalificacionesPorEvaluacion:`, evolucionCalificaciones.data)

  // Temas más fallados con su porcentaje
  temasMasFallados = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_USUARIO, 'GET', {
    'usuario': userInfo.data.id
  }, null, {}, sessionStorage.getItem("access_token"));
  console.log(`temasMasFallados:`, temasMasFallados.data)
}

function putInfo() {
  createChartAndTable('GraficoMaterialesCargados', 'Documentos PDF cargados por materia', materialesCargados.data, 'contenedorTablaMaterialesCargados');
  createChartAndTable('GraficoPreguntasGeneradas', 'Cantidad de preguntas generadas por materia', preguntasGeneradas.data, 'contenedorTablaPreguntas');
  createChartAndTable('GraficoEvaluacionesRealizadas', 'Evaluaciones realizadas', evaluacionesRealizadas.data, 'contenedorEvaluacionesRealizadas');
  createChartAndTable('GraficoAnalisisPreguntas', 'Análisis de preguntas respondidas', promedioRespuestasCorrectas.data, 'contenedorAnalisisPreguntas');
  createChartAndTable('GraficoTemasMayorDificultad', 'Porcentaje de temas con mayor dificultad', temasMayorDificultad.data, 'contenedorTemasMayorDificultad');
  createChartAndTable('GraficoEvolucionCalificaciones', 'Evolución del promedio de las calificaciones por evaluación', evolucionCalificaciones.data, 'contenedorEvolucionCalificaciones');
}

function createChartAndTable(canvasId, title, data, containerTablaId) {
  // Crear gráfico
  let labels = null;
  if (canvasId !== "GraficoTemasMayorDificultad") {
    labels = getLast4Weeks();
  }
  const { datasetsArray, tableData, labels: extractedLabels } = getChartData(data, labels, canvasId); // Get labels here

  // Información para los reportes
  if (canvasId === "GraficoMaterialesCargados") {
    materialesCargadosDatasetsArray = datasetsArray
    materialesCargadosTableData = tableData
  } else if (canvasId === "GraficoPreguntasGeneradas") {
    preguntasGeneradasDatasetsArray = datasetsArray
    preguntasGeneradasTableData = tableData
  } else if (canvasId === "GraficoEvaluacionesRealizadas") {
    evaluacionesRealizadasDatasetsArray = datasetsArray
    evaluacionesRealizadasTableData = tableData
  }

  if (canvasId === "GraficoTemasMayorDificultad") {
    labels = extractedLabels; // Use the extracted labels
  }
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: canvasId === "GraficoEvolucionCalificaciones" ? 'line' : 'bar',
    data: {
      labels: labels,
      datasets: datasetsArray
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest', // Para que interactúe con el punto más cercano a la línea
        intersect: false // Para que no solo interactúe si el mouse está exactamente sobre el punto
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: false,
          max: canvasId === "GraficoTemasMayorDificultad" ? 100 : undefined,
          ticks: {
            stepSize: canvasId === "GraficoTemasMayorDificultad" ? 10 : undefined,
          }
        },
        x: {
          stacked: false
        }
      },
      plugins: {
        title: { display: true, text: title, font: { size: 16 } },
        legend: { display: canvasId === "GraficoTemasMayorDificultad" ? false : true },
        tooltip: {
          mode: 'nearest', // Para que la tooltip se muestre con el punto más cercano a la línea
          intersect: false // Para que la tooltip se muestre incluso si el mouse no está exactamente sobre el punto
        }
      }
    }
  });

  // Crear tabla
  const table = document.createElement('table');
  table.classList.add('table');

  const headerRow = table.insertRow();
  let headers = []
  if (canvasId === "GraficoMaterialesCargados" || canvasId === "GraficoPreguntasGeneradas" || canvasId === "GraficoEvaluacionesRealizadas" || canvasId === "GraficoTemasMayorDificultad") {
    headers = ['Color', 'Materia', 'Total'];
  } else if (canvasId === "GraficoAnalisisPreguntas") {
    headers = ['Color', 'Materia', 'Preguntas', 'Correctas', 'Incorrectas'];
  } else if (canvasId === "GraficoEvolucionCalificaciones") {
    headers = ['Color', 'Materia', 'Promedio general (últimas 4 semanas)'];
  }
  headers.forEach(headerText => {
    const headerCell = document.createElement('th');
    headerCell.textContent = headerText;
    headerRow.appendChild(headerCell);
  });

  tableData.forEach((item, index) => {
    const row = table.insertRow();

    const colorCell = row.insertCell();
    const colorDiv = document.createElement('div');
    if (canvasId !== "GraficoTemasMayorDificultad") {
      colorDiv.style.backgroundColor = datasetsArray.find(dataset => dataset.label === item.materia)?.backgroundColor || '#FFFFFF';
    } else {
      colorDiv.style.backgroundColor = datasetsArray[0].backgroundColor[index] || '#FFFFFF';
    }

    colorDiv.style.width = '20px';
    colorDiv.style.height = '20px';
    colorCell.appendChild(colorDiv);

    if (canvasId === "GraficoMaterialesCargados" || canvasId === "GraficoPreguntasGeneradas" || canvasId === "GraficoEvaluacionesRealizadas" || canvasId === "GraficoTemasMayorDificultad" || canvasId === "GraficoEvolucionCalificaciones") {
      const materiaCell = row.insertCell();
      materiaCell.textContent = item.materia;

      const totalCell = row.insertCell();
      let total = null
      if (canvasId !== "GraficoTemasMayorDificultad" && canvasId !== "GraficoEvolucionCalificaciones") {
        total = item.datos_por_semana.reduce((sum, count) => sum + count, 0);
      } else if (canvasId === "GraficoEvolucionCalificaciones") {
        item.datos_por_semana.forEach(data => {
          total += data
        });
        total = (total / item.datos_por_semana.length).toFixed(2)
      } else {
        total = item.porcentajeIncorrectas
      }
      totalCell.textContent = total;
    } else if (canvasId === "GraficoAnalisisPreguntas") {
      const materiaCell = row.insertCell();
      materiaCell.textContent = item.materia;

      const preguntasCell = row.insertCell();
      const preguntas = item.preguntas
      preguntasCell.textContent = preguntas;

      const correctasCell = row.insertCell();
      const correctas = item.correctas
      correctasCell.textContent = correctas;

      const incorrectasCell = row.insertCell();
      const incorrectas = item.incorrectas
      incorrectasCell.textContent = incorrectas;
    }
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
  } else if (canvasId === 'GraficoAnalisisPreguntas') {
    return filterAnalisisRespuestas(data, labels);
  } else if (canvasId === 'GraficoTemasMayorDificultad') {
    return filterTemasMayorDificultad(data);
  } else if (canvasId === 'GraficoEvolucionCalificaciones') {
    return filterEvolucionCalificaciones(data, labels);
  }

  return { datasetsArray: [], tableData: [] }; // Valor por defecto si no coincide ningún caso
}

function handleDownloadPdf() {
  const divIds = [
    "divMaterialesCargados",
    "divPreguntasGeneradas",
    "divEvaluacionesRealizadas",
    "divAnalisisPreguntas",
    "divTemasMayorDificultad",
    "divEvolucionCalificaciones"
  ];
  const fileNames = [
    "GRAFICOUNO",
    "GRAFICODOS",
    "GRAFICOTRES",
    "GRAFICOCUATRO",
    "GRAFICOCINCO",
    "GRAFICOSEIS"
  ];

  saveDivsAsImages(divIds, fileNames, async (results) => { // Async para usar await dentro
    try {
      const NOMBRE = `${userInfo.data.nombres} ${userInfo.data.apellidos}`;
      const CEDULA = userInfo.data.cedula;
      const PERIODO = userInfo.data.periodo.nombre;
      const MATERIALESCARGADOS = materialesCargadosDatasetsArray.reduce((acc, item) => { return acc + item.data.reduce((sum, num) => sum + num, 0) }, 0);
      const PREGUNTASGENERADAS = preguntasGeneradasDatasetsArray.reduce((acc, item) => { return acc + item.data.reduce((sum, num) => sum + num, 0) }, 0);
      const EVALUACIONESREALIZADAS = evaluacionesRealizadasDatasetsArray.reduce((acc, item) => { return acc + item.data.reduce((sum, num) => sum + num, 0) }, 0);

      const formData = new FormData();

      // Añadir imágenes al FormData
      results.forEach(result => {
        if (result) {
          const blob = new Blob([result.bytes], { type: 'image/png' });
          formData.append(result.name.replace(".png", ""), blob, result.name.replace(".png", ""));
        } else {
          console.error('Error al capturar uno de los divs.');
        }
      });

      // Añadir otros datos al FormData
      const labels = getLast4Weeks();
      formData.append('NOMBRE', NOMBRE);
      formData.append('CEDULA', CEDULA);
      formData.append('PERIODO', PERIODO);
      formData.append('MATERIALESCARGADOS', MATERIALESCARGADOS)
      formData.append('PREGUNTASGENERADAS', PREGUNTASGENERADAS)
      formData.append('EVALUACIONESREALIZADAS', EVALUACIONESREALIZADAS)

      // Llamar a makeRequest para enviar los datos al servidor
      const response = await makeRequest(
        URL_REPORTE_PDF, // Reemplaza con tu URL
        'POST',
        {}, // Sin query params
        formData, // Datos FormData
        {}, // Sin headers adicionales
        sessionStorage.getItem("access_token") // Tu token si es necesario
      );

      if (response.status === 200) {
        // Manejar la respuesta del servidor (descargar PDF)
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'Reporte.pdf'; // Nombre del archivo
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Error al generar el PDF:', response);
        // Manejar errores (mostrar mensaje al usuario, etc.)
      }

    } catch (error) {
      console.error('Error general:', error);
    }
  });
}

document.addEventListener("DOMContentLoaded", onLoad);