import React, { useEffect, useState } from 'react';
import { getItemSuggestions } from './services/catalogApi';

export default function CatalogSuggestionsPanel({ itemId, shopId }: { itemId?: string | null, shopId?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!itemId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getItemSuggestions(itemId, shopId || undefined);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId, shopId]);

  if (!itemId) return <div className="bg-white rounded-xl p-4 border">Select a product to see AI suggestions</div>;

  return (
    <div className="bg-white rounded-xl p-4 border">
      <h4 className="text-lg font-semibold mb-2">AI Suggestions</h4>
      {loading && <div className="text-sm text-gray-500">Generating suggestions…</div>}
      {data && (
        <div className="space-y-4">
          <div>
            <h5 className="font-medium">A/B Description Variants</h5>
            <ol className="list-decimal pl-5 text-sm text-gray-700">
              {data.descriptions.map((d: any) => (
                <li key={d.variant_id} className="mb-2">{d.description}</li>
              ))}
            </ol>
          </div>

          <div>
            <h5 className="font-medium">Title Suggestions (ranked)</h5>
            <ul className="text-sm text-gray-700">
              {data.titles.map((t: any, idx: number) => (
                <li key={idx} className="mb-1">{t.title} <span className="text-xs text-gray-400">(score {t.score})</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-medium">Upsell / Bundle Suggestions</h5>
            <ul className="text-sm text-gray-700">
              {data.upsells.map((u: any, idx: number) => (
                <li key={idx} className="mb-1">{u.product_id} — est. incremental ${Math.round(u.estimated_incremental_revenue)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-medium">Price Suggestion</h5>
            <div className="text-sm text-gray-700">Action: {data.price_suggestion.action} — Suggested: ${data.price_suggestion.suggested_price} — {data.price_suggestion.rationale}</div>
          </div>
        </div>
      )}
    </div>
  );
}
