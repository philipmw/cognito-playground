import {DynamoDBClient, GetItemCommand, UpdateItemCommand} from "@aws-sdk/client-dynamodb";
import {AWS_REGION, VISITOR_DDB_TABLE} from "./constants";

function getDdbClient(credentials) {
  // I don't understand this, but the `Credentials` object
  // I get from Cognito Identity Pool is not compatible with
  // the `credentials` expected by DynamoDB Client --
  // I need to rename the attributes.
  return new DynamoDBClient({
    credentials: {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretKey,
      sessionToken: credentials.SessionToken,
    },
    region: AWS_REGION,
  });
}

export async function getVisitorCount(credentials, myId): Promise<number|undefined> {
  const ddbClient = getDdbClient(credentials);
  const command = new GetItemCommand({
    Key: {
      userId: {"S": myId},
    },
    TableName: VISITOR_DDB_TABLE,
  });
  const response = await ddbClient.send(command);
  const ddbItem = response?.Item;
  const counterAttr = ddbItem ? ddbItem["counter"] : undefined;
  const rawCount = counterAttr ? counterAttr["N"] : undefined;
  return rawCount ? Number(rawCount) : undefined;
}

export async function registerVisitor(credentials, myId) {
  const ddbClient = getDdbClient(credentials);

  const command = new UpdateItemCommand({
    ExpressionAttributeNames: {
      "#counter": "counter",
    },
    ExpressionAttributeValues: {
      ":countAdd": {
        "N": "1",
      },
    },
    Key: {
      userId: {"S": myId},
    },
    TableName: VISITOR_DDB_TABLE,
    UpdateExpression: "ADD #counter :countAdd"
  });
  return await ddbClient.send(command);
}
