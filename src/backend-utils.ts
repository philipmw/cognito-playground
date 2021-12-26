import HmacSHA256 from "crypto-js/hmac-sha256";
import SHA256 from "crypto-js/sha256";
import {Credentials} from "@aws-sdk/client-cognito-identity";

import {AWS_REGION, BACKEND_API_INVOKE_URL} from "./constants";

export function makeHttpJwtRequest(id_token): Promise<string> {
  const xhr = new XMLHttpRequest();

  return new Promise((promiseResolve, promiseReject) => {
    xhr.open("GET", `${BACKEND_API_INVOKE_URL}/jwt`);
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

function getDateStamp(d: Date): string {
  const yr = d.getUTCFullYear().toString().padStart(2, "0");
  const mon = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${yr}${mon}${day}`;
}

function getAmzDateString(d: Date): string {
  const hr = d.getUTCHours().toString().padStart(2, "0");
  const min = d.getUTCMinutes().toString().padStart(2, "0");
  const sec = d.getUTCSeconds().toString().padStart(2, "0");
  return `${getDateStamp(d)}T${hr}${min}${sec}Z`
}

// adapted from https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = HmacSHA256(dateStamp, "AWS4" + key);
  const kRegion = HmacSHA256(regionName, kDate);
  const kService = HmacSHA256(serviceName, kRegion);
  const kSigning = HmacSHA256("aws4_request", kService);
  return kSigning;
}

export async function makeHttpSigv4Request(creds: Credentials): Promise<string> {
  const sessionToken = creds.SessionToken || "";

  // Following https://docs.aws.amazon.com/general/latest/gr/sigv4-signed-request-examples.html
  // Task 1
  const d = new Date();
  const dateStamp = getDateStamp(d);
  const httpReqMethod = "GET";
  const amzDate = getAmzDateString(d);
  const host = "2m31yzk498.execute-api.us-west-2.amazonaws.com";
  const headers = [
    // must be sorted by header name
    `host:${host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-security-token:${sessionToken}`,
  ];
  const signedHeaders = "host;x-amz-date;x-amz-security-token";
  const canonicalQuery = "";
  const signedPayload = SHA256(canonicalQuery);
  const canonicalUri = "/prod/iam";
  const canonicalReq = `${httpReqMethod}\n${canonicalUri}\n${canonicalQuery}\n${headers.join("\n")}\n\n${signedHeaders}\n${signedPayload}`;

  // Task 2
  const algorithm = "AWS4-HMAC-SHA256";
  const credScope = `${dateStamp}/${AWS_REGION}/execute-api/aws4_request`;
  const canonicalDigest = SHA256(canonicalReq);
  const stringToSign = `${algorithm}\n${amzDate}\n${credScope}\n${canonicalDigest}`;

  // Task 3
  const signingKey = getSignatureKey(creds.SecretKey, dateStamp, AWS_REGION, "execute-api");
  const signature = HmacSHA256(stringToSign, signingKey);

  // Task 4
  const authorizationHeader = `${algorithm} Credential=${creds.AccessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const xhr = new XMLHttpRequest();
  return new Promise((promiseResolve, promiseReject) => {
    xhr.open("GET", `${BACKEND_API_INVOKE_URL}/iam`);
    xhr.setRequestHeader("Authorization", authorizationHeader);
    xhr.setRequestHeader("X-Amz-Date", amzDate);
    xhr.setRequestHeader("X-Amz-Security-Token", sessionToken);
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