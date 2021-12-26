import * as React from "react";
import * as ReactDOM from "react-dom";
import {useEffect, useState} from "react";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";

import {CognitoIdentityId, CognitoTokens, Creds, exchangeCodeForTokens, getCredsForId, getId} from "./cognito-utils";
import {
  AWS_REGION,
  COGNITO_CLIENT_ID,
  REDIRECT_URI,
  USER_POOL_DOMAIN,
} from "./constants";
import {getVisitorCount, registerVisitor} from "./visitor-count-utils";
import {recallTokens, saveTokens} from "./storage-utils";
import {postToBackend} from "./backend-utils";
import {getJwtSub} from "./jwt-utils";

const cognitoClient = new CognitoIdentityClient({
  region: AWS_REGION,
});

type VisitorCount = number | undefined;
type CognitoTokensResponse = CognitoTokens | undefined;

const App = () => {
  const [status, setStatus] = useState([] as string[]);

  const params = new URLSearchParams(window.location.search);
  // auth code from user pool login UX
  const code = params.get("code");

  // Cognito state
  const [tokens, setTokens] = useState(undefined as CognitoTokensResponse);
  const [cognitoId, setCognitoId] = useState(undefined as CognitoIdentityId);
  const [creds, setCreds] = useState(undefined as Creds);

  // Business logic
  const [visitorCount, setVisitorCount] = useState(undefined as VisitorCount);
  const [backendApiResponse, setBackendApiResponse] = useState("{initialState}");

  useEffect(() => {
    const recalledTokens = recallTokens();
    if (recalledTokens) {
      console.log("recalled tokens: " + recalledTokens);
      setTokens(JSON.parse(recalledTokens));
      setStatus(status.concat(["recalled tokens"]));
      return;
    }

    if (!code) {
      setStatus(status.concat(["no code in query param; log in first"]));
      return;
    }

    setStatus(status.concat(["exchanging code"]));
    exchangeCodeForTokens(code)
      .then(tokens => {
        setTokens(tokens);
        saveTokens(tokens);
      })
      .then(() => {
        setStatus(status.concat(["Cognito code exchanged for tokens"]));
      })
      .catch(e => {
        setStatus(status.concat(["Cognito exchange error: " + e.toString()]));
      })
  }, [code]);

  useEffect(() => {
    if (tokens?.id_token == undefined) {
      // nothing to do for now
      return;
    }
    getId(cognitoClient, tokens.id_token)
      .then(setCognitoId)
      .catch(e => {
        setStatus(status.concat(["Cognito getId error: " + e.toString()]));
      });
  }, [tokens]);

  useEffect(() => {
    if (cognitoId == undefined || tokens?.id_token == undefined) {
      // nothing to do for now
      return;
    }
    getCredsForId(cognitoClient, cognitoId, tokens.id_token)
      .then(setCreds)
      .catch(e => {
        setStatus(status.concat(["Cognito get credentials error: " + e.toString()]));
      });
  }, [cognitoId, tokens]);

  useEffect(() => {
    if (creds?.AccessKeyId == undefined) {
      // nothing to do for now
      return;
    }
    registerVisitor(creds, cognitoId)
      .then(() => {
        setStatus(status.concat([`added visit to DDB using IAM access key ${creds.AccessKeyId}`]));
      })
      .catch(e => {
        setStatus(status.concat(["DDB update error: " + e]));
      });
  },
  [creds, cognitoId]);

  useEffect(() => {
    if (creds?.AccessKeyId == undefined || cognitoId == undefined) {
      // nothing to do for now
      return;
    }
    getVisitorCount(creds, cognitoId)
      .then(setVisitorCount);
  }, [creds, cognitoId]);

  useEffect(() => {
    postToBackend(tokens?.id_token)
      .then(setBackendApiResponse)
      .catch(setBackendApiResponse);
  }, [tokens]);

  const loggedInDisplay = tokens ?
    <div>
      <p>Welcome back!
        Your user pool ID is <b>{getJwtSub(tokens.id_token)}</b> and identity pool ID is <b>{cognitoId}</b>.</p>
    </div> :
    <p><a href={`https://${USER_POOL_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${REDIRECT_URI}`}>Log in</a></p>

  return <div>
    { loggedInDisplay }
    <p>Progress:</p>
    <ol>
      {status.map(statusLine => <li key={statusLine}>{statusLine}</li>)}
    </ol>
    <p id="ddb">Visitor count from a client-side DynamoDB read: {visitorCount}</p>
    <p id="backend">Response from an authenticated HTTP POST request: {backendApiResponse}</p>
  </div>;
}

ReactDOM.render(
  <App/>,
  document.getElementById("app-root")
);
