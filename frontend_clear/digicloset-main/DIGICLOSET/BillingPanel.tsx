import React, { useEffect, useState } from 'react';
import { getCredits, getUsage, charge, getUsagePerFeature, getSavingsEstimate } from './services/billingApi';

export default function BillingPanel({ shopId = 'demo-shop' }: { shopId?: string }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [usage, setUsage] = useState<any[]>([]);
  const [perFeature, setPerFeature] = useState<any>({});
  const [savings, setSavings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const c = await getCredits(shopId);
        setCredits(c.credits ?? c[shopId]?.credits ?? null);
        const u = await getUsage(shopId, 20);
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

  const doCharge = async () => {
    try {
      await charge(shopId, 100, 'Top-up credits');
      const c = await getCredits(shopId);
      setCredits(c.credits ?? c[shopId]?.credits ?? null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border">
      <h4 className="text-lg font-semibold mb-2">Billing & Credits</h4>
      {loading ? <div className="text-sm">Loading…</div> : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">AI Credits</div>
            <div className="text-xl font-bold text-indigo-600">{credits ?? '—'}</div>
          </div>
          <button onClick={doCharge} className="px-3 py-2 bg-green-600 text-white rounded mb-3">Top up +100</button>
          <div className="text-sm font-medium mb-2">Recent Usage</div>
          <div className="max-h-40 overflow-y-auto text-sm text-gray-700">
            {usage.length === 0 ? <div className="text-gray-500">No usage yet</div> : usage.map((u, idx) => (
              <div key={idx} className="border-b py-1 last:border-b-0">{u.timestamp} — {u.type} — {u.amount}</div>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Usage by Feature</div>
            <div className="text-sm text-gray-700">
              {Object.keys(perFeature).length === 0 ? <div className="text-gray-500">No feature usage yet</div> : (
                Object.entries(perFeature).map(([feat, data]: any) => (
                  <div key={feat} className="py-1 border-b last:border-b-0">
                    <div className="flex justify-between"><div className="font-medium">{feat}</div><div className="text-sm text-gray-600">Credits: {data.credits.toFixed(2)}</div></div>
                    <div className="text-xs text-gray-500">Count: {data.count} • Time saved: {Math.round(data.time_saved_minutes)}m</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Estimated Savings vs Manual Work</div>
            {savings ? (
              <div className="text-sm text-gray-700">
                <div className="font-semibold text-indigo-600">${savings.estimated_savings.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Based on hourly rate ${savings.hourly_rate}/hr and tracked time saved</div>
              </div>
            ) : <div className="text-sm text-gray-500">No savings data</div>}
          </div>
        </div>
      )}
    </div>
  );
}
