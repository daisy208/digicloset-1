import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { analyzeProduct } from "~/ai/analyzeProduct.server";

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
  const { admin } = await authenticate.admin(request);
  const { productId, imageUrl } = await readAnalyzeInput(request);

  if (!productId || !imageUrl) {
    return json(
      { success: false, error: "Missing required fields: productId, imageUrl" },
      { status: 400 },
    );
  }

  const ai = await analyzeProduct(String(imageUrl));

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
            ownerId: String(productId),
            namespace: "ai",
            key: "category",
            type: "single_line_text_field",
            value: ai.category,
          },
          {
            ownerId: String(productId),
            namespace: "ai",
            key: "tags",
            type: "json",
            value: JSON.stringify(ai.tags),
          },
          {
            ownerId: String(productId),
            namespace: "ai",
            key: "confidence",
            type: "number_decimal",
            value: ai.confidence.toString(),
          },
        ],
      },
    },
  );

  return json({ success: true, result: ai });
}
