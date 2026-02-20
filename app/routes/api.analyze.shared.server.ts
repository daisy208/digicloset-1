import { json } from "@remix-run/node";
import { createHash, randomUUID } from "node:crypto";
import { authenticate } from "~/shopify.server";
import { analyzeProduct } from "~/ai/analyzeProduct.server";

const MAX_IMAGE_URL_LENGTH = 2048;
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_PER_WINDOW = Number(process.env.ANALYZE_RATE_LIMIT_PER_MIN || 30);

const rateWindow = new Map<string, { count: number; resetAt: number }>();
const idempotencyStore = new Map<
  string,
  { createdAt: number; payloadHash: string; response: unknown; status: number }
>();

function cleanupStores(now: number) {
  for (const [key, item] of idempotencyStore.entries()) {
    if (now - item.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }

  for (const [key, item] of rateWindow.entries()) {
    if (now > item.resetAt) {
      rateWindow.delete(key);
    }
  }
}

function createCorrelationId(request: Request) {
  const incoming = request.headers.get("x-correlation-id")?.trim();
  return incoming && incoming.length <= 128 ? incoming : randomUUID();
}

function normalizeProductId(productId: unknown) {
  if (typeof productId !== "string") return null;
  const value = productId.trim();
  return /^gid:\/\/shopify\/Product\/\d+$/.test(value) ? value : null;
}

function normalizeImageUrl(imageUrl: unknown) {
  if (typeof imageUrl !== "string") return null;
  const value = imageUrl.trim();
  if (!value || value.length > MAX_IMAGE_URL_LENGTH) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function getIdempotencyKey(request: Request) {
  return request.headers.get("idempotency-key")?.trim() || null;
}

function hashPayload(payload: object) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function jsonWithHeaders(payload: unknown, status: number, correlationId: string) {
  return json(payload, {
    status,
    headers: {
      "X-Correlation-ID": correlationId,
    },
  });
}

async function ensureProductAccessible(admin: any, productId: string) {
  const result = await admin.graphql(
    `
    query ProductAccessCheck($id: ID!) {
      product(id: $id) { id }
    }
    `,
    { variables: { id: productId } },
  );

  const body = await result.json();
  const userErrors = body?.errors;
  if (Array.isArray(userErrors) && userErrors.length > 0) {
    return false;
  }

  return Boolean(body?.data?.product?.id);
}

async function readAnalyzeInput(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const form = await request.formData();
  return {
    productId: form.get("productId"),
    imageUrl: form.get("imageUrl"),
  };
}

export async function handleAnalyzeAction(request: Request) {
  const correlationId = createCorrelationId(request);
  const now = Date.now();
  cleanupStores(now);

  const { admin } = await authenticate.admin(request);
  const { productId, imageUrl } = await readAnalyzeInput(request);
  const validProductId = normalizeProductId(productId);
  const validImageUrl = normalizeImageUrl(imageUrl);
  const idempotencyKey = getIdempotencyKey(request);

  if (!validProductId || !validImageUrl) {
    return jsonWithHeaders(
      {
        success: false,
        error:
          "Invalid input. productId must be a Shopify Product GID and imageUrl must be a valid http/https URL.",
      },
      400,
      correlationId,
    );
  }

  const rateKey = validProductId;
  const currentRate = rateWindow.get(rateKey);
  if (!currentRate || now > currentRate.resetAt) {
    rateWindow.set(rateKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    if (currentRate.count >= RATE_LIMIT_PER_WINDOW) {
      return jsonWithHeaders(
        { success: false, error: "Rate limit exceeded. Retry in 1 minute." },
        429,
        correlationId,
      );
    }
    currentRate.count += 1;
  }

  if (!(await ensureProductAccessible(admin, validProductId))) {
    return jsonWithHeaders(
      { success: false, error: "Unauthorized product access or product not found." },
      403,
      correlationId,
    );
  }

  const payloadHash = hashPayload({ productId: validProductId, imageUrl: validImageUrl });
  if (idempotencyKey) {
    const existing = idempotencyStore.get(idempotencyKey);
    if (existing && existing.payloadHash === payloadHash) {
      return json(existing.response, {
        status: existing.status,
        headers: {
          "X-Correlation-ID": correlationId,
          "X-Idempotent-Replay": "true",
        },
      });
    }
  }

  const ai = await analyzeProduct(validImageUrl);

  await admin.graphql(
    `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key namespace }
        userErrors { field message }
      }
    }
  `,
    {
      variables: {
        metafields: [
          {
            ownerId: validProductId,
            namespace: "ai",
            key: "category",
            type: "single_line_text_field",
            value: ai.category,
          },
          {
            ownerId: validProductId,
            namespace: "ai",
            key: "tags",
            type: "json",
            value: JSON.stringify(ai.tags),
          },
          {
            ownerId: validProductId,
            namespace: "ai",
            key: "confidence",
            type: "number_decimal",
            value: ai.confidence.toString(),
          },
        ],
      },
    },
  );

  const responsePayload = { success: true, result: ai };
  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, {
      createdAt: now,
      payloadHash,
      response: responsePayload,
      status: 200,
    });
  }

  return jsonWithHeaders(responsePayload, 200, correlationId);
}
