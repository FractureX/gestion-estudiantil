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

export async function verifyCedula(cedula = null) {
  if (!cedula) {
    cedula = document.getElementById("cedula").value;
  }

  let returnValue = false;
  const response = await makeRequest(
    URL_USUARIO_VERIFY_OTP, // baseUrl
    'POST',                 // method
    {},                     // params (query params)
    { cedula: cedula }, // body data
    { 'Content-Type': 'application/json' }, // headers
    null,                   // token
    {}                      // pathParams
  );
  returnValue = response.status !== 200;
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

export function getWeeksBetweenDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calcular la diferencia en milisegundos
  const diffInMs = end - start;

  // Convertir la diferencia de milisegundos a días
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // Convertir los días en semanas
  const weeks = Math.ceil(diffInDays / 7);

  return weeks;
}

export async function getPagesPerWeek(fileURL, weeks) {
  if (weeks === 0) {
    return "N/A";
  }
  try {
    // Cargar el PDF usando PDF.js desde la URL temporal
    const pdf = await pdfjsLib.getDocument(fileURL).promise;
    const pagesPerWeek = pdf.numPages / weeks;
    return pagesPerWeek; // Retornar el valor
  } catch (error) {
    console.error("Error al cargar el PDF:", error);
    return null; // Retorna null o un valor predeterminado en caso de error
  }
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

// Función para obtener las últimas 4 semanas
export function getLast4Weeks() {
  const today = new Date();
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const start = new Date(today);
    start.setDate(today.getDate() - (today.getDay() + 7 * i));
    const end = new Date(today);
    end.setDate(today.getDate() - (today.getDay() + 7 * i - 6));
    weeks.push(`${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
  }
  return weeks.reverse(); // Ordenar las semanas de más antigua a más reciente
}

// Función para filtrar los datos por fecha y materia
export function filterData(data, labels) {
  const datasets = {};
  const tableData = [];

  labels.forEach((label, labelIndex) => { // Añadir index para la tabla
    const [startStr, endStr] = label.split('-');
    const start = parseDate(startStr);
    const end = parseDate(endStr);

    data.forEach(item => {
      const fechaItem = parseDate(item.fecha);
      if (fechaItem >= start && fechaItem <= end) {
        const materia = item.materia_periodo.materia.nombre;
        if (!datasets[materia]) {
          datasets[materia] = new Array(labels.length).fill(0); // Inicializar con ceros
        }
        datasets[materia][labelIndex]++; // Incrementar en el índice correcto
      }
    });
  });

  const datasetsArray = [];
  for (const materia in datasets) {
    datasetsArray.push({
      label: materia,
      data: datasets[materia], // Usar el array pre-calculado
      backgroundColor: getRandomColor()
    });

    // Agregar datos para la tabla (después de calcular dataForMateria)
    tableData.push({
      materia: materia,
      datos_por_semana: datasets[materia] // Usar el array pre-calculado
    });
  }

  return { datasetsArray, tableData };
}

export function filterPreguntasGeneradas(data, labels) {
  const datasets = {};
  const tableData = [];

  labels.forEach((label, labelIndex) => {
    const [startStr, endStr] = label.split('-');
    const start = parseDate(startStr);
    const end = parseDate(endStr);
    data.forEach(item => {
      const fechaEvaluacion = parseDate(item.evaluacion.fecha_evaluacion); // Usar "fecha_evaluacion"
      if (fechaEvaluacion >= start && fechaEvaluacion <= end) {
        const materia = item.evaluacion.documento_pdf.materia_periodo.materia.nombre;
        if (!datasets[materia]) {
          datasets[materia] = new Array(labels.length).fill(0);
        }
        datasets[materia][labelIndex]++;
      }
    });
  });

  const datasetsArray = [];
  for (const materia in datasets) {
    datasetsArray.push({
      label: materia,
      data: datasets[materia],
      backgroundColor: getRandomColor()
    });

    tableData.push({
      materia: materia,
      datos_por_semana: datasets[materia]
    });
  }

  return { datasetsArray, tableData };
}

export function filterEvaluacionesRealizadas(data, labels) {
  const datasets = {};
  const tableData = [];

  labels.forEach((label, labelIndex) => {
    const [startStr, endStr] = label.split('-');
    const weekStart = parseDate(startStr);
    const endWeek = parseDate(endStr);
    const newDate = new Date()
    const [currentDay, currentMonth, currentYear] = newDate.toLocaleDateString().split("/")
    const [currentHours, currentMinutes, currentSeconds] = newDate.toTimeString().split(" ")[0].split(":")
    const currentDateStr = `${currentYear}-${currentMonth.length === 1 ? ("0" + currentMonth) : currentMonth}-${currentDay}T${currentHours}:${currentMinutes}:${currentSeconds}.000Z`
    const currentDate = parseDate(currentDateStr) // YYYY-MM-DDTHH:mm:ss.sssZ

    data.forEach(item => {
      const fechaEvaluacionSinDuracion = parseDate(item.fecha_evaluacion);
      const fechaEvaluacionConDuracion = parseDate(item.fecha_evaluacion, item.duracion);
      if (currentDate > fechaEvaluacionConDuracion && (fechaEvaluacionSinDuracion >= weekStart && fechaEvaluacionSinDuracion <= endWeek)) {
        const materia = item.documento_pdf.materia_periodo.materia.nombre;
        if (!datasets[materia]) {
          datasets[materia] = new Array(labels.length).fill(0);
        }
        datasets[materia][labelIndex]++;
      }
    });
  });

  const datasetsArray = [];
  for (const materia in datasets) {
    datasetsArray.push({
      label: materia,
      data: datasets[materia],
      backgroundColor: getRandomColor()
    });

    tableData.push({
      materia: materia,
      datos_por_semana: datasets[materia]
    });
  }

  return { datasetsArray, tableData };
}

export function filterPromedioRespuestasCorrectas(data, labels) {
  const datasets = {};
  const tableData = [];

  labels.forEach((label, labelIndex) => {
    const [startStr, endStr] = label.split('-');
    const start = parseDate(startStr);
    const end = parseDate(endStr);

    const preguntasPorMateria = {};

    data.forEach(item => {
      const fechaEvaluacion = parseDate(item.evaluacion.fecha_evaluacion);
      if (fechaEvaluacion >= start && fechaEvaluacion <= end) {
        const materia = item.evaluacion.documento_pdf.materia_periodo.materia.nombre;

        if (!preguntasPorMateria[materia]) {
          preguntasPorMateria[materia] = { correctas: 0, total: 0 }; // Inicializar objeto con contadores
        }

        preguntasPorMateria[materia].total++;
        if (item.puntaje >= 5) {
          preguntasPorMateria[materia].correctas++;
        }
      }
    });

    for (const materia in preguntasPorMateria) {
      const correctas = preguntasPorMateria[materia].correctas;
      const total = preguntasPorMateria[materia].total;
      const promedio = total > 0 ? (correctas / total) * 100 : 0;

      if (!datasets[materia]) {
        datasets[materia] = new Array(labels.length).fill(0);
      }
      // datasets[materia][labelIndex] = promedio;
      datasets[materia][labelIndex] = correctas;
      console.log(`labelIndex`, labelIndex)
      tableData.push({
        materia: materia,
        datos_por_semana: datasets[materia],
        correctas: correctas, // Guardar la cantidad total de respuestas correctas
        total: total, // Guardar la cantidad total de preguntas
        promedio: promedio.toFixed(2) + "%"
      });
    }
  });

  const datasetsArray = [];
  for (const materia in datasets) {
    datasetsArray.push({
      label: materia,
      data: datasets[materia],
      backgroundColor: getRandomColor()
    });
  }

  console.log(`datasetsArray`, datasetsArray)
  console.log(`tableData`, tableData)
  return { datasetsArray, tableData };
}

// Función para generar un color aleatorio
export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Función para devolver un date con respecto
export function parseDate(dateString, durationString = null) {
  let date;

  if (dateString.includes('/')) { // Formato DD/MM/YYYY
    const [day, month, year] = dateString.split('/');
    const stringStr = `${year.replace(" ", "")}-${month.replace(" ", "")}-${day.replace(" ", "")}`
    date = new Date(stringStr);
  } else if (dateString.includes('T')) { // Formato YYYY-MM-DDTHH:mm:ss.sssZ
    const [fechaParte, tiempoParte] = dateString.split('T');
    const [year, month, day] = fechaParte.split('-');
    const [hours, minutes] = tiempoParte.slice(0, 5).split(':');
    const stringStr = `${year.replace(" ", "")}-${month.replace(" ", "")}-${day.replace(" ", "")}T${hours.replace(" ", "")}:${minutes.replace(" ", "")}`
    date = new Date(stringStr);
  } else {
    // Manejar otros formatos o lanzar un error si no se reconoce el formato
    console.error("Formato de fecha no reconocido:", dateString);
    return null;
  }

  if (durationString) { // Si se proporciona la duración
    const [hours, minutes, seconds] = durationString.split(':');
    const durationMilliseconds = (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
    date.setTime(date.getTime() + durationMilliseconds);
  }

  return date;
}