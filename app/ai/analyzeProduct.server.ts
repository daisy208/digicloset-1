type AnalyzeResult = {
  category: string;
  tags: string[];
  confidence: number;
  raw: Record<string, unknown>;
};

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_INFERENCE_TIMEOUT_MS || 6000);
const DEFAULT_RETRIES = Number(process.env.AI_INFERENCE_RETRIES || 1);
const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

function fallbackResult(reason: string): AnalyzeResult {
  return {
    category: "unknown",
    tags: [],
    confidence: 0.2,
    raw: { fallback: true, reason },
  };
}

async function withTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function toAnalyzeResult(payload: any): AnalyzeResult {
  const colors = Array.isArray(payload?.colors) ? payload.colors : [];
  const recommendations = Array.isArray(payload?.recommendations)
    ? payload.recommendations
    : [];
  const dominantColor =
    typeof payload?.dominant_color === "string" ? payload.dominant_color : "";
  const topTag = typeof recommendations[0] === "string" ? recommendations[0] : "";

  return {
    category: dominantColor ? `color:${dominantColor}` : "unknown",
    tags: [topTag, ...colors].filter(Boolean),
    confidence: typeof payload?.fitScore === "number" ? payload.fitScore : 0.5,
    raw: payload && typeof payload === "object" ? payload : { payload },
  };
}

export async function analyzeProduct(imageUrl: string): Promise<AnalyzeResult> {
  let lastError = "unknown_error";

  for (let attempt = 0; attempt <= DEFAULT_RETRIES; attempt += 1) {
    try {
      const imageResponse = await withTimeout(
        imageUrl,
        { method: "GET" },
        DEFAULT_TIMEOUT_MS,
      );
      if (!imageResponse.ok) {
        throw new Error(`image_fetch_failed:${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.blob();
      const form = new FormData();
      form.append("file", imageBlob, "product.jpg");

      const inferenceResponse = await withTimeout(
        `${AI_BASE_URL}/analyze`,
        { method: "POST", body: form },
        DEFAULT_TIMEOUT_MS,
      );
      if (!inferenceResponse.ok) {
        throw new Error(`inference_failed:${inferenceResponse.status}`);
      }

      const payload = await inferenceResponse.json();
      return toAnalyzeResult(payload);
    } catch (error: any) {
      lastError = error?.message || "request_failed";
      if (attempt >= DEFAULT_RETRIES) {
        break;
      }
    }
  }

  return fallbackResult(lastError);
}
