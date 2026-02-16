import { Page, Button } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";

export default function Index() {
  const fetcher = useFetcher();

  const runAI = () => {
    fetcher.submit(
      {
        productId: "gid://shopify/Product/123456789",
        imageUrl: "https://via.placeholder.com/300"
      },
      { method: "post", action: "/api/v1/analyze" }
    );
  };

  return (
    <Page title="AI Analyzer">
      <Button onClick={runAI} variant="primary">
        Analyze Demo Product
      </Button>
    </Page>
  );
}
