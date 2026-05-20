import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSession, recordAttempt } from "../services/dynamodb.js";
import { validateGuess } from "../services/bedrock.js";
import { ok, badRequest, notFound, conflict, serverError } from "../utils/response.js";
import type { GuessBody, GuessResponse } from "../types";

export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        const sessionId = event.pathParameters?.["sessionId"];
        if (!sessionId) return badRequest("Missing sessionId in path.");

        const body = JSON.parse(event.body ?? "{}") as Partial<GuessBody>;
        const guess = (body.guess ?? "").trim();
        if (!guess) return badRequest("Body must include a non-empty 'guess' field.");

        const session = await getSession(sessionId);
        if (!session) return notFound(`Session '${ sessionId }' not found.`);
        if (session.status !== "active") {
            return conflict(
                `Game is already '${ session.status }'. Start a new game with POST /game.`
            );
        }

        const { correct, feedback } = await validateGuess(
            session.labels,
            session.hints,
            session.attempts,
            guess
        );

        await recordAttempt(sessionId, guess, correct ? "won" : "active");

        const response: GuessResponse = correct
            ? {
                correct: true,
                message: "🎉 Correct! The Oracle reveals its secret.",
                imageUrl: session.imageUrl,
                labels: session.labels,
                totalAttempts: session.attempts.length + 1,
            }
            : {
                correct: false,
                feedback: feedback ?? "Not quite. Try again!",
                attempts: session.attempts.length + 1,
                hintsAvailable: true,
            };

        return ok(response);
    } catch (err) {
        console.error("POST /guess error:", err);
        return serverError(err instanceof Error ? err.message : "Unknown error");
    }
}
