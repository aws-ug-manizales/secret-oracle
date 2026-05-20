import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handler as newGame } from "./handlers/game.js";
import { handler as guess } from "./handlers/guess.js";
import { handler as hint } from "./handlers/hint.js";
import { handler as giveUp } from "./handlers/giveUp.js";
import { badRequest, notFound } from "./utils/response.js";

type RouteHandler = (
    event: APIGatewayProxyEvent,
    context: Context
) => Promise<APIGatewayProxyResult>;


const ROUTES: Record<string, RouteHandler> = {
    "POST /game": newGame,
    "POST /game/{sessionId}/guess": guess,
    "GET /game/{sessionId}/hint": hint,
    "POST /game/{sessionId}/give-up": giveUp,
};

export async function handler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    const method = event.httpMethod;
    const resource = event.resource;

    if (!method || !resource) {
        return badRequest("Malformed request: missing httpMethod or resource.");
    }

    const routeKey = `${ method } ${ resource }`;
    const routeHandler = ROUTES[routeKey];

    if (!routeHandler) {
        return notFound(`Route not found: ${ routeKey }`);
    }

    return routeHandler(event, context);
}
