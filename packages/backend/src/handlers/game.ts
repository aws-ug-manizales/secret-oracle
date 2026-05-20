import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { getRandomImagePresignedUrl } from "../services/imageApi.js";
import { detectLabels } from "../services/rekognition.js";
import { generateHint } from "../services/bedrock.js";
import { createSession } from "../services/dynamodb.js";
import { created, serverError } from "../utils/response.js";
import type { NewGameResponse } from "../types";

export async function handler(
    _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        const sessionId = uuidv4();

        const imageUrl = await getRandomImagePresignedUrl();
        const labels = await detectLabels(imageUrl);

        if (labels.length === 0) {
            return serverError("Could not extract labels from the image.");
        }

        const firstHint = await generateHint(labels, [], 0);
        await createSession({ sessionId, imageUrl, labels, firstHint });

        const body: NewGameResponse = {
            sessionId,
            hint: firstHint,
            message: "Game started! Make your first guess.",
        };

        return created(body);
    } catch (err) {
        console.error("POST /game error:", err);
        return serverError(err instanceof Error ? err.message : "Unknown error");
    }
}
