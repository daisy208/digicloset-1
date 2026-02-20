import { Page, Text, BlockStack } from "@shopify/polaris";

export default function PrivacyPolicy() {
  return (
    <Page title="Privacy Policy">
      <BlockStack gap="400">
        <Text as="p">
          DigiCloset collects product data solely to generate AI-powered outfit
          recommendations for merchants.
        </Text>
        <Text as="p">
          We do not sell, share, or use merchant data for advertising.
        </Text>
        <Text as="p">
          All data is processed securely and used only to improve AI-generated
          recommendations within the app.
        </Text>
        <Text as="p">
          Merchants may request data deletion at any time by contacting support.
        </Text>
      </BlockStack>
    </Page>
  );
}
