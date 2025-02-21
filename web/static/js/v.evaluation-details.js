import {
  URL_EVALUACION_SELECT_BY_ID,
  URL_FEEDBACK_SELECT_BY_ID_EVALUACION,
  URL_PREGUNTA_SELECT_BY_ID_EVALUACION,
  URL_USUARIO_SELECT_INFO
} from "./urls.js";
import { makeRequest } from "./request.js";

let evaluation = null
let questions = null;
let feedback = null;

async function onLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const id_evaluation = urlParams.get('id_evaluation');

  // Obtener información de las preguntas
  if (sessionStorage.getItem("access_token_estudiante")) {
    evaluation = await makeRequest(URL_EVALUACION_SELECT_BY_ID, 'GET', { "id": id_evaluation }, null, {}, sessionStorage.getItem("access_token_estudiante"), {})
    questions = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_EVALUACION, 'GET', { "evaluacion": id_evaluation }, null, {}, sessionStorage.getItem("access_token_estudiante"), {})
    feedback = await makeRequest(URL_FEEDBACK_SELECT_BY_ID_EVALUACION, 'GET', { "evaluacion": id_evaluation }, null, {}, sessionStorage.getItem("access_token_estudiante"), {})
  } else {
    evaluation = await makeRequest(URL_EVALUACION_SELECT_BY_ID, 'GET', { "id": id_evaluation }, null, {}, sessionStorage.getItem("access_token"), {})
    questions = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_EVALUACION, 'GET', { "evaluacion": id_evaluation }, null, {}, sessionStorage.getItem("access_token"), {})
    feedback = await makeRequest(URL_FEEDBACK_SELECT_BY_ID_EVALUACION, 'GET', { "evaluacion": id_evaluation }, null, {}, sessionStorage.getItem("access_token"), {})
  }
  console.log(`feedback`, feedback)
  putInfo()
}

function putInfo() {
  // Título
  document.getElementById("title").textContent = `Detalles de la evaluación`;

  questions.data.forEach((question, index) => {
    // Crear el contenedor de la pregunta
    const preguntaDiv = document.createElement('div');
    preguntaDiv.className = 'mb-3 p-3 rounded';
    preguntaDiv.style.backgroundColor = '#f8f9fa'; // Fondo gris claro
    preguntaDiv.style.marginBottom = '15px';
    preguntaDiv.style.border = '1px solid #ddd';
    preguntaDiv.style.borderRadius = '8px';

    // Extraer la pregunta y las opciones
    const preguntaTexto = question.pregunta.split('\n')[0]; // Obtener solo la pregunta
    const opciones = question.pregunta.match(/([A-C])\) (.+)/g) || []; // Extraer opciones A, B, C

    // Crear el label de la pregunta
    const preguntaLabel = document.createElement('label');
    preguntaLabel.className = 'form-label';
    preguntaLabel.textContent = preguntaTexto;
    preguntaLabel.style.fontWeight = 'bold';
    preguntaLabel.style.display = 'block';
    preguntaLabel.style.marginBottom = '10px';

    preguntaDiv.appendChild(preguntaLabel);

    // Contenedor de opciones
    const opcionesDiv = document.createElement('div');

    opciones.forEach(opcion => {
      const [letra, texto] = opcion.split(') ');

      // Crear div para cada opción
      const opcionDiv = document.createElement('div');
      opcionDiv.className = 'form-check';

      // Crear input radio
      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'radio';
      input.name = `pregunta_${index}`; // Para que solo una opción pueda ser seleccionada
      input.value = letra.trim();
      input.disabled = true; // Deshabilitado para evitar cambios

      // Marcar la opción correcta según el JSON
      if (letra.trim() === question.respuesta) {
        input.checked = true;
      }

      // Crear label para la opción
      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.textContent = opcion;

      // Agregar elementos al div de opción
      opcionDiv.appendChild(input);
      opcionDiv.appendChild(label);

      // Agregar opción al contenedor de opciones
      opcionesDiv.appendChild(opcionDiv);
    });

    preguntaDiv.appendChild(opcionesDiv);

    // Agregar puntaje debajo
    const puntajeText = document.createElement('p');
    puntajeText.className = 'mt-2 text-muted';
    puntajeText.innerHTML = `<strong>Puntaje:</strong> ${question.puntaje}`;
    preguntaDiv.appendChild(puntajeText);

    // Agregar la pregunta al contenedor principal
    document.getElementById("qas").appendChild(preguntaDiv);
  });

  // Feedback
  const feedbackDiv = document.getElementById("feedback");
  feedbackDiv.style.backgroundColor = '#f8f9fa'; // Color de fondo gris claro
  feedbackDiv.style.padding = '20px'; // Espacio interno
  feedbackDiv.style.border = '1px solid #ddd'; // Borde gris
  feedbackDiv.style.borderRadius = '8px'; // Bordes redondeados

  // Crear el label de la pregunta
  const preguntaLabel = document.createElement('label');
  preguntaLabel.className = 'form-label';
  preguntaLabel.textContent = "Feedback";
  preguntaLabel.style.fontWeight = 'bold';
  preguntaLabel.style.display = 'block';
  preguntaLabel.style.marginBottom = '10px';
  feedbackDiv.appendChild(preguntaLabel);

  // Asumiendo que 'feedback' es un array con objetos que tienen la propiedad 'descripcion'
  feedback.data.forEach((item, index) => { // Iteramos sobre el array 'feedback'
    const descripcionDiv = document.createElement('div');
    descripcionDiv.className = 'mb-3 p-3 rounded';
    descripcionDiv.style.backgroundColor = '#f8f9fa';
    descripcionDiv.style.marginBottom = '15px';
    descripcionDiv.style.border = '1px solid #ddd';
    descripcionDiv.style.borderRadius = '8px';

    const descripcionText = document.createElement('p');
    descripcionText.innerHTML = formatText(item.descripcion);
    descripcionDiv.appendChild(descripcionText);

    feedbackDiv.appendChild(descripcionDiv);
  });
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrita
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Cursiva
    .replace(/- /g, '• ') // Convertir guiones en viñetas
    .replace(/\n/g, '<br>'); // Saltos de línea
}

document.addEventListener("DOMContentLoaded", onLoad);