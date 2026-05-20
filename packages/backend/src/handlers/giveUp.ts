import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSession, markGivenUp } from "../services/dynamodb.js";
import { ok, badRequest, notFound, conflict, serverError } from "../utils/response.js";
import type { GiveUpResponse } from "../types";

export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        const sessionId = event.pathParameters?.["sessionId"];
        if (!sessionId) return badRequest("Missing sessionId in path.");

        const session = await getSession(sessionId);
        if (!session) return notFound(`Session '${ sessionId }' not found.`);
        if (session.status !== "active") {
            return conflict(`Game is already '${ session.status }'. Nothing to give up on.`);
        }

        await markGivenUp(sessionId);

        const response: GiveUpResponse = {
            message: "The Oracle reveals its secret.",
            imageUrl: session.imageUrl,
            labels: session.labels,
            hints: session.hints,
            attempts: session.attempts,
        };

        return ok(response);
    } catch (err) {
        console.error("POST /give-up error:", err);
        return serverError(err instanceof Error ? err.message : "Unknown error");
    }
}
