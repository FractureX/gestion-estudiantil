import {
  URL_USUARIO_SELECT_INFO,
  URL_DOCUMENTOS_PDF_CREATE,
  URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO_ID_MATERIA_PERIODO,
  URL_MATERIA_PERIODO_SELECT_BY_ID,
  URL_HISTORIAL_CREATE,
  URL_DOCUMENTOS_PDF_DELETE,
  URL_DOCUMENTOS_PDF_UPDATE,
  URL_EVALUACION_SELECT_BY_ID_DOCUMENTO_PDF
} from "./urls.js";
import { MENSAJE_CARGAR_PDF } from "./historial_data.js"
import { makeRequest } from "./request.js";
import { getCurrentDateTime } from "./utils.js";
import { getPagesPerWeek, getWeeksBetweenDates, showNotification } from "./functions.js";
import { DELETE_ERROR_MESSAGE, DELETE_MESSAGE, INSERT_ERROR_MESSAGE, REGISTRO_ELIMINAR, UPDATE_ERROR_MESSAGE } from './messages.js'

// Funcionalidad de arrastrar y soltar
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filesToUpload = document.getElementById('filesToUpload');
const uploadedFiles = document.getElementById('uploadedFiles');
const urlParams = new URLSearchParams(window.location.search);
const id_materia_periodo = urlParams.get('id_materia_periodo');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('border-primary');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('border-primary');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('border-primary');
  fileInput.files = e.dataTransfer.files;
  updateFilesToUpload("success", "Archivo(s) seleccionado(s) exitosamente");
});

fileInput.addEventListener('change', event => { updateFilesToUpload("success", "Archivo(s) seleccionado(s) exitosamente") });

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await uploadFiles();
  fileInput.value = '';
  updateFilesToUpload();
});

function removeFile(fileName) {
  const dt = new DataTransfer();
  for (let file of fileInput.files) {
    if (file.name !== fileName) {
      dt.items.add(file);
    }
  }
  fileInput.files = dt.files;
  updateFilesToUpload("error", "Archivo eliminado exitosamente");
}

function updateFilesToUpload(type = null, message = null) {
  filesToUpload.innerHTML = '';

  for (let file of fileInput.files) {
    const fileItem = document.createElement('div');
    fileItem.className = 'd-flex justify-content-between align-items-center bg-light p-2 rounded mb-2';
    fileItem.dataset.fileName = file.name;

    // Contenedor del nombre del archivo
    const fileContainer = document.createElement('div');
    fileContainer.className = 'd-flex align-items-center';

    const fileLabel = document.createElement('span');
    fileLabel.textContent = 'Nombre del archivo:';
    fileLabel.className = 'fw-bold me-2';

    const fileName = document.createElement('span');
    fileName.textContent = file.name;

    fileContainer.appendChild(fileLabel);
    fileContainer.appendChild(fileName);

    // Contenedor de fecha y páginas por semana (centrado)
    const dateTimeContainer = document.createElement('div');
    dateTimeContainer.className = 'd-flex flex-column align-items-center flex-grow-1 text-center';  // Cambié a align-items-center y text-center

    const dateLabel = document.createElement('span');
    dateLabel.textContent = 'Fecha de evaluación:';
    dateLabel.className = 'fw-bold mb-1';

    const dateTimeInput = document.createElement('input');
    dateTimeInput.type = 'datetime-local';
    dateTimeInput.className = 'form-control form-control-sm';
    dateTimeInput.style.maxWidth = '200px';

    // Establecer la fecha mínima como el día actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    dateTimeInput.min = minDateTime;

    // Contenedor para mostrar "Páginas por semana"
    const pagesContainer = document.createElement('span');
    pagesContainer.className = 'mt-2 fw-bold';
    pagesContainer.textContent = 'Páginas por semana: -';

    dateTimeContainer.appendChild(dateLabel);
    dateTimeContainer.appendChild(dateTimeInput);
    dateTimeContainer.appendChild(pagesContainer);

    // Evento para calcular y mostrar "Páginas por semana"
    dateTimeInput.addEventListener('change', async () => {
      const selectedDate = dateTimeInput.value;
      fileItem.dataset.selectedDate = selectedDate;

      // Calcular las semanas entre la fecha actual y la seleccionada
      let weeks = getWeeksBetweenDates(minDateTime, selectedDate);
      weeks = weeks === 0 ? 1 : weeks;
      console.log(`Semanas calculadas: ${weeks}`);

      // Obtener la URL del archivo
      const file = Array.from(fileInput.files).find(f => f.name === fileItem.dataset.fileName);
      if (file) {
        const fileURL = URL.createObjectURL(file);
        console.log(`Archivo seleccionado: ${file.name}`);

        // Obtener páginas por semana
        try {
          pagesContainer.textContent = `Páginas por semana: Cargando...`;
          const paginasPorSemana = await getPagesPerWeek(fileURL, weeks);
          if (paginasPorSemana !== null) {
            pagesContainer.textContent = `Páginas por semana: ${paginasPorSemana}`;
          } else {
            pagesContainer.textContent = 'Páginas por semana: Error al calcular';
          }
        } catch (error) {
          pagesContainer.textContent = 'Páginas por semana: Error al calcular';
        }
      }
    });

    // Botón de eliminar
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-sm btn-outline-danger';
    button.innerHTML = `<i class="bi bi-trash"></i> Eliminar`;
    button.addEventListener('click', () => removeFile(file.name));

    // Agregar elementos al contenedor principal
    fileItem.appendChild(fileContainer);
    fileItem.appendChild(dateTimeContainer);
    fileItem.appendChild(button);

    filesToUpload.appendChild(fileItem);
  }
  if (type && message) {
    showNotification(type, message)
  }
}

async function uploadFiles() {
  // Obtener la información del usuario
  const usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));
  const files = fileInput.files; // Obtenemos los archivos seleccionados
  if (files.length === 0) {
    showNotification("warning", "No hay archivo(s) seleccionado(s)")
    return;
  }

  // Mostrar la información de los archivos en la consola
  let i = 0;
  const fechaActualUTC = getCurrentDateTime();
  for (let file of files) {
    const fileItem = document.querySelector(`div[data-file-name="${file.name}"]`);
    const selectedDate = fileItem ? fileItem.dataset.selectedDate : null; // Obtener la fecha seleccionada

    if (!selectedDate) {
      showNotification("warning", `No se ha seleccionado una fecha para el archivo: ${file.name}`)
      continue; // Saltar este archivo si no tiene fecha seleccionada
    }
    i++
    const formData = new FormData();
    formData.append('usuario', usuario.data.id);
    formData.append('materia_periodo', id_materia_periodo);
    formData.append('archivo', file);
    formData.append('fecha_evaluacion', selectedDate); // Enviar la fecha seleccionada

    // Realizar la solicitud para cargar el archivo
    let response = await makeRequest(URL_DOCUMENTOS_PDF_CREATE, 'POST', {}, formData, {}, sessionStorage.getItem("access_token"));
    if (response.status !== 201) {
      showNotification("error", INSERT_ERROR_MESSAGE)
      return;
    }
    response = await makeRequest(URL_HISTORIAL_CREATE, 'POST', {}, { "usuario": usuario.data.id, "descripcion": `${MENSAJE_CARGAR_PDF} ${file.name}`, "fecha": fechaActualUTC }, { 'Content-Type': 'application/json' }, sessionStorage.getItem("access_token"));
    if (response.status !== 201) {
      showNotification("error", INSERT_ERROR_MESSAGE)
      return;
    }
  }

  if (i === files.length && i > 0) {
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    showNotification("success", "Archivo(s) guardado(s) de forma exitosa")
  }
}

async function loadData() {
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

  // Cargar información inicial
  const materia_periodo = await makeRequest(URL_MATERIA_PERIODO_SELECT_BY_ID, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), { id: id_materia_periodo });

  // Mostrar la materia en el HTML
  document.querySelector(".card-title").textContent = materia_periodo.data.materia.nombre;

  // Obtener los documentos PDF cargados para el usuario y materia_periodo, incluyendo el parámetro de ordenación
  const documentos_pdf = await makeRequest(URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO_ID_MATERIA_PERIODO, 'GET', {
    'usuario': userInfo.data.id,
    'materia-periodo': id_materia_periodo,
    'orden': document.querySelector("#sortSelect").value // Tomar el valor del select de ordenación
  }, null, {}, sessionStorage.getItem("access_token"));

  // Limpiar el contenedor de los archivos
  uploadedFiles.innerHTML = '';

  // Si el valor de 'orden' es 'nombre', ordenar los archivos por el nombre
  if (document.querySelector("#sortSelect").value === 'nombre') {
    // Ordenar por nombre del archivo
    documentos_pdf.data.sort((a, b) => {
      const nombreA = a.archivo.split('/').pop().toLowerCase(); // Extraer el nombre del archivo
      const nombreB = b.archivo.split('/').pop().toLowerCase(); // Extraer el nombre del archivo
      if (nombreA < nombreB) return -1;  // Orden ascendente
      if (nombreA > nombreB) return 1;   // Orden ascendente
      return 0;  // Si son iguales
    });
  }

  // Iterar sobre los documentos PDF ordenados y crear elementos para mostrarlos
  documentos_pdf.data.forEach(documento_pdf => {
    makeRequest(URL_EVALUACION_SELECT_BY_ID_DOCUMENTO_PDF, 'GET', {
      'documento_pdf': documento_pdf.id
    }, null, {}, sessionStorage.getItem("access_token")).then(evaluacion => {
      console.log(evaluacion.data);

      const archivoURL = documento_pdf.archivo;
      const nombreArchivo = archivoURL.split('/').pop();

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      uploadedFiles.innerHTML += `
        <div class="bg-light p-2 rounded mb-2" id="pdf-${documento_pdf.id}">
            <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold me-2">Nombre del archivo: <span class="fw-normal">${nombreArchivo}</span></span>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.open('${archivoURL}', '_blank')">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="modifyPDF(${documento_pdf.id})">
                        <i class="bi bi-pencil"></i> Modificar
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="deletePDF(${documento_pdf.id})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </div>

            <div id="edit-section-${documento_pdf.id}" class="mt-2 d-none">
                <input type="file" class="form-control mb-2" id="file-${documento_pdf.id}" name="file-${documento_pdf.id}">
                <input type="datetime-local" class="form-control mb-2" id="date-${documento_pdf.id}" name="date-${documento_pdf.id}" min="${minDateTime}">
                <input type="text" class="form-control mb-2" id="pages-${documento_pdf.id}" name="pages-${documento_pdf.id}" placeholder="Páginas por semana" value="Páginas por semana: -" disabled>
                <button type="button" class="btn btn-success" onclick="savePDF(${documento_pdf.id})">Guardar</button>
            </div>
        </div>
    `;

      // Obtener el input de fecha y el campo de páginas por semana
      const dateTimeInput = document.getElementById(`date-${documento_pdf.id}`);
      const pagesContainer = document.getElementById(`pages-${documento_pdf.id}`);

      // Evento para calcular "Páginas por semana" al seleccionar la fecha
      dateTimeInput.addEventListener('change', async () => {
        const selectedDate = dateTimeInput.value;
        const minDate = new Date(minDateTime);  // Create Date objects for comparison
        const selected = new Date(selectedDate);

        if (selected < minDate) {
          dateTimeInput.value = minDateTime;  // Reset the input to the min date
          return; // Stop further execution
        }

        let weeks = getWeeksBetweenDates(minDateTime, selectedDate);
        weeks = weeks === 0 ? 1 : weeks;

        console.log(`Semanas calculadas para ${documento_pdf.id}: ${weeks}`);

        try {
          pagesContainer.value = `Páginas por semana: Cargando...`;
          let paginasPorSemana = await getPagesPerWeek(archivoURL, weeks);
          paginasPorSemana = paginasPorSemana < 1 ? 1 : paginasPorSemana;
          pagesContainer.value = paginasPorSemana !== null
            ? `Páginas por semana: ${paginasPorSemana}`
            : 'Páginas por semana: Error al calcular';
        } catch (error) {
          pagesContainer.value = 'Páginas por semana: Error al calcular';
        }
      });
    });
  });
}

window.savePDF = async function (id) {
  console.log(`savePDF: ${id}`)
  const fileInput = document.getElementById(`file-${id}`);
  const dateInput = document.getElementById(`date-${id}`);
  const pagesInput = document.getElementById(`pages-${id}`);

  const selectedFile = fileInput.files[0];
  const evaluationDate = dateInput.value;
  const pagesPerWeek = pagesInput.value;

  console.log(`Guardando PDF ${id}:`, { selectedFile, evaluationDate, pagesPerWeek });

  // ------------------------------------------------------------------------------ //
  // Obtener la información del usuario
  const usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"));
  if (!selectedFile) {
    showNotification("warning", "No ha seleccionado el archivo")
    return;
  }
  if (!evaluationDate) {
    showNotification("warning", "No ha seleccionado la fecha")
    return;
  }

  const formData = new FormData();
  formData.append('usuario', usuario.data.id);
  formData.append('materia_periodo', id_materia_periodo);
  formData.append('archivo', selectedFile);
  formData.append('fecha_evaluacion', evaluationDate);

  console.table(formData)

  // Realizar la solicitud para cargar el archivo
  let response = await makeRequest(URL_DOCUMENTOS_PDF_UPDATE, 'PATCH', {}, formData, {}, sessionStorage.getItem("access_token"), { "id": id })
  if (response.status !== 200) {
    showNotification("error", UPDATE_ERROR_MESSAGE)
    return;
  }
  const fechaActualUTC = getCurrentDateTime();
  response = await makeRequest(URL_HISTORIAL_CREATE, 'POST', {}, { "usuario": usuario.data.id, "descripcion": `${MENSAJE_CARGAR_PDF} ${selectedFile.name}`, "fecha": fechaActualUTC }, { 'Content-Type': 'application/json' }, sessionStorage.getItem("access_token"));
  if (response.status !== 201) {
    showNotification("error", INSERT_ERROR_MESSAGE)
    return;
  }

  setTimeout(() => {
    window.location.reload();
  }, 3000);
  showNotification("success", "Archivo(s) guardado(s) de forma exitosa")
};

window.modifyPDF = async function (id) {
  console.log(`modifyPDF(${id})`)
  const editSection = document.getElementById(`edit-section-${id}`);
  editSection.classList.toggle("d-none");
};

window.deletePDF = async function (id) {
  const result = await window.confirmDeletion();
  if (result === 1) {
    const response = await makeRequest(URL_DOCUMENTOS_PDF_DELETE, 'DELETE', {}, null, {}, sessionStorage.getItem("access_token"), { "id": id })
    if (response.status === 204) {
      showNotification("success", DELETE_MESSAGE)
      setTimeout(() => {
        window.location.reload()
      }, 3000);
    } else {
      showNotification("error", DELETE_ERROR_MESSAGE)
    }
  }
};

document.addEventListener("DOMContentLoaded", loadData);
document.querySelector("#sortSelect").addEventListener("change", loadData)