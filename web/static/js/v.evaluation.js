import {
  URL_EVALUACION_SELECT_BY_ID,
  URL_PREGUNTA_SELECT_BY_ID_EVALUACION,
  URL_PREGUNTA_UPDATE_BY_ID,
  URL_EVALUACION_UPDATE,
  URL_HISTORIAL_CREATE,
  URL_USUARIO_SELECT_INFO

} from "./urls.js";
import {
  EVALUACION_FINALIZADA
} from "./historial_data.js";
import { makeRequest } from "./request.js";
import { getCurrentDateTime } from "./utils.js";
import { showNotification } from './functions.js'

let evaluation = null
let questions = null
let responses = [] // En base de 0 a 10

async function validateResponses() {
  responses.length = 0; // Limpiar respuestas anteriores

  questions.data.forEach((question, index) => {
    const respuestaUsuario = document.querySelector(`input[name="pregunta${index}"]:checked`);
    const respuestaSeleccionada = respuestaUsuario ? respuestaUsuario.value : null;
    const respuestaCorrecta = question.respuesta_correcta;

    // Comparar la respuesta seleccionada con la correcta
    const puntaje = respuestaSeleccionada === respuestaCorrecta ? 10 : 0;
    responses.push(puntaje);
  });
}

async function validateQuestions(event) {
  event.preventDefault();

  // Obtener la información de usuario
  const userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  // Validar que todas las preguntas tengan una respuesta seleccionada
  let allAnswered = true;
  questions.data.forEach((question, index) => {
    const respuestaUsuario = document.querySelector(`input[name="pregunta${index}"]:checked`);
    if (!respuestaUsuario) {
      allAnswered = false;
      document.getElementById(`pregunta${index}-error`).textContent = "Debe seleccionar una respuesta.";
    } else {
      document.getElementById(`pregunta${index}-error`).textContent = ""; // Limpiar mensaje si ya respondió
    }
  });

  // Si falta al menos una respuesta, mostrar mensaje y detener el proceso
  if (!allAnswered) {
    showNotification("error", "Debe responder todas las preguntas antes de enviar.");
    return;
  }

  // Validar respuestas
  validateResponses();

  // Insertar respuestas
  questions.data.forEach(async (question, index) => {
    const respuestaUsuario = document.querySelector(`input[name="pregunta${index}"]:checked`);
    const respuesta = respuestaUsuario.value; // Guardar la opción seleccionada (A, B o C)
    const puntaje = responses[index];

    await makeRequest(
      URL_PREGUNTA_UPDATE_BY_ID,
      'PATCH',
      {},
      { "respuesta": respuesta, "puntaje": puntaje },
      { 'Content-Type': 'application/json' },
      sessionStorage.getItem("access_token"),
      { "id": question.id }
    );
  });

  // Guardar historial
  const fechaActualUTC = getCurrentDateTime();
  await makeRequest(
    URL_HISTORIAL_CREATE,
    'POST',
    {},
    { "usuario": userInfo.data.id, "descripcion": `${EVALUACION_FINALIZADA} ${evaluation.data.titulo}`, "fecha": fechaActualUTC },
    { 'Content-Type': 'application/json' },
    sessionStorage.getItem("access_token")
  );

  showNotification("success", "Respuestas enviadas");
  setTimeout(() => {
    window.location.href = "/";
  }, 3000);
}

async function onLoad() {
  // Obtener la información de usuario
  const userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  const urlParams = new URLSearchParams(window.location.search);
  const id_evaluation = urlParams.get('id_evaluation');

  // Obtener información de la evaluación
  if (sessionStorage.getItem("access_token_estudiante")) {
    evaluation = await makeRequest(URL_EVALUACION_SELECT_BY_ID, 'GET', {}, null, {}, sessionStorage.getItem("access_token_estudiante"), { "id": id_evaluation })
  } else {
    if (userInfo.data.rol.id === 1) {
      return
    }
    evaluation = await makeRequest(URL_EVALUACION_SELECT_BY_ID, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), { "id": id_evaluation })
  }

  // Obtener información de las preguntas
  if (sessionStorage.getItem("access_token_estudiante")) {
    questions = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_EVALUACION, 'GET', { "evaluacion": id_evaluation }, null, {}, sessionStorage.getItem("access_token_estudiante"), {})
  } else {
    questions = await makeRequest(URL_PREGUNTA_SELECT_BY_ID_EVALUACION, 'GET', { "evaluacion": id_evaluation }, null, {}, sessionStorage.getItem("access_token"), {})
  }

  putInfo()

  // Añadir evento de submit
  const quiz = document.getElementById("quiz");
  if (quiz) {
    quiz.addEventListener("submit", (event) => validateQuestions(event));
  }
}

function putInfo() {
  // Título
  document.getElementById("title").textContent = `Evaluación: ${evaluation.data.documento_pdf.materia_periodo.materia.nombre} - ${evaluation.data.titulo}`;

  // Preguntas
  questions.data.forEach((question, index) => {
    console.log('question', question);

    const preguntaDiv = document.createElement('div');
    preguntaDiv.className = 'mb-3 p-3 rounded';
    preguntaDiv.style.backgroundColor = '#f8f9fa'; // Fondo gris claro
    preguntaDiv.style.marginBottom = '15px'; // Espacio entre preguntas
    preguntaDiv.style.border = '1px solid #ddd'; // Borde suave
    preguntaDiv.style.borderRadius = '8px'; // Bordes redondeados

    // Extraer la pregunta y opciones
    const preguntaTexto = question.pregunta.split('\n')[0]; // Extrae solo la pregunta
    const opciones = question.pregunta.match(/([A-C])\) (.+)/g) || []; // Extrae opciones A, B, C

    // Crear el label para la pregunta
    const preguntaLabel = document.createElement('label');
    preguntaLabel.className = 'form-label';
    preguntaLabel.textContent = `${index + 1}. ${preguntaTexto}`;
    preguntaLabel.style.fontWeight = 'bold'; // Texto en negrita
    preguntaLabel.style.display = 'block'; // Asegurar que ocupa una línea completa
    preguntaLabel.style.marginBottom = '10px'; // Espacio entre pregunta y opciones

    preguntaDiv.appendChild(preguntaLabel);

    // Crear las opciones de radio
    opciones.forEach((opcion, i) => {
      const [letra, texto] = opcion.split(') ');

      const opcionDiv = document.createElement('div');
      opcionDiv.className = 'form-check';

      const input = document.createElement('input');
      input.type = 'radio';
      input.className = 'form-check-input';
      input.id = `pregunta${index}_opcion${letra}`;
      input.name = `pregunta${index}`;
      input.value = letra;

      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = input.id;
      label.textContent = opcion; // Mostrar "A) Árboles jerárquicos", etc.

      opcionDiv.appendChild(input);
      opcionDiv.appendChild(label);
      preguntaDiv.appendChild(opcionDiv);
    });

    // Agregar un div para mostrar errores
    const errorDiv = document.createElement('div');
    errorDiv.id = `pregunta${index}-error`;
    errorDiv.className = 'text-danger';
    errorDiv.style.marginTop = '5px';
    preguntaDiv.appendChild(errorDiv);

    document.getElementById("questions").appendChild(preguntaDiv);
  });
}

document.addEventListener("DOMContentLoaded", onLoad);