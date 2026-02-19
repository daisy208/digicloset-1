import {
  Page,
  Button,
  Card,
  Text,
  InlineStack,
  BlockStack,
  Spinner,
  Badge,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";

export default function Index() {
  const fetcher = useFetcher();

  const isLoading = fetcher.state !== "idle";
  const data = fetcher.data as any;

  const runAI = () => {
    fetcher.submit(
      {
        productId: "gid://shopify/Product/123456789",
        imageUrl: "https://via.placeholder.com/300",
      },
      { method: "post", action: "/api/v1/analyze" }
    );
  };
<Card>
  <Text as="h2" variant="headingSm">
    How DigiCloset AI Works
  </Text>
  <Text as="p" tone="subdued">
    DigiCloset analyzes your product images and metadata to generate
    visually cohesive outfit recommendations. The AI improves over time
    based on your approvals and rejections.
  </Text>
</Card>

  const sendFeedback = (outfitId: string, approved: boolean) => {
    fetcher.submit(
      {
        outfit_id: outfitId,
        approved,
      },
      { method: "post", action: "/api/v1/feedback" }
    );
  };

  return (
    <Page title="AI Analyzer">
      <BlockStack gap="500">
        {/* ACTION */}
        <Button onClick={runAI} variant="primary" loading={isLoading}>
          Analyze Demo Product
        </Button>

        {/* LOADING */}
        {isLoading && (
          <Card>
            <InlineStack align="center" gap="200">
              <Spinner size="small" />
              <Text as="p">Analyzing product with AI…</Text>
            </InlineStack>
          </Card>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !data && (
          <Card>
            <Text as="h2" variant="headingSm">
              No AI results yet
            </Text>
            <Text as="p" tone="subdued">
              Run the analyzer to generate AI-powered outfit suggestions.
            </Text>
          </Card>
        )}

        {/* RESULTS */}
        {data?.outfits && (
          <BlockStack gap="400">
            {data.outfits.map((outfit: any) => (
              <Card key={outfit.id}>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingSm">
                      {outfit.title}
                    </Text>

                    {outfit.approved && (
                      <Badge tone="success">Approved</Badge>
                    )}
                  </InlineStack>

                  <Text as="p">{outfit.description}</Text>

                  <InlineStack gap="200">
                    <Button
                      onClick={() => sendFeedback(outfit.id, true)}
                      variant="primary"
                    >
                      Approve
                    </Button>

                    <Button
                      onClick={() => sendFeedback(outfit.id, false)}
                      tone="critical"
                    >
                      Reject
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        )}
      </BlockStack>
    </Page>
  );
}
{fetcher.data?.error && (
  <Card tone="critical">
    <Text>{fetcher.data.error}</Text>
  </Card>
)}
