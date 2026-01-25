import React from 'react';
import { CompleteTheLookWidget } from './CompleteTheLookWidget';

// Demo merchant/product IDs for testing
const DEMO_MERCHANT_ID = 'demo-merchant-123';
const DEMO_PRODUCT_SKU = 'sku-001';

export default function CompleteTheLookDemo() {
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: '#f9fafb', padding: 24, borderRadius: 12 }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>Shopify Widget Demo</h2>
      <CompleteTheLookWidget merchantId={DEMO_MERCHANT_ID} productSku={DEMO_PRODUCT_SKU} />
      <p style={{ marginTop: 32, fontSize: 13, color: '#888' }}>
        This is a minimal embeddable widget for Shopify product pages.<br />
        It fetches and displays up to 4 recommended outfit bundles for the current product.<br />
        If no outfits are available, the widget is hidden.
      </p>
    </div>
  );
}
