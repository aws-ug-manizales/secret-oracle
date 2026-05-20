import type { APIGatewayProxyResult } from "aws-lambda";

const respond = (statusCode: number, body: unknown): APIGatewayProxyResult => {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        body: JSON.stringify(body),
    };
}

export const ok = (body: unknown) => respond(200, body);
export const created = (body: unknown) => respond(201, body);
export const badRequest = (message: string) => respond(400, { error: message });
export const notFound = (message = "Not found") => respond(404, { error: message });
export const conflict = (message: string) => respond(409, { error: message });
export const serverError = (message = "Internal server error") => respond(500, { error: message });
