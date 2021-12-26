import {BACKEND_API_INVOKE_URL} from "./constants";

export function postToBackend(id_token): Promise<string> {
  const xhr = new XMLHttpRequest();

  return new Promise((promiseResolve, promiseReject) => {
    xhr.open("POST", `${BACKEND_API_INVOKE_URL}/`);
    xhr.setRequestHeader("Authorization", id_token);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status != 200) {
          promiseReject(`ERROR: Status code is ${xhr.status}, response text is ${xhr.responseText}`);
        }
        promiseResolve(xhr.responseText);
      }};
    xhr.send();
  });
}