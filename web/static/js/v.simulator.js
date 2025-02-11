import {
  URL_USUARIO_SELECT_INFO,
  URL_DOCUMENTOS_PDF_SELECT_ALL,
} from "./urls.js";
import { makeRequest } from "./request.js";

let documentos_pdf = null;

async function onLoad() {
  // Obtener la información de usuario
  const usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});

  if (usuario.data.rol.id === 2) {
    return
  }

  // Obtener la información de los documentos PDF
  documentos_pdf = await makeRequest(URL_DOCUMENTOS_PDF_SELECT_ALL, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  putInfo()
}

async function putInfo() {
  const { registrosPorDia, actividadAgrupada } = procesarRegistros(documentos_pdf.data);
  let table_simulator_body = document.getElementById("table-simulator-body");
  let table_hour_simulator_body = document.getElementById("table-hour-simulator-body");

  // Mostrar los resultados por día
  Object.entries(registrosPorDia).forEach(([dia, registros]) => {
    registros.forEach((registro) => {
      table_simulator_body.innerHTML += `
        <tr>
          <td>${registro.fecha}</td>
          <td>${registro.numeroAcceso}</td>
          <td>${registro.intentoDia}</td>
          <td>${registro.nombreEstudiante}</td>
          <td>${registro.periodo}</td>
          <td>${registro.materia}</td>
        </tr>
      `;
    });
  });

  // Calcular la hora con más intentos por día
  const mayorHoraPorDia = {};
  Object.entries(actividadAgrupada).forEach(([fechaHora, registro]) => {
    const [fecha, hora] = fechaHora.split(" ");
    if (!mayorHoraPorDia[fecha] || registro.intentos > mayorHoraPorDia[fecha].intentos) {
      mayorHoraPorDia[fecha] = { fecha, hora, intentos: registro.intentos };
    }
  });

  // Mostrar solo la hora con más intentos por día
  Object.values(mayorHoraPorDia).forEach((registro) => {
    table_hour_simulator_body.innerHTML += `
      <tr>
        <td>${registro.fecha} ${registro.hora}</td>
        <td>${registro.intentos}</td>
      </tr>
    `;
  });
}

// Función para formatear el número de acceso
const formatearNumeroAcceso = (id) => {
  const formato = "000000";
  const idStr = id.toString();
  return formato.slice(0, formato.length - idStr.length) + idStr;
};

// Agrupar por fecha para calcular intentos y hora máxima
const procesarRegistros = (registros) => {
  const registrosPorDia = {};
  const actividadPorHora = {};
  const actividadPorDia = {};

  registros.forEach((registro) => {
    const fechaCompleta = new Date(registro.fecha);
    const dia = fechaCompleta.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const hora = `${fechaCompleta.getHours().toString().padStart(2, "0")}:00:00`;

    // Inicializar estructuras si no existen
    if (!actividadPorHora[dia]) actividadPorHora[dia] = {};
    if (!actividadPorHora[dia][hora]) actividadPorHora[dia][hora] = 0;

    // Inicializar la estructura si no existe
    if (!actividadPorDia[dia]) actividadPorDia[dia] = 0;

    // Contabilizar actividad por dia hora
    actividadPorHora[dia][hora]++;
    actividadPorDia[dia]++;

    // Almacenar información organizada
    if (!registrosPorDia[dia]) registrosPorDia[dia] = [];
    registrosPorDia[dia].push({
      fecha: `${fechaCompleta.getDate()}/${fechaCompleta.getMonth() + 1}/${fechaCompleta.getFullYear()} - ${fechaCompleta.getHours()}:${fechaCompleta.getMinutes()}:${fechaCompleta.getSeconds()}`,
      numeroAcceso: formatearNumeroAcceso(registro.id),
      intentoDia: actividadPorDia[dia],
      nombreEstudiante: `${registro.usuario.nombres} ${registro.usuario.apellidos}`,
      periodo: registro.usuario.periodo.nombre,
      materia: registro.materia_periodo.materia.nombre,
    });
  });

  // Determinar la hora con mayor actividad agrupada por día y hora
  const actividadAgrupada = {};

  Object.keys(actividadPorHora).forEach((dia) => {
    Object.entries(actividadPorHora[dia]).forEach(([hora, intentos]) => {
      const clave = `${dia} ${hora}`; // Combinar fecha y hora como clave única

      if (!actividadAgrupada[clave]) {
        // Si no existe la clave, inicializar con los intentos actuales
        actividadAgrupada[clave] = { dia, hora, intentos };
      } else {
        // Si ya existe, sumar los intentos
        actividadAgrupada[clave].intentos += intentos;
      }
    });
  });
  return { registrosPorDia, actividadAgrupada };
};

document.addEventListener("DOMContentLoaded", onLoad);