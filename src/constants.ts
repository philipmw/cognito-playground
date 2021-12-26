// where you created the CloudFormation stack
export const AWS_REGION = "us-west-2";

// From CFN `UserPoolDomain`
export const USER_POOL_DOMAIN = "pmw-playground.auth.us-west-2.amazoncognito.com";

// From CFN `UserPool`
export const USER_POOL_ID = "us-west-2_uAhQbNf4O";
export const USER_POOL_ISSUER = `cognito-idp.us-west-2.amazonaws.com/${USER_POOL_ID}`;

// From CFN `IdentityPool`
export const IDENTITY_POOL_ID = "us-west-2:f989179b-9f1e-4678-8305-fae4c3c1dccc";

// From CFN `UserPoolWebLoginClient`
export const COGNITO_CLIENT_ID = "2cf4i1n72khqp4tcituchutf17";

// From Webpack's configuration. Also must match CFN config.
export const REDIRECT_URI = "http://localhost:8080";

// From CFN `VisitorCountDdbTable`
export const VISITOR_DDB_TABLE = "cognito-playground-VisitorCountDdbTable-1PDEX9GAXWLL6";

// From CFN `BackendApiInvokeUrl` output value
export const BACKEND_API_INVOKE_URL = "https://2m31yzk498.execute-api.us-west-2.amazonaws.com/prod";