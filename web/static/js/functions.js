import {
  URL_USUARIO_SEND_OTP,
  URL_USUARIO_VERIFY_OTP,
  URL_USUARIO_SELECT_BY_EMAIL,
  URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO,
  URL_EVALUACION_SELECT_BY_ID_DOCUMENTO_PDF,
  URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO,
  URL_BASE,
  URL_PREGUNTA_SELECT_BY_ID_EVALUACION
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
      const presentado = fechaEvaluacion < fechaActual || evaluacion.intentos > 0;
      console.log(`evaluacion ${evaluacion.id}: `, evaluacion.intentos)
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
    progressBar.style.transition = 'width 5s linear'; // Habilitar la transición
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
      const fechaDocumentoPdf = parseDate(item.evaluacion.documento_pdf.fecha); // Usar "fecha_evaluacion"
      if ((fechaDocumentoPdf >= start && fechaDocumentoPdf <= end)) {
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

    data.forEach(item => {
      const fechaDocumentoPDF = parseDate(item.documento_pdf.fecha);
      if (fechaDocumentoPDF >= weekStart && fechaDocumentoPDF <= endWeek) {
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

export function filterAnalisisRespuestas(data, labels) {
  const datasets = {};
  const tableData = [];

  labels.forEach((label, labelIndex) => {
    const [startStr, endStr] = label.split('-');
    const start = parseDate(startStr);
    const end = parseDate(endStr);

    const preguntasPorMateria = {};

    data.forEach(item => {
      const fechaDocumentoPdf = parseDate(item.evaluacion.documento_pdf.fecha);
      if (fechaDocumentoPdf >= start && fechaDocumentoPdf <= end) {
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
      const preguntas = preguntasPorMateria[materia].total;
      const correctas = preguntasPorMateria[materia].correctas;
      const incorrectas = preguntas - correctas;

      if (!datasets[materia]) {
        datasets[materia] = new Array(labels.length).fill(0);
      }
      // datasets[materia][labelIndex] = promedio;
      datasets[materia][labelIndex] = correctas;
      tableData.push({
        datos_por_semana: datasets[materia],
        materia: materia,
        preguntas: preguntas,
        correctas: correctas,
        incorrectas: incorrectas
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
  return { datasetsArray, tableData };
}

export function filterTemasMayorDificultad(data) {
  const materias = new Set();

  data.forEach(item => {
    const materia = item.evaluacion.documento_pdf.materia_periodo.materia.nombre;
    materias.add(materia);
  });

  const labels = Array.from(materias);
  const datasetsArray = [];
  const tableData = [];

  const dataPorcentajes = []; // Array para los porcentajes

  labels.forEach(materia => {
    console.log(`---------------------------------------------------------------------`)
    let correctas = 0;
    let total = 0;

    data.forEach(item => {
      const itemMateria = item.evaluacion.documento_pdf.materia_periodo.materia.nombre;
      if (itemMateria === materia) {
        total++;
        if (item.puntaje >= 5) {
          correctas++;
        }
      }
    });
    const porcentajeIncorrectas = total > 0 ? (100 - (correctas / total) * 100) : 0;
    dataPorcentajes.push(porcentajeIncorrectas); // Añade el porcentaje al array

    tableData.push({
      materia: materia,
      porcentajeIncorrectas: porcentajeIncorrectas // Calcula porcentajeIncorrectas
    });
  });

  const coloresGenerados = [];
  datasetsArray.push({
    label: ['Porcentaje de errores'],
    data: dataPorcentajes,
    backgroundColor: dataPorcentajes.map(() => {
      const color = getRandomColor();
      coloresGenerados.push(color); // Guarda el color generado
      return color;
    })
  });
  tableData.forEach((item, index) => {
    item.color = coloresGenerados[index]; // Asigna el color correspondiente
  });

  return { datasetsArray, tableData, labels };
}

export function filterEvolucionCalificaciones(data, labels) {
  const datasets = {};
  const tableData = [];

  labels.forEach((label, labelIndex) => {
    const [startStr, endStr] = label.split('-');
    const start = parseDate(startStr);
    const end = parseDate(endStr);

    data.forEach(item => {
      const fechaDocumentoPdf = parseDate(item.evaluacion.documento_pdf.fecha);
      if (fechaDocumentoPdf >= start && fechaDocumentoPdf <= end) {
        const materia = item.evaluacion.documento_pdf.materia_periodo.materia.nombre;
        const puntaje = item.puntaje;

        if (!datasets[materia]) {
          datasets[materia] = {}; // Ahora es un objeto
        }

        if (!datasets[materia][labelIndex]) { // Crea un array para cada semana
          datasets[materia][labelIndex] = [];
        }
        datasets[materia][labelIndex].push(puntaje); // Guarda el puntaje directamente
      }
    });
  });

  const datasetsArray = [];
  for (const materia in datasets) {
    const dataPoints = labels.map((label, labelIndex) => {  // Itera sobre labels
      const semanaData = datasets[materia][labelIndex] || []; // Obtén las notas de la semana o array vacío
      const suma = semanaData.reduce((sum, puntaje) => sum + puntaje, 0); // Suma las notas de la semana
      const cantidad = semanaData.length;
      const promedio = cantidad > 0 ? suma / cantidad : 0;
      return promedio;
    });

    datasetsArray.push({
      label: materia,
      data: dataPoints,
      backgroundColor: getRandomColor()
    });

    tableData.push({
      materia: materia,
      datos_por_semana: dataPoints
    });
  }

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

export function saveDivsAsImages(divIds, fileNames, callback) {
  if (!Array.isArray(divIds) || !Array.isArray(fileNames) || divIds.length !== fileNames.length) {
    console.error("Los argumentos divIds y fileNames deben ser arrays con la misma longitud.");
    return;
  }

  const promises = [];

  for (let i = 0; i < divIds.length; i++) {
    const divId = divIds[i];
    const fileName = fileNames[i];

    const div = document.getElementById(divId);
    if (!div) {
      console.error(`Div no encontrado: ${divId}`);
      continue; // Saltar al siguiente div si no se encuentra el actual
    }

    const width = div.offsetWidth;
    const height = div.offsetHeight;

    promises.push(
      html2canvas(div, {
        scale: 1,
        width: width,
        height: height,
        onrendered: function (canvas) {
          const context = canvas.getContext('2d');
          context.willReadFrequently = true;
        }
      }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const byteString = atob(imgData.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) {
          ia[j] = byteString.charCodeAt(j);
        }
        return { bytes: ab, name: fileName }; // Devolver un objeto con bytes y nombre
      }).catch(err => {
        console.error(`Error al capturar div ${divId}:`, err);
        return null; // Devolver null en caso de error
      })
    );
  }


  Promise.all(promises).then(results => {
    const validResults = results.filter(result => result !== null); // Filtrar resultados nulos (errores)
    if (callback) {
      callback(validResults); // Pasar el array de objetos {bytes, name} al callback
    } else {
      validResults.forEach(result => {
        const blob = new Blob([result.bytes], { type: 'image/png' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = result.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      });
    }
  });
}
