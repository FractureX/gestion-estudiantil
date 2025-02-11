import {
  URL_USUARIO_SELECT_INFO,
  
} from "./urls.js";
import { makeRequest } from "./request.js";

async function onLoad() {
  const usuario = await makeRequest(URL_USUARIO_SELECT_INFO, 'GET', {}, null, {}, sessionStorage.getItem("access_token"), {});
  
}

document.addEventListener("DOMContentLoaded", onLoad);