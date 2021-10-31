// where you created the CloudFormation stack
export const AWS_REGION = "us-west-2";

// From CFN `UserPoolDomain`
export const USER_POOL_DOMAIN = "pmw-playground.auth.us-west-2.amazoncognito.com";

// From CFN `UserPool`
export const USER_POOL_ISSUER = "cognito-idp.us-west-2.amazonaws.com/us-west-2_LamooBtvG";

// From CFN `IdentityPool`
export const IDENTITY_POOL_ID = "us-west-2:1b085a7c-9074-4622-89a3-382d053e4f16";

// From CFN `UserPoolWebLoginClient`
export const COGNITO_CLIENT_ID = "4grii228b142b6if2a9rd4f3im";

// From Webpack's configuration. Also must match CFN config.
export const REDIRECT_URI = "http://localhost:8080";

// From CFN `VisitorCountDdbTable`
export const VISITOR_DDB_TABLE = "cognito-playground-VisitorCountDdbTable-5HYWH8CQSBTP";