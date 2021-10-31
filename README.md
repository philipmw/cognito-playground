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
2. A simple React webapp that accepts the auth code from Cognito user pool's web login
    endpoint, exchanges the code for JWT tokens, then requests an identity pool ID and
    short-term AWS credentials to interact with other AWS services (DynamoDB in our case).

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

Voila!

## Limitations and next steps

1. While the app remembers and recalls the JWT tokens, it does not have logic to handle
   expired tokens.
   For now, it simply sets the cookie to expire simultaneously with JWTs.
