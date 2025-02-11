import {
  URL_USUARIO_LOGIN,
  URL_USUARIO_SELECT_INFO,
  URL_USUARIO_SELECT,
  URL_NOTIFICACION_SELECT_BY_ID_USUARIO,
  URL_NOTIFICACION_UPDATE
} from "./urls.js";
import { makeRequest } from "./request.js";

let userInfo = null
let notificaciones = null

async function onLoad() {
  console.log("onLoad")
  // Obtener la información de usuario
  userInfo = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));

  // Añadir evento al perfil
  document.getElementById("perfil").addEventListener("click", (event) => { location.href = "/profile/" });

  await putNotificationEvent()
  await putNotificationInfo()

  // Verificar si es administrador o usuario normal
  if (userInfo.data.rol.id === 2) {
    sessionStorage.removeItem("id_estudiante")
    sessionStorage.removeItem("access_token_estudiante")
    return
  }

  // Select de usuarios
  document.getElementById("user-select").style.display = "flex"

  putAdminUiInfo();
}

async function putNotificationEvent() {
  // Añadir evento de las notificaciones
  const notificacionesIcon = document.getElementById('notificaciones');
  const listaNotificaciones = document.getElementById('lista-notificaciones');

  notificacionesIcon.addEventListener('click', () => {
    listaNotificaciones.style.display = listaNotificaciones.style.display === 'block' ? 'none' : 'block';
    if (notificaciones) {
      for(let i = 0; i < notificaciones.data.length; i++) {
        if (!notificaciones[i].visto) {
          // Actualizar
          makeRequest(
            URL_NOTIFICACION_UPDATE,            // baseUrl
            'PATCH',        // method
            {},             // params (query params)
            { visto: true },      // body data
            { 'Content-Type': 'application/json' }, // headers
            sessionStorage.getItem("access_token"), // token
            { id: notificaciones[i].id } // pathParams
          ).then(data => {
            console.log(data)
          });
        }
      }
    }
  });
  document.addEventListener('click', (event) => {
    if (!notificacionesIcon.contains(event.target) && listaNotificaciones.style.display === 'block') {
      listaNotificaciones.style.display = 'none';
    }
  });
}

async function putNotificationInfo() {
  notificaciones = await makeRequest(
    URL_NOTIFICACION_SELECT_BY_ID_USUARIO,
    'GET',
    { "usuario": userInfo.data.id },
    {},
    { 'Content-Type': 'application/json' },
    sessionStorage.getItem("access_token"),
    {}
  )
  notificaciones.data.forEach(notificacion => {
    const fechaISO = notificacion.fecha_aparicion;

    // 1. Extraer fecha y hora en UTC (sin la 'Z')
    const fechaHoraUTC = fechaISO.slice(0, 19).replace('T', ' '); // '2025-02-10 17:58:00'

    // 2. Crear objetos Date con la fecha y hora en UTC
    const fechaNotificacion = new Date(fechaHoraUTC);
    const fechaActual = new Date();

    // 3. Comparar las fechas (ignorando la zona horaria)
    console.log(`fechaNotificacion: ${fechaNotificacion}`)
    console.log(`fechaActual: ${fechaActual}`)
    if (fechaNotificacion.getTime() <= fechaActual.getTime()) {
      // La fecha de la notificación es menor o igual a la fecha actual

      // Extraer la parte de la fecha (YYYY-MM-DD)
      const fecha = fechaISO.slice(0, 10);

      // Separar la fecha en día, mes y año
      const [anio, mes, dia] = fecha.split('-');

      // Extraer la parte de la hora (HH:MM:SS)
      const horaCompleta = fechaISO.slice(11, 19);

      // Separar la hora en horas, minutos y segundos
      const [horas, minutos, segundos] = horaCompleta.split(':');

      // Convertir a formato de 12 horas y AM/PM
      const ampm = horas >= 12 ? 'PM' : 'AM';
      let horas12 = horas % 12;
      horas12 = horas12 ? horas12 : 12; // Si la hora es 0, convertirla a 12

      // Crear la cadena formateada
      const fechaFormateada = `${dia}/${mes}/${anio} ${horas12}:${minutos} ${ampm}`;

      const claseVisto = notificacion.visto ? '' : 'notificacion-no-visto';
      document.getElementById("lista-notificaciones").innerHTML += `
        <a class="dropdown-item" href="#">
          <div class="notificacion ${claseVisto}">
            <h6 class="notificacion-titulo">${notificacion.titulo}</h6>
            <p class="notificacion-descripcion">${notificacion.descripcion}</p>
            <p class="notificacion-fecha">${fechaFormateada}</p>
          </div>
        </a>
      `;
    } else {
      // La fecha de la notificación es posterior a la fecha actual
      console.log("La notificación es futura:", notificacion.fecha_aparicion);
      // Puedes optar por no mostrarla o mostrar un mensaje diferente
    }
  });
}

async function putAdminUiInfo() {
  // Ingresar las opciones de gestión
  document.getElementById("navbar").innerHTML =
    `
    <a href="/manage-period" class="nav-link">Gestión de periodos</a>
    <a href="/manage-subject" class="nav-link">Gestión de materia</a>
    <a href="/manage-period-subject" class="nav-link">Gestión de materias por periodo</a>
    <a href="/simulator" class="nav-link">Uso del simulador</a>
  `
    + document.getElementById("navbar").innerHTML +
    `
    <a href="/config" class="nav-link">Configuración</a>
  `

  // Select de estudiantes
  const adminSelect = document.getElementById('adminSelect');
  let data = []

  // Obtener info de los estudiantes
  const usuarios = await makeRequest(URL_USUARIO_SELECT, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});

  usuarios.data.forEach(usuario => {
    data.push({ value: usuario.id, text: `${usuario.nombres} ${usuario.apellidos}` })
    // if (estudiante.rol.id === 2) {
    //   data.push({ value: estudiante.id, text: `${estudiante.nombres} ${estudiante.apellidos}` })
    // }
  });

  // Agregar cada opción al select
  data.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.text;
    adminSelect.appendChild(opt);
  });
  adminSelect.addEventListener("change", async () => {
    if (sessionStorage.getItem("id_estudiante") !== adminSelect.value && adminSelect.value !== "") {
      sessionStorage.setItem("id_estudiante", adminSelect.value)
      const token_estudiante = await makeRequest(URL_USUARIO_LOGIN, 'POST', {}, { "id": adminSelect.value }, { 'Content-Type': 'application/json' }, null, {})
      sessionStorage.setItem("access_token_estudiante", token_estudiante.data.access_token)
      window.location.reload()
    }
  })
  if (sessionStorage.getItem("id_estudiante")) {
    adminSelect.value = sessionStorage.getItem("id_estudiante")
  }
}

document.addEventListener("DOMContentLoaded", onLoad);