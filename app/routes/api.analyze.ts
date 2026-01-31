import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { analyzeProduct } from "~/ai/analyzeProduct.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const { productId, imageUrl } = await request.json();

  const ai = await analyzeProduct(imageUrl);

  await admin.graphql(`
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key namespace }
        userErrors { field message }
      }
    }
  `, {
    variables: {
      metafields: [
        {
          ownerId: productId,
          namespace: "ai",
          key: "category",
          type: "single_line_text_field",
          value: ai.category
        },
        {
          ownerId: productId,
          namespace: "ai",
          key: "tags",
          type: "json",
          value: JSON.stringify(ai.tags)
        },
        {
          ownerId: productId,
          namespace: "ai",
          key: "confidence",
          type: "number_decimal",
          value: ai.confidence.toString()
        }
      ]
    }
  });

  return json({ success: true });
};
