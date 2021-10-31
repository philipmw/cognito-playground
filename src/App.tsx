import * as React from "react";
import * as ReactDOM from "react-dom";
import {useEffect, useState} from "react";
import {
  CognitoIdentityClient,
  Credentials,
  GetCredentialsForIdentityCommand,
  GetIdCommand
} from "@aws-sdk/client-cognito-identity";

import {CognitoTokens, exchangeCodeForTokens} from "./cognito-utils";
import {
  AWS_REGION,
  COGNITO_CLIENT_ID,
  IDENTITY_POOL_ID,
  REDIRECT_URI,
  USER_POOL_DOMAIN,
  USER_POOL_ISSUER
} from "./constants";
import {getVisitorCount, registerVisitor} from "./visitor-count-utils";
import {recallTokens, saveTokens} from "./storage-utils";

const cognitoClient = new CognitoIdentityClient({
  region: AWS_REGION,
});

type CognitoIdentityId = string | undefined;
type VisitorCount = number | undefined;

async function getId(idToken): Promise<CognitoIdentityId> {
  const command = new GetIdCommand({
    IdentityPoolId: IDENTITY_POOL_ID,
    Logins: {
      [USER_POOL_ISSUER]: idToken,
    },
  });
  const response = await cognitoClient.send(command);
  return response.IdentityId;
}

type Creds = Credentials | undefined;
async function getCredsForId(id, idToken): Promise<Creds> {
  const command = new GetCredentialsForIdentityCommand({
    IdentityId: id,
    Logins: {
      [USER_POOL_ISSUER]: idToken,
    },
  });
  const response = await cognitoClient.send(command);
  return response.Credentials;
}

const App = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const [status, setStatus] = useState("init");
  const [tokens, setTokens] = useState({} as CognitoTokens);
  const [cognitoId, setCognitoId] = useState(undefined as CognitoIdentityId);
  const [creds, setCreds] = useState({} as Creds);
  const [visitorCount, setVisitorCount] = useState(undefined as VisitorCount);

  useEffect(() => {
    const recalledTokens = recallTokens();
    if (recalledTokens) {
      console.log("recalled tokens: " + recalledTokens);
      setTokens(JSON.parse(recalledTokens));
      setStatus("recalled tokens");
      return;
    }

    if (!code) {
      setStatus("no code in query param; log in first");
      return;
    }

    setStatus("exchanging code");
    exchangeCodeForTokens(code)
      .then(tokens => {
        setTokens(tokens);
        saveTokens(tokens);
      })
      .then(() => {
        setStatus("code exchanged for tokens");
      })
      .catch(e => {
        setStatus("Cognito exchange error: " + e.toString());
      })
  }, [code]);

  useEffect(() => {
    if (tokens.id_token == undefined) {
      // nothing to do for now
      return;
    }
    getId(tokens.id_token)
      .then((id) => setCognitoId(id))
      .catch(e => {
        setStatus("Cognito getId error: " + e.toString());
      });
  }, [tokens]);

  useEffect(() => {
    if (cognitoId == undefined || tokens.id_token == undefined) {
      // nothing to do for now
      return;
    }
    getCredsForId(cognitoId, tokens.id_token)
      .then(setCreds)
      .catch(e => {
        setStatus("Cognito get credentials error: " + e.toString());
      });
  }, [cognitoId, tokens]);

  useEffect(() => {
    if (creds?.AccessKeyId == undefined) {
      // nothing to do for now
      return;
    }
    registerVisitor(creds, cognitoId)
      .then(() => {
        setStatus("added visit to DDB");
      })
      .catch(e => {
        setStatus("DDB update error: " + e);
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

  const loggedInDisplay = cognitoId ?
    <p>Welcome back, {cognitoId}</p> :
    <p><a href={`https://${USER_POOL_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${REDIRECT_URI}`}>Log in</a></p>

  return <div>
    { loggedInDisplay }
    <p>Status: {status}</p>
    <p>Visitor count: {visitorCount}</p>
  </div>;
}

ReactDOM.render(
  <App/>,
  document.getElementById("app-root")
);
