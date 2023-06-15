import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "tasks";

export const handler = async (event) => {
  console.log("event ===>", event);

  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    switch (event.routeKey) {
      case "GET /tasks":
        body = await dynamo.send(new ScanCommand({ TableName: tableName }));
        body = body.Items;
        break;
      case "POST /tasks":
        let request = JSON.parse(event.body);
        const response = await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              id: request.id,
              title: request.title,
              description: request.description,
              createdAt: new Date().toISOString(),
            },
          })
        );
        console.log("response ===> ", response);
        body = `Put task ${request.id}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
      case "DELETE /tasks/{id}":
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              id: parseInt(event.pathParameters.id),
            },
          })
        );
        body = `Deleted task ${event.pathParameters.id}`;
        break;
      case "GET /tasks/{id}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              id: parseInt(event.pathParameters.id),
            },
          })
        );
        body = body.Item;
        break;
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
