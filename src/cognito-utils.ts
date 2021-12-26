import {COGNITO_CLIENT_ID, IDENTITY_POOL_ID, REDIRECT_URI, USER_POOL_DOMAIN, USER_POOL_ISSUER} from "./constants";
import {Credentials, GetCredentialsForIdentityCommand, GetIdCommand} from "@aws-sdk/client-cognito-identity";

export type CognitoIdentityId = string | undefined;
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

export async function getId(cognitoClient, idToken): Promise<CognitoIdentityId> {
    const command = new GetIdCommand({
        IdentityPoolId: IDENTITY_POOL_ID,
        Logins: {
            [USER_POOL_ISSUER]: idToken,
        },
    });
    const response = await cognitoClient.send(command);
    console.log(`Cognito GetId response: ${JSON.stringify(response)}`);
    return response.IdentityId;
}

export type Creds = Credentials | undefined;
export async function getCredsForId(cognitoClient, id, idToken): Promise<Creds> {
    const command = new GetCredentialsForIdentityCommand({
        IdentityId: id,
        Logins: {
            [USER_POOL_ISSUER]: idToken,
        },
    });
    const response = await cognitoClient.send(command);
    console.log(`Cognito GetCredentialsForIdentity response: ${JSON.stringify(response)}`);
    return response.Credentials;
}

