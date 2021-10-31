import {COGNITO_CLIENT_ID, REDIRECT_URI, USER_POOL_DOMAIN} from "./constants";

export interface CognitoTokens {
    id_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

// I am surprised there is no AWS SDK API for this, but I couldn't find it.
// So I do it manually, as documented here:
// https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
export function exchangeCodeForTokens(code): Promise<CognitoTokens> {
    const bodyParams = new URLSearchParams();
    bodyParams.append("grant_type", "authorization_code");
    bodyParams.append("client_id", COGNITO_CLIENT_ID);
    bodyParams.append("code", code);
    bodyParams.append("redirect_uri", REDIRECT_URI);

    const xhr = new XMLHttpRequest();

    return new Promise((promiseResolve, promiseReject) => {
        xhr.open("POST", `https://${USER_POOL_DOMAIN}/oauth2/token`);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status != 200) {
                    promiseReject(new Error(`Status code is ${xhr.status}, response text is ${xhr.responseText}`));
                }
                promiseResolve(JSON.parse(xhr.responseText));
            }};
        xhr.send(bodyParams.toString());
    });
}