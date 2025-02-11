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

let evaluation = null
let questions = null
let responses = [] // En base de 0 a 10

async function validateResponses() {
  questions.data.forEach(_ => {
    responses.push(Math.random() * 10)
  });
}

async function validateQuestions(event) {
  event.preventDefault()
  // Obtener la información de usuario
  const userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  // Validar respuestas
  validateResponses()

  // Actualizar la duración de la evaluación
  await makeRequest(URL_EVALUACION_UPDATE, 'PATCH', {}, {"duracion": "00:00:00"}, {'Content-Type': 'application/json'}, sessionStorage.getItem("access_token"), {"id": evaluation.data.id})

  // Insertar respuestas
  questions.data.forEach(async(question, index) => {
    const respuesta = document.querySelector(`#pregunta${index}`).value
    const puntaje = responses[index]
    await makeRequest(URL_PREGUNTA_UPDATE_BY_ID, 'PATCH', {}, {"respuesta": respuesta, "puntaje": puntaje}, {'Content-Type': 'application/json'}, sessionStorage.getItem("access_token"), {"id": question.id})
  });
  const fechaActualUTC = getCurrentDateTime();
  await makeRequest(URL_HISTORIAL_CREATE, 'POST', {}, {"usuario": userInfo.data.id, "descripcion": `${EVALUACION_FINALIZADA} ${evaluation.data.titulo}`, "fecha": fechaActualUTC}, {'Content-Type': 'application/json'}, sessionStorage.getItem("access_token"));
  
  alert("Respuestas enviadas")
  window.location.href = "/"
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
  
  console.log(evaluation)

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
  document.getElementById("title").textContent = `Evaluación: ${evaluation.data.documento_pdf.materia_periodo.materia.nombre} - ${evaluation.data.titulo}`

  // Preguntas
  questions.data.forEach((question, index) => {
    const preguntaDiv = document.createElement('div');
    preguntaDiv.className = 'mb-3';

    const preguntaLabel = document.createElement('label');
    preguntaLabel.className = 'form-label';
    preguntaLabel.htmlFor = `pregunta${index}`;
    preguntaLabel.textContent = `${index + 1}. ${question.pregunta}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.id = `pregunta${index}`;
    input.name = `pregunta${index}`;

    preguntaDiv.appendChild(preguntaLabel);
    preguntaDiv.appendChild(input);
    document.getElementById("questions").appendChild(preguntaDiv);
  });
}

document.addEventListener("DOMContentLoaded", onLoad);