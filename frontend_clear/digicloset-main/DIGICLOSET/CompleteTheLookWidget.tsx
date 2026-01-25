import React, { useEffect, useState } from 'react';

// Minimal types for B2B outfit bundles
type OutfitBundle = {
  id: string;
  products: Array<{
    sku: string;
    image: string;
    title: string;
    price: string;
  }>;
  compatibilityScore: number;
};

interface CompleteTheLookWidgetProps {
  merchantId: string;
  productSku: string;
}

export const CompleteTheLookWidget: React.FC<CompleteTheLookWidgetProps> = ({ merchantId, productSku }) => {
  const [outfits, setOutfits] = useState<OutfitBundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch outfit bundles for this product/merchant
    const fetchOutfits = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/widget/recommendations?merchant_id=${merchantId}&product_id=${productSku}`);
        if (!res.ok) throw new Error('Failed to fetch outfits');
        const data = await res.json();
        setOutfits(data.outfits || []);
      } catch (e) {
        setOutfits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOutfits();
  }, [merchantId, productSku]);

  if (loading || outfits.length === 0) return null; // Hide widget if no outfits

  // TODO: Replace with Shopify cart API integration
  const handleAddAllToCart = (skus: string[]) => {
    alert('TODO: Add all SKUs to Shopify cart: ' + skus.join(', '));
  };

  return (
    <div className="dc-complete-the-look-widget" style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, background: '#fff', maxWidth: 420 }}>
      <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Complete the Look</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {outfits.slice(0, 4).map((outfit) => (
          <div key={outfit.id} style={{ border: '1px solid #f3f3f3', borderRadius: 6, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {outfit.products.map((p) => (
                <div key={p.sku} style={{ textAlign: 'center', width: 80 }}>
                  <img src={p.image} alt={p.title} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, marginBottom: 4 }} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>${p.price}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#4b5563' }}>Bundle Score: {outfit.compatibilityScore}%</span>
              <button
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}
                onClick={() => handleAddAllToCart(outfit.products.map(p => p.sku))}
              >
                Add all to cart
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* TODO: Style with Shopify theme tokens if available */}
    </div>
  );
};

// Usage example (to be embedded on product page):
// <CompleteTheLookWidget merchantId="shopify_store_id" productSku="current_sku" />
//
// This widget fetches and displays up to 4 recommended outfit bundles for the current product.
// If no outfits are available, it renders nothing.
// All Shopify-specific cart actions are marked as TODO for later integration.
