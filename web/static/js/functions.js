import {
  URL_USUARIO_SEND_OTP,
  URL_USUARIO_VERIFY_OTP,
  URL_USUARIO_SELECT_BY_EMAIL,
  URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO,
  URL_EVALUACION_SELECT_BY_ID_DOCUMENTO_PDF,
  URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO,
  URL_BASE
} from './urls.js';
import { makeRequest } from './request.js';

const reader = new FileReader();

export async function sendOtpCode() {
  const email = document.getElementById("email").value;
  const response = await makeRequest(
    URL_USUARIO_SEND_OTP,   // baseUrl
    'POST',                 // method
    {},                     // params (query params)
    { email },              // body data
    { 'Content-Type': 'application/json' }, // headers
    null,                   // token (si lo necesitas, pásalo aquí)
    {}                      // pathParams (vacío porque no se usan en esta petición)
  );
}

export async function verifyEmail(email = null) {
  console.log("verifyEmail")
  let id = null;
  if (!email) {
    email = document.getElementById("email").value;
  }
  const response = await makeRequest(
    URL_USUARIO_SELECT_BY_EMAIL + encodeURIComponent(email), // baseUrl
    'GET',          // method
    {},             // params (query params)
    null,           // body data
    {},             // headers
    null,           // token
    {}              // pathParams
  );
  if (response.status === 200) {
    id = response.data.id;
  }
  return id;
}

export function getOtpCode() {
  // Selecciona todos los inputs con la clase "otp-input"
  const otpInputs = document.querySelectorAll(".otp-input");
  // Convierte la NodeList en un array y une los valores en un solo string
  const otpCode = Array.from(otpInputs).map(input => input.value).join("");
  return otpCode;
}

export async function verifyOtpCode() {
  console.log("verifyOtpCode")
  const email = document.getElementById("email").value;
  const otp = getOtpCode();
  let returnValue = false;
  const response = await makeRequest(
    URL_USUARIO_VERIFY_OTP, // baseUrl
    'POST',                 // method
    {},                     // params (query params)
    { email: email, otp: otp }, // body data
    { 'Content-Type': 'application/json' }, // headers
    null,                   // token
    {}                      // pathParams
  );
  returnValue = response.status !== 400;
  return returnValue;
}

export async function verifyDni() {
  const dni = document.getElementById("dni").value;
  let returnValue = false;
  const response = await makeRequest(
    URL_USUARIO_VERIFY_OTP, // baseUrl
    'POST',                 // method
    {},                     // params (query params)
    { dni: dni }, // body data
    { 'Content-Type': 'application/json' }, // headers
    null,                   // token
    {}                      // pathParams
  );
  returnValue = response !== null;
  return returnValue;
}

export function showLoader() {
  document.getElementById("loader-container").style.display = "flex";
}

export function hideLoader() {
  document.getElementById("loader-container").style.display = "none";
}

export async function getSubjectsProgress(userInfo) {
  let data = [];

  // Obtener la data de las materias con el id de usuario
  const materias = await makeRequest(URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), { periodo: userInfo.data.periodo.id });
  materias.data.forEach(materia_periodo => {
    data[materia_periodo.materia.id] = {
      id_materia_periodo: materia_periodo.id,
      id_materia: materia_periodo.materia.id,
      nombre_materia: materia_periodo.materia.nombre,
      presentados: 0,
      no_presentados: 0,
      progreso: 0
    };
  });

  // Obtener la data de los documentos PDF con el id de usuario
  const documentosPDF = await makeRequest(
    URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO,
    "GET",
    { usuario: userInfo.data.id },
    null,
    {},
    sessionStorage.getItem("access_token")
  );

  const fechaActual = new Date();
  await Promise.all(
    documentosPDF.data.map(async (documentoPDF) => {
      // Obtener el registro de la evaluación con el id del documento PDF
      const evaluacion = (
        await makeRequest(
          URL_EVALUACION_SELECT_BY_ID_DOCUMENTO_PDF,
          "GET",
          { documento_pdf: documentoPDF.id },
          null,
          {},
          sessionStorage.getItem("access_token")
        )
      ).data[0];
      const id_materia_periodo = evaluacion.documento_pdf.materia_periodo.id;
      const id_materia = evaluacion.documento_pdf.materia_periodo.materia.id;
      const nombre_materia = evaluacion.documento_pdf.materia_periodo.materia.nombre;

      // Obtener fecha de evaluación sin UTC
      const fechaEvaluacionStr = evaluacion.fecha_evaluacion.replace("Z", "");
      const duracionStr = evaluacion.duracion;

      // Convertir fecha de evaluación a objeto Date (sin UTC)
      const fechaEvaluacion = new Date(fechaEvaluacionStr);

      // Extraer horas, minutos y segundos de la duración
      const [horas, minutos, segundos] = duracionStr.split(":").map(Number);

      // Sumar la duración a la fecha de evaluación
      fechaEvaluacion.setHours(fechaEvaluacion.getHours() + horas);
      fechaEvaluacion.setMinutes(fechaEvaluacion.getMinutes() + minutos);
      fechaEvaluacion.setSeconds(fechaEvaluacion.getSeconds() + segundos);

      // Comparar si la evaluación ya terminó
      const presentado = fechaEvaluacion < fechaActual;
      // ----------------------------------------------- //
      if (!data[id_materia]) {
        data[id_materia] = {
          id_materia_periodo: id_materia_periodo,
          id_materia: id_materia,
          nombre_materia: nombre_materia,
          presentados: 0,
          no_presentados: 0,
          progreso: 0
        };
      }

      if (presentado) {
        data[id_materia].presentados++;
      } else {
        data[id_materia].no_presentados++;
      }

      // Calcular progreso
      const total = data[id_materia].presentados + data[id_materia].no_presentados;
      data[id_materia].progreso = total > 0 ? (data[id_materia].presentados / total) * 100 : 0;

    })
  );
  return data;
}

