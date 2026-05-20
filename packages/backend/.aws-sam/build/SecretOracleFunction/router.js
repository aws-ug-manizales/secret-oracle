"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// router.ts
var router_exports = {};
__export(router_exports, {
  handler: () => handler5
});
module.exports = __toCommonJS(router_exports);

// ../../../node_modules/uuid/dist-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// ../../../node_modules/uuid/dist-node/rng.js
var rnds8 = new Uint8Array(16);
function rng() {
  return crypto.getRandomValues(rnds8);
}

// ../../../node_modules/uuid/dist-node/v4.js
function v4(options, buf, offset) {
  if (!buf && !options && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return _v4(options, buf, offset);
}
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// services/imageApi.ts
async function getRandomImagePresignedUrl() {
  const apiUrl = process.env["RANDOM_IMAGE_API_URL"];
  if (!apiUrl) throw new Error("RANDOM_IMAGE_API_URL env var is not set");
  const response = await fetch(apiUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error(
      `Random Image API error: ${response.status} ${response.statusText}`
    );
  }
  const body = await response.json();
  const url = body.url ?? body.presignedUrl;
  if (!url) {
    throw new Error(
      `Random Image API response missing 'url' field: ${JSON.stringify(body)}`
    );
  }
  return url;
}

// services/rekognition.ts
var import_client_rekognition = require("@aws-sdk/client-rekognition");
var rekognition = new import_client_rekognition.RekognitionClient({});
async function detectLabels(presignedUrl, minConfidence = 80) {
  const response = await fetch(presignedUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image: ${response.status} ${response.statusText}`
    );
  }
  const imageBytes = new Uint8Array(await response.arrayBuffer());
  const { Labels = [] } = await rekognition.send(
    new import_client_rekognition.DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 20,
      MinConfidence: minConfidence
    })
  );
  return Labels.map((l) => l.Name).filter((n) => Boolean(n));
}

// services/bedrock.ts
var import_client_bedrock_runtime = require("@aws-sdk/client-bedrock-runtime");
var bedrock = new import_client_bedrock_runtime.BedrockRuntimeClient({});
var MODEL_ID = process.env["BEDROCK_MODEL_ID"];
async function invoke(systemPrompt, userPrompt) {
  const messages = [{ role: "user", content: userPrompt }];
  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 512,
    system: systemPrompt,
    messages
  });
  const { body: responseStream } = await bedrock.send(
    new import_client_bedrock_runtime.InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: Buffer.from(body)
    })
  );
  const parsed = JSON.parse(
    Buffer.from(responseStream).toString("utf-8")
  );
  return parsed.content?.[0]?.text ?? "";
}
var SYSTEM_HINT = `Eres el Or\xE1culo Secreto, un ser m\xEDstico y c\xF3mico que guarda celosamente sus secretos.
Tienes una imagen secreta descrita por etiquetas. Tu misi\xF3n: generar una pista breve, creativa y en espa\xF1ol.
Reglas estrictas:
- Jam\xE1s menciones la palabra exacta ni sin\xF3nimos obvios.
- M\xE1ximo 12 palabras.
- Tono divertido y misterioso, como un or\xE1culo que disfruta confundir a los mortales.
- Nunca menciones Rekognition, AWS ni ning\xFAn servicio tecnol\xF3gico.
- Responde \xDANICAMENTE con el texto de la pista, sin explicaciones ni pre\xE1mbulos.

La dificultad va de 1 a 5, donde 1 = pista muy cr\xEDptica (dif\xEDcil adivinar) y 5 = pista m\xE1s directa (f\xE1cil adivinar).`;
var SYSTEM_JUDGE = `Eres el Or\xE1culo Secreto, un ser m\xEDstico y c\xF3mico con poderes de adivinaci\xF3n.
Debes decidir si la palabra del jugador describe correctamente la imagen secreta (dada por etiquetas).
Una respuesta es CORRECTA si identifica claramente el sujeto principal, incluso con variantes ortogr\xE1ficas o sin\xF3nimos cercanos.

Reglas estrictas:
- Responde como un or\xE1culo m\xEDstico y c\xF3mico \u2014 nunca como un sistema de software.
- Jam\xE1s menciones Rekognition, AWS, etiquetas ni la respuesta correcta.
- M\xE1ximo 190 caracteres en tu feedback.
- Una o dos frases como m\xE1ximo.
- Solo puedes dar UNA respuesta: correcto o incorrecto, nunca ambas.

Responde \xDANICAMENTE con un JSON v\xE1lido:
{"correct": true,  "feedback": "<frase m\xEDstica celebrando al jugador>"}
{"correct": false, "feedback": "<frase m\xEDstica animando a seguir, sin revelar la respuesta>"}
Sin markdown, sin texto extra.`;
async function generateHint(labels, usedHints, hintIndex) {
  const difficulty = Math.min(hintIndex + 1, 5);
  const previousBlock = usedHints.length > 0 ? `
Pistas ya reveladas:
${usedHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}
NO repitas informaci\xF3n de pistas anteriores.` : "";
  const userPrompt = `Etiquetas de la imagen: ${labels.join(", ")}
Nivel de dificultad: ${difficulty}${previousBlock}

Genera la pista ahora:`;
  return invoke(SYSTEM_HINT, userPrompt);
}
async function validateGuess(labels, hints, attempts, guess) {
  const userPrompt = `Etiquetas de la imagen: ${labels.join(", ")}
Pistas reveladas: ${hints.join(" | ")}
Intentos anteriores: ${attempts.join(", ") || "ninguno"}
Respuesta del jugador: "${guess}"

\xBFEs correcta la respuesta?`;
  const raw = await invoke(SYSTEM_JUDGE, userPrompt);
  try {
    return JSON.parse(raw);
  } catch {
    const correct = raw.toLowerCase().includes('"correct":true') || raw.toLowerCase().includes('"correct": true');
    return { correct, feedback: correct ? void 0 : "\xA1Los astros a\xFAn no se alinean, mortal!" };
  }
}

// services/dynamodb.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var client = new import_client_dynamodb.DynamoDBClient({});
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
var TABLE = process.env["GAME_TABLE"];
var TTL_HOURS = parseInt(process.env["GAME_TTL_HOURS"] ?? "2", 10);
async function createSession(input) {
  const now = Date.now();
  const ttl = Math.floor(now / 1e3) + TTL_HOURS * 3600;
  const item = {
    sessionId: input.sessionId,
    status: "active",
    imageUrl: input.imageUrl,
    labels: input.labels,
    hints: [input.firstHint],
    attempts: [],
    createdAt: now,
    ttl
  };
  await ddb.send(new import_lib_dynamodb.PutCommand({ TableName: TABLE, Item: item }));
  return item;
}
async function getSession(sessionId) {
  const { Item } = await ddb.send(
    new import_lib_dynamodb.GetCommand({ TableName: TABLE, Key: { sessionId } })
  );
  return Item ?? null;
}
async function recordAttempt(sessionId, guess, newStatus = "active") {
  await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE,
      Key: { sessionId },
      UpdateExpression: "SET attempts = list_append(attempts, :g), #s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":g": [guess], ":s": newStatus }
    })
  );
}
async function addHint(sessionId, hint) {
  await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE,
      Key: { sessionId },
      UpdateExpression: "SET hints = list_append(hints, :h)",
      ExpressionAttributeValues: { ":h": [hint] }
    })
  );
}
async function markGivenUp(sessionId) {
  await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE,
      Key: { sessionId },
      UpdateExpression: "SET #s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": "given_up" }
    })
  );
}

// utils/response.ts
var respond = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    },
    body: JSON.stringify(body)
  };
};
var ok = (body) => respond(200, body);
var created = (body) => respond(201, body);
var badRequest = (message) => respond(400, { error: message });
var notFound = (message = "Not found") => respond(404, { error: message });
var conflict = (message) => respond(409, { error: message });
var serverError = (message = "Internal server error") => respond(500, { error: message });

// handlers/game.ts
async function handler(_event) {
  try {
    const sessionId = v4_default();
    const imageUrl = await getRandomImagePresignedUrl();
    const labels = await detectLabels(imageUrl);
    if (labels.length === 0) {
      return serverError("Could not extract labels from the image.");
    }
    const firstHint = await generateHint(labels, [], 0);
    await createSession({ sessionId, imageUrl, labels, firstHint });
    const body = {
      sessionId,
      hint: firstHint,
      message: "Game started! Make your first guess."
    };
    return created(body);
  } catch (err) {
    console.error("POST /game error:", err);
    return serverError(err instanceof Error ? err.message : "Unknown error");
  }
}

// handlers/guess.ts
async function handler2(event) {
  try {
    const sessionId = event.pathParameters?.["sessionId"];
    if (!sessionId) return badRequest("Missing sessionId in path.");
    const body = JSON.parse(event.body ?? "{}");
    const guess = (body.guess ?? "").trim();
    if (!guess) return badRequest("Body must include a non-empty 'guess' field.");
    const session = await getSession(sessionId);
    if (!session) return notFound(`Session '${sessionId}' not found.`);
    if (session.status !== "active") {
      return conflict(
        `Game is already '${session.status}'. Start a new game with POST /game.`
      );
    }
    const { correct, feedback } = await validateGuess(
      session.labels,
      session.hints,
      session.attempts,
      guess
    );
    await recordAttempt(sessionId, guess, correct ? "won" : "active");
    const response = correct ? {
      correct: true,
      message: "\u{1F389} Correct! The Oracle reveals its secret.",
      imageUrl: session.imageUrl,
      labels: session.labels,
      totalAttempts: session.attempts.length + 1
    } : {
      correct: false,
      feedback: feedback ?? "Not quite. Try again!",
      attempts: session.attempts.length + 1,
      hintsAvailable: true
    };
    return ok(response);
  } catch (err) {
    console.error("POST /guess error:", err);
    return serverError(err instanceof Error ? err.message : "Unknown error");
  }
}

// handlers/hint.ts
var MAX_HINTS = 5;
async function handler3(event) {
  try {
    const sessionId = event.pathParameters?.["sessionId"];
    if (!sessionId) return badRequest("Missing sessionId in path.");
    const session = await getSession(sessionId);
    if (!session) return notFound(`Session '${sessionId}' not found.`);
    if (session.status !== "active") {
      return conflict(
        `Game is already '${session.status}'. Start a new game with POST /game.`
      );
    }
    const currentCount = session.hints.length;
    if (currentCount >= MAX_HINTS) {
      const response2 = {
        hint: session.hints[currentCount - 1],
        hintNumber: currentCount,
        hintsRemaining: 0,
        message: "No more hints available. Take your best guess!"
      };
      return ok(response2);
    }
    const newHint = await generateHint(session.labels, session.hints, currentCount);
    await addHint(sessionId, newHint);
    const hintNumber = currentCount + 1;
    const response = {
      hint: newHint,
      hintNumber,
      hintsRemaining: MAX_HINTS - hintNumber
    };
    return ok(response);
  } catch (err) {
    console.error("GET /hint error:", err);
    return serverError(err instanceof Error ? err.message : "Unknown error");
  }
}

// handlers/giveUp.ts
async function handler4(event) {
  try {
    const sessionId = event.pathParameters?.["sessionId"];
    if (!sessionId) return badRequest("Missing sessionId in path.");
    const session = await getSession(sessionId);
    if (!session) return notFound(`Session '${sessionId}' not found.`);
    if (session.status !== "active") {
      return conflict(`Game is already '${session.status}'. Nothing to give up on.`);
    }
    await markGivenUp(sessionId);
    const response = {
      message: "The Oracle reveals its secret.",
      imageUrl: session.imageUrl,
      labels: session.labels,
      hints: session.hints,
      attempts: session.attempts
    };
    return ok(response);
  } catch (err) {
    console.error("POST /give-up error:", err);
    return serverError(err instanceof Error ? err.message : "Unknown error");
  }
}

// router.ts
var ROUTES = {
  "POST /game": handler,
  "POST /game/{sessionId}/guess": handler2,
  "GET /game/{sessionId}/hint": handler3,
  "POST /game/{sessionId}/give-up": handler4
};
async function handler5(event, context) {
  const method = event.httpMethod;
  const resource = event.resource;
  if (!method || !resource) {
    return badRequest("Malformed request: missing httpMethod or resource.");
  }
  const routeKey = `${method} ${resource}`;
  const routeHandler = ROUTES[routeKey];
  if (!routeHandler) {
    return notFound(`Route not found: ${routeKey}`);
  }
  return routeHandler(event, context);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
