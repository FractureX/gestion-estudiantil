import {
  URL_EVALUACION_SELECT_BY_ID, 
  URL_PREGUNTA_SELECT_BY_ID_EVALUACION, 
  URL_USUARIO_SELECT_INFO 
} from "./urls.js";
import { makeRequest } from "./request.js";

let evaluation = null;
let questions = null;

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
}

function putInfo() {
  // Título
  document.getElementById("title").textContent = `Detalles de la evaluación`

  // Preguntas
  questions.data.forEach((question, index) => {
    const preguntaDiv = document.createElement('div');
    preguntaDiv.className = 'mb-3 card h-100';
    const preguntaContentDiv = document.createElement('div');
    preguntaContentDiv.className = 'card-body';

    const preguntaLabel = document.createElement('label');
    preguntaLabel.className = 'form-label';
    preguntaLabel.htmlFor = `pregunta${index}`;
    preguntaLabel.textContent = `${index + 1}. ${question.pregunta}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.id = `pregunta${index}`;
    input.name = `pregunta${index}`;
    input.value = `${question.respuesta}`;
    input.disabled = true

    preguntaContentDiv.appendChild(preguntaLabel);
    preguntaContentDiv.appendChild(input);
    preguntaDiv.appendChild(preguntaContentDiv);
    document.getElementById("qas").appendChild(preguntaDiv);
  });
}

document.addEventListener("DOMContentLoaded", onLoad);