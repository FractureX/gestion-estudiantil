import { showLoader, hideLoader } from './functions.js';

export async function makeRequest(baseUrl, method, params = {}, data = null, headers = {}, token = null, pathParams = {}) {
  showLoader();

  let url = baseUrl;

  Object.keys(pathParams).forEach(key => {
    url = url.replace(`{${key}}`, pathParams[key]);
  });

  const urlObj = new URL(url);
  Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));

  const defaultHeaders = {
    'Accept': '*/*',  // Aceptar cualquier tipo de contenido
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedHeaders = { ...defaultHeaders, ...headers };

  const options = {
    method: method.toUpperCase(),
    headers: mergedHeaders,
    credentials: 'include',
  };

  if (data instanceof FormData) {
    options.body = data;
  } else if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PATCH') {
    options.body = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(urlObj, options);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');

    if (contentType && contentType.includes('application/json')) {
      return {
        status: response.status,
        message: '',
        data: await response.json()
      };
    } else {
      // Respuesta binaria (archivo)
      return {
        status: response.status,
        message: '',
        data: await response.blob()  // Descargar como blob
      };
    }
  } catch (error) {
    console.table(error);
    return {
      status: 500,
      message: `Hubo un problema con la operación fetch: ${error.message}`,
      data: {}
    };
  } finally {
    hideLoader();
  }
}

