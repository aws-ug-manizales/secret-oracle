import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { JudgeResult } from "../types";

const bedrock = new BedrockRuntimeClient({});
const MODEL_ID = process.env["BEDROCK_MODEL_ID"]!;

interface BedrockMessage {
    role: "user" | "assistant";
    content: string;
}

interface BedrockResponseBody {
    content?: Array<{ type: string; text?: string }>;
}

async function invoke(systemPrompt: string, userPrompt: string): Promise<string> {
    const messages: BedrockMessage[] = [{ role: "user", content: userPrompt }];

    const body = JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 512,
        system: systemPrompt,
        messages,
    });

    const { body: responseStream } = await bedrock.send(
        new InvokeModelCommand({
            modelId: MODEL_ID,
            contentType: "application/json",
            accept: "application/json",
            body: Buffer.from(body),
        })
    );

    const parsed = JSON.parse(
        Buffer.from(responseStream).toString("utf-8")
    ) as BedrockResponseBody;

    return parsed.content?.[0]?.text ?? "";
}


// ── Prompts ───────────────────────────────────────────────────────────────

const SYSTEM_HINT = `Eres el Oráculo Secreto, un ser místico y cómico que guarda celosamente sus secretos.
Tienes una imagen secreta descrita por etiquetas. Tu misión: generar una pista breve, creativa y en español.
Reglas estrictas:
- Jamás menciones la palabra exacta ni sinónimos obvios.
- Máximo 12 palabras.
- Tono divertido y misterioso, como un oráculo que disfruta confundir a los mortales.
- Nunca menciones Rekognition, AWS ni ningún servicio tecnológico.
- Responde ÚNICAMENTE con el texto de la pista, sin explicaciones ni preámbulos.

La dificultad va de 1 a 5, donde 1 = pista muy críptica (difícil adivinar) y 5 = pista más directa (fácil adivinar).`;

const SYSTEM_JUDGE = `Eres el Oráculo Secreto, un ser místico y cómico con poderes de adivinación.
Debes decidir si la palabra del jugador describe correctamente la imagen secreta (dada por etiquetas).
Una respuesta es CORRECTA si identifica claramente el sujeto principal, incluso con variantes ortográficas o sinónimos cercanos.

Reglas estrictas:
- Responde como un oráculo místico y cómico — nunca como un sistema de software.
- Jamás menciones Rekognition, AWS, etiquetas ni la respuesta correcta.
- Máximo 190 caracteres en tu feedback.
- Una o dos frases como máximo.
- Solo puedes dar UNA respuesta: correcto o incorrecto, nunca ambas.

Responde ÚNICAMENTE con un JSON válido:
{"correct": true,  "feedback": "<frase mística celebrando al jugador>"}
{"correct": false, "feedback": "<frase mística animando a seguir, sin revelar la respuesta>"}
Sin markdown, sin texto extra.`;


/**
 * Generate a hint. Difficulty decreases as the hintIndex increases.
 */
export async function generateHint(
    labels: string[],
    usedHints: string[],
    hintIndex: number
): Promise<string> {
    const difficulty = Math.min(hintIndex + 1, 5);

    const previousBlock =
        usedHints.length > 0
            ? `\nPistas ya reveladas:\n${ usedHints.map((h, i) => `${ i + 1 }. ${ h }`).join("\n") }\nNO repitas información de pistas anteriores.`
            : "";

    const userPrompt =
        `Etiquetas de la imagen: ${ labels.join(", ") }\n` +
        `Nivel de dificultad: ${ difficulty }${ previousBlock }\n\n` +
        `Genera la pista ahora:`;

    return invoke(SYSTEM_HINT, userPrompt);
}

/**
 * Validate a player guess against the image labels and game context.
 */
export async function validateGuess(
    labels: string[],
    hints: string[],
    attempts: string[],
    guess: string
): Promise<JudgeResult> {
    const userPrompt =
        `Etiquetas de la imagen: ${ labels.join(", ") }\n` +
        `Pistas reveladas: ${ hints.join(" | ") }\n` +
        `Intentos anteriores: ${ attempts.join(", ") || "ninguno" }\n` +
        `Respuesta del jugador: "${ guess }"\n\n` +
        `¿Es correcta la respuesta?`;

    const raw = await invoke(SYSTEM_JUDGE, userPrompt);

    try {
        return JSON.parse(raw) as JudgeResult;
    } catch {
        const correct =
            raw.toLowerCase().includes('"correct":true') ||
            raw.toLowerCase().includes('"correct": true');
        return { correct, feedback: correct ? undefined : "¡Los astros aún no se alinean, mortal!" };
    }
}
