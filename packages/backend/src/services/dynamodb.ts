import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { GameSession, GameStatus } from "../types";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE      = process.env["GAME_TABLE"]!;
const TTL_HOURS  = parseInt(process.env["GAME_TTL_HOURS"] ?? "2", 10);

interface CreateSessionInput {
  sessionId: string;
  imageUrl:  string;
  labels:    string[];
  firstHint: string;
}

export async function createSession(input: CreateSessionInput): Promise<GameSession> {
  const now = Date.now();
  const ttl = Math.floor(now / 1000) + TTL_HOURS * 3600;

  const item: GameSession = {
    sessionId:  input.sessionId,
    status:     "active",
    imageUrl:   input.imageUrl,
    labels:     input.labels,
    hints:      [input.firstHint],
    attempts:   [],
    createdAt:  now,
    ttl,
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function getSession(sessionId: string): Promise<GameSession | null> {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { sessionId } })
  );
  return (Item as GameSession) ?? null;
}

export async function recordAttempt(
  sessionId: string,
  guess: string,
  newStatus: GameStatus = "active"
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { sessionId },
      UpdateExpression: "SET attempts = list_append(attempts, :g), #s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":g": [guess], ":s": newStatus },
    })
  );
}

export async function addHint(sessionId: string, hint: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { sessionId },
      UpdateExpression: "SET hints = list_append(hints, :h)",
      ExpressionAttributeValues: { ":h": [hint] },
    })
  );
}

export async function markGivenUp(sessionId: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { sessionId },
      UpdateExpression: "SET #s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": "given_up" },
    })
  );
}
