import React, { useEffect, useState } from 'react';
import { getUsage, getUsagePerFeature, getSavingsEstimate } from './services/billingApi';

export default function AICreditsDashboard({ shopId = 'demo-shop' }: { shopId?: string }) {
  const [usage, setUsage] = useState<any[]>([]);
  const [perFeature, setPerFeature] = useState<any>({});
  const [savings, setSavings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const u = await getUsage(shopId, 200);
        setUsage(u.usage || []);
        const pf = await getUsagePerFeature(shopId);
        setPerFeature(pf.per_feature || {});
        const s = await getSavingsEstimate(shopId);
        setSavings(s || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border mt-4">
      <h4 className="text-lg font-semibold mb-2">AI Credit Usage</h4>
      {loading ? <div className="text-sm">Loading…</div> : (
        <div>
          <div className="text-sm text-gray-700 max-h-64 overflow-y-auto">
            {usage.length === 0 ? <div className="text-gray-500">No credit usage recorded</div> : (
              usage.map((u, idx) => (
                <div key={idx} className="py-1 border-b last:border-b-0">{u.timestamp} — {u.type} — {u.amount} — {u.description}</div>
              ))
            )}
          </div>
          <div className="mt-4 bg-white rounded p-3 border">
            <div className="text-sm font-medium mb-2">Per-Feature Summary</div>
            {Object.keys(perFeature).length === 0 ? <div className="text-gray-500 text-sm">No feature data</div> : (
              Object.entries(perFeature).map(([feat, d]: any) => (
                <div key={feat} className="py-1 border-b last:border-b-0 text-sm">
                  <div className="flex justify-between"><div className="font-medium">{feat}</div><div className="text-gray-600">Credits: {d.credits.toFixed(2)}</div></div>
                  <div className="text-xs text-gray-500">Count: {d.count} • Time saved: {Math.round(d.time_saved_minutes)}m</div>
                </div>
              ))
            )}
            <div className="mt-3 text-sm font-medium">Estimated Savings</div>
            {savings ? <div className="text-sm text-indigo-600 font-semibold">${savings.estimated_savings.toFixed(2)}</div> : <div className="text-sm text-gray-500">No savings data</div>}
          </div>
        </div>
      )}
    </div>
  );
}
