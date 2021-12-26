# Philip's playground for Amazon Cognito #

## What it does

This is a proof of concept web app that supports authenticating users.

The app supports tracking the number of times each logged-in user has visited the web app,
keyed by each visitor's unique ID.

This app does not have its own dedicated backend service; it talks to AWS services directly
using credentials it receives from Cognito.
The app uses [IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html) policies
to restrict what AWS operations the logged-in user can do.

This project has two parts:

1. A CloudFormation template that sets up the Amazon Cognito user pool, identity pool,
    a DynamoDB table for visit tracking, and IAM roles and policies.
2. A React webapp that accepts the auth code from Cognito user pool's web login endpoint,
    exchanges the code for JWT tokens, then requests an identity pool ID and short-term
    AWS credentials to interact with services.

## Identifiers

There are two identifiers: *identity pool* ID and *user pool* ID.

The webapp first authenticates with a user pool (getting a user pool ID),
then receives an identity pool ID.
It uses JWT authorization for backend API calls (API Gateway), which means
the backend gets the *user pool* ID.
But it uses IAM authorization for client-side DynamoDB calls, which means
DynamoDB receives and keys items on the *identity pool* ID.

I'd like to standardize on one ID.

**Option 1:**
Convert the API Gateway endpoint to use IAM auth instead of JWT auth.
Then the webapp can use the *identity pool* ID exclusively.

**Option 2:**
Do not make client-side DynamoDB calls; instead, all operations go through my API endpoint.
Or find a way to receive STS credentials from the user pool rather than identity pool;
I did some research and didn't find a way to do it. Only [this AWS forums thread](https://forums.aws.amazon.com/thread.jspa?threadID=230067)
implies that it's possible.
Then the webapp can use the *user pool* ID exclusively.

## Setup

1. Create a CloudFormation stack using the `cloudformation-stack.yml` template.
2. Update `src/constants.ts` with the values from your CFN stack.
3. Create a user in the Cognito user pool. I did this manually through the AWS Management Console.
4. `npm install`

## Usage

1. `npm start` to start the local instance of this webapp.
2. Look for and click the "Log in" link.
    The presence of this link indicates that the app does not have JWT tokens for you.
3. Once redirected back to the local webapp, look for:

   > Status: added visit to DDB
   > 
   > Welcome back, {ID}
   > 
   > Visitor count: {some number}

4. Refresh several times. Feel free to remove the `code` query param.
    The app remembers you, and the visit counter goes up.
5. Try changing the primary key (`userId`) of the DDB *UpdateItem*.
    A different primary key will fail, because we have an IAM policy on the
    authenticated role that allows only updates to the item keyed by its own
    identity.

Testing the backend API authorization:

1. `curl -v -X POST {API-endpoint}` -- verify you get a HTTP 401 status code response.
2. Get the `id_token` value from the browser's `tokens` cookie.
3. `curl -v -X POST -H "Authorization: {id_token}" {API-endpoint}` -- returns HTTP 200 status code.

Voila!

## Limitations and next steps

1. While the app remembers and recalls the JWT tokens, it does not have logic to handle
   expired tokens.
   For now, it simply sets the cookie to expire simultaneously with JWTs.
   When the token expires, Cognito token exchange returns status code 400 with response text:
   > {"error":"invalid_grant"}
   
2. There are two identifiers. See the *Identifiers* section above.
   I want to standardize on one identifier.