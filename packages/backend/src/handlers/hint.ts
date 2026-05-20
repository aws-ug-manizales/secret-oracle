import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSession, addHint } from "../services/dynamodb.js";
import { generateHint } from "../services/bedrock.js";
import { ok, badRequest, notFound, conflict, serverError } from "../utils/response.js";
import type { HintResponse } from "../types";

const MAX_HINTS = 5;

export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        const sessionId = event.pathParameters?.["sessionId"];
        if (!sessionId) return badRequest("Missing sessionId in path.");

        const session = await getSession(sessionId);
        if (!session) return notFound(`Session '${ sessionId }' not found.`);
        if (session.status !== "active") {
            return conflict(
                `Game is already '${ session.status }'. Start a new game with POST /game.`
            );
        }

        const currentCount = session.hints.length;

        if (currentCount >= MAX_HINTS) {
            const response: HintResponse = {
                hint: session.hints[currentCount - 1]!,
                hintNumber: currentCount,
                hintsRemaining: 0,
                message: "No more hints available. Take your best guess!",
            };
            return ok(response);
        }

        const newHint = await generateHint(session.labels, session.hints, currentCount);
        await addHint(sessionId, newHint);

        const hintNumber = currentCount + 1;
        const response: HintResponse = {
            hint: newHint,
            hintNumber,
            hintsRemaining: MAX_HINTS - hintNumber,
        };

        return ok(response);
    } catch (err) {
        console.error("GET /hint error:", err);
        return serverError(err instanceof Error ? err.message : "Unknown error");
    }
}
