import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({});

/**
 * Download image bytes from a presigned URL and run Rekognition DetectLabels.
 * Returns label names with confidence >= minConfidence.
 */
export async function detectLabels(
  presignedUrl: string,
  minConfidence = 80
): Promise<string[]> {
  const response = await fetch(presignedUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image: ${response.status} ${response.statusText}`
    );
  }

  const imageBytes = new Uint8Array(await response.arrayBuffer());

  const { Labels = [] } = await rekognition.send(
    new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 20,
      MinConfidence: minConfidence,
    })
  );

  return Labels.map((l) => l.Name).filter((n): n is string => Boolean(n));
}
