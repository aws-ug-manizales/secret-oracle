interface ImageApiResponse {
  url?: string;
  presignedUrl?: string;
}

export async function getRandomImagePresignedUrl(): Promise<string> {
  const apiUrl = process.env["RANDOM_IMAGE_API_URL"];
  if (!apiUrl) throw new Error("RANDOM_IMAGE_API_URL env var is not set");

  const response = await fetch(apiUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error(
      `Random Image API error: ${response.status} ${response.statusText}`
    );
  }

  const body = (await response.json()) as ImageApiResponse;
  const url = body.url ?? body.presignedUrl;

  if (!url) {
    throw new Error(
      `Random Image API response missing 'url' field: ${JSON.stringify(body)}`
    );
  }

  return url;
}