export async function getPagesPerWeek(fileURL, weeks) {
  if (weeks === 0) {
    return "N/A";
  }
  try {
    // Cargar el PDF usando PDF.js desde la URL temporal
    const pdf = await pdfjsLib.getDocument(fileURL).promise;
    console.log(`pdf.numPages / weeks: ${pdf.numPages} / ${weeks}`)
    const pagesPerWeek = pdf.numPages / weeks;
    return pagesPerWeek; // Retornar el valor
  } catch (error) {
    console.error("Error al cargar el PDF:", error);
    return null; // Retorna null o un valor predeterminado en caso de error
  }
}

export function getWeeksBetweenDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  console.log(`start: ${start}`)
  console.log(`end: ${end}`)

  // Calcular la diferencia en milisegundos
  const diffInMs = end - start;

  // Convertir la diferencia de milisegundos a días
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  console.log(`diffInDays: ${diffInDays}`)

  // Convertir los días en semanas
  const weeks = Math.ceil(diffInDays / 7);

  return weeks;
}

export async function fetchFileAndCreateURL(relativePath) {
  try {
    const response = await fetch(`${URL_BASE}${relativePath}`);  // Usar la URL completa del servidor
    const blob = await response.blob();  // Convertir la respuesta en un Blob
    const objectURL = URL.createObjectURL(blob);  // Crear una URL temporal para el Blob
    return objectURL;
  } catch (error) {
    console.error('Error al obtener el archivo:', error);
    return null;
  }
}

export function showNotification(type, message) {
  const notification = document.getElementById('notification');
  const progressBar = document.getElementById('progress-bar');
  const notificationText = document.getElementById('notification-text');
  
  // Reiniciar la barra de progreso eliminando el ancho
  progressBar.style.transition = 'none'; // Desactivar la transición para reiniciar el valor
  progressBar.style.width = '0%';  // Reiniciar la barra de progreso a 0%
  
  // Actualizar el mensaje y el estilo de la notificación
  notificationText.textContent = message;
  notification.className = 'notification show ' + type;
  
  // Después de un pequeño retraso, volver a aplicar la transición y animar
  setTimeout(() => {
    progressBar.style.transition = 'width 3s linear'; // Habilitar la transición
    progressBar.style.width = '100%'; // Establecer el ancho al 100%
  }, 50);  // Retardo para que se ejecute después de que se haya reiniciado la barra de progreso
  
  // Asegurarse de que la notificación se haga visible
  notification.style.transform = 'translate(-50%, 0px)';
  
  // Escuchar el evento de fin de transición de la barra de progreso
  progressBar.addEventListener('transitionend', () => {
    // Mover la notificación fuera de la pantalla antes de cerrarla
    notification.style.transition = 'transform 0.5s ease-in-out'; // Animar el movimiento
    notification.style.transform = 'translate(-50%, -100%)'; // Mover fuera de la pantalla
    
    // Después de la animación de cierre, eliminar la clase 'show' para ocultar la notificación
    setTimeout(() => {
      closeNotification();
    }, 500); // Esperar 0.5s para completar la animación
  });
}

export function closeNotification() {
  const notification = document.getElementById("notification");
  notification.classList.remove("show");
  notification.style.transition = ''; // Resetear la transición
  notification.style.transform = ''; // Resetear el estilo de transform
}