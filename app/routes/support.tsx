import { Page, Text, BlockStack } from "@shopify/polaris";

export default function Support() {
  return (
    <Page title="Support">
      <BlockStack gap="400">
        <Text as="p">
          For support, feature requests, or data inquiries, contact:
        </Text>
        <Text as="p" fontWeight="bold">
          support@digicloset.ai
        </Text>
      </BlockStack>
    </Page>
  );
}
