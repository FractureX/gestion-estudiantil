import {
  URL_PREGUNTA_SELECT_ALL,
  URL_USUARIO_SELECT_INFO
} from "./urls.js";
import { makeRequest } from "./request.js";

let questions = null

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

  // Obtener preguntas por id de usuario
  questions = await makeRequest(URL_PREGUNTA_SELECT_ALL, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});

  putInfo(userInfo)
}

async function putInfo(userInfo) {
  // Obtener el contenedor de las preguntas
  const table_question_body = document.getElementById("table-question-body")
  
  questions.data.forEach(pregunta => {
    if (pregunta.evaluacion.documento_pdf.usuario.id === userInfo.data.id && pregunta.puntaje < 5 && pregunta.evaluacion.duracion === "00:00:00") {
      table_question_body.innerHTML += `
        <tr>
          <td>${pregunta.id}</td>
          <td>${pregunta.evaluacion.documento_pdf.materia_periodo.materia.nombre}</td>
          <td>${pregunta.evaluacion.titulo}</td>
          <td>${pregunta.pregunta}</td>
          <td>${pregunta.respuesta}</td>
          <td>${pregunta.puntaje.toFixed(2)}</td>
        </tr>
      `
    }
  });
}

document.addEventListener("DOMContentLoaded", onLoad);