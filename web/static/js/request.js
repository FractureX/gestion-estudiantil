import { showLoader, hideLoader } from './functions.js';

export async function makeRequest(baseUrl, method, params = {}, data = null, headers = {}, token = null, pathParams = {}) {
  // console.table({baseUrl, method, params, data, headers, token, pathParams});
  showLoader()
  // Reemplazar los parámetros de la ruta (path params) en la URL
  let url = baseUrl;

  // Reemplazar los valores de pathParams en la URL
  Object.keys(pathParams).forEach(key => {
    // Usar una expresión regular para reemplazar los valores de path {key}
    url = url.replace(`{${key}}`, pathParams[key]);
  });

  // Construir la URL con parámetros de consulta (query params)
  const urlObj = new URL(url);
  Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));

  // Establecer los encabezados predeterminados
  const defaultHeaders = {
    'Accept': 'application/json',
  };

  // Si se proporciona un token, agregarlo a los encabezados
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Fusionar encabezados predeterminados con los proporcionados
  const mergedHeaders = { ...defaultHeaders, ...headers };

  // Configurar las opciones de la solicitud
  const options = {
    method: method.toUpperCase(),
    headers: mergedHeaders,
    credentials: 'include', // Incluir cookies en la solicitud
  };

  // Si los datos son un FormData, no es necesario hacer JSON.stringify
  if (data instanceof FormData) {
    // Si los datos son un FormData, no necesitamos configurar Content-Type
    // ya que el navegador lo maneja automáticamente
    options.body = data;
  } else if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PATCH') {
    // Para POST o PATCH, si no es FormData, convertir los datos a JSON
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(urlObj, options);

    let responseData = null;
    if (response.status !== 204) {  // Solo intenta parsear JSON si hay contenido
      responseData = await response.json();
    }

    return {
      "status": response.status,
      "message": "",
      "data": responseData
    };
  } catch (error) {
    console.table(error);
    return {
      "status": 500,
      "message": `Hubo un problema con la operación fetch: ${error}`,
      "data": {}
    };
  } finally {
    hideLoader();
  }
}
