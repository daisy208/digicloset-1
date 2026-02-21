import React, { useState } from 'react';
import { getMerchantProfile, upsertMerchantProfile, computeEmbeddings, getBestProducts, getMerchantSettings, setMerchantSettings, rateOutput, recordEdit } from './services/metricsApi';

export default function MerchantProfilePanel() {
  const [shopId, setShopId] = useState<string>('demo-shop');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [learningAdjustments, setLearningAdjustments] = useState<any>({});

  const loadProfile = async () => {
    setLoading(true);
    try {
      const p = await getMerchantProfile(shopId);
      setProfile(p);
    } catch (e) {
      console.error(e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
    // load settings too
    try {
      const s = await getMerchantSettings(shopId);
      setSettings(s.settings || {});
      setLearningAdjustments(s.learning_adjustments || {});
    } catch (e) {
      // ignore
    }
  };

  const saveProfile = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const payload = {
        shop_id: shopId,
        brand_tone: profile?.brand_tone || 'friendly',
        target_audience: profile?.target_audience || 'women 25-45',
        product_category_behaviors: profile?.product_category_behaviors || {},
      };
      const res = await upsertMerchantProfile(shopId, payload);
      setProfile(res.profile || payload);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runEmbeddings = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      // For demo: use a small set of example product descriptions
      const sampleDescriptions = [
        'Minimalist cotton t-shirt, neutral tones, fitted',
        'Casual linen summer dress with floral print',
        'Tailored business blazer in navy',
      ];
      await computeEmbeddings(shopId, sampleDescriptions);
      // reload profile to show embeddings
      await loadProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleImprove = async () => {
    if (!shopId) return;
    const next = !(settings?.improve_future_outputs);
    try {
      await setMerchantSettings(shopId, { improve_future_outputs: next });
      setSettings((s: any) => ({ ...(s || {}), improve_future_outputs: next }));
    } catch (e) {
      console.error(e);
    }
  };

  const resetAdjustments = async () => {
    if (!shopId) return;
    try {
      await setMerchantSettings(shopId, { learning_adjustments: {} });
      setLearningAdjustments({});
    } catch (e) {
      console.error(e);
    }
  };

  const loadBest = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await getBestProducts(shopId, 6);
      setTopProducts(res.topProducts || []);
      setPatterns(res.patterns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Merchant Profile & Patterns</h3>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <input value={shopId} onChange={(e) => setShopId(e.target.value)} className="border px-3 py-2 rounded w-48" />
        <button onClick={loadProfile} className="px-3 py-2 bg-blue-600 text-white rounded">Load</button>
        <button onClick={saveProfile} className="px-3 py-2 bg-green-600 text-white rounded">Save</button>
        <button onClick={runEmbeddings} className="px-3 py-2 bg-indigo-600 text-white rounded">Compute Embeddings</button>
        <button onClick={loadBest} className="px-3 py-2 bg-purple-600 text-white rounded">Top Products</button>
      </div>

      {loading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}

      {profile ? (
        <div className="space-y-2 mb-4">
          <div><strong>Brand tone:</strong> {profile.brand_tone}</div>
          <div><strong>Target audience:</strong> {profile.target_audience}</div>
          <div><strong>Stored style embedding:</strong> {profile.store_style_embedding ? 'available' : '—'}</div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 mb-4">No profile loaded</div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Learning & Feedback</h4>
        <div className="flex items-center space-x-3 mb-2">
          <label className="text-sm">Improve future outputs</label>
          <button onClick={toggleImprove} className={`px-3 py-1 rounded ${settings?.improve_future_outputs ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {settings?.improve_future_outputs ? 'On' : 'Off'}
          </button>
          <button onClick={resetAdjustments} className="px-3 py-1 bg-red-100 text-red-700 rounded">Reset adjustments</button>
        </div>
        <div className="text-sm text-gray-700">Learning adjustments: {Object.keys(learningAdjustments).length === 0 ? 'None' : ''}</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(learningAdjustments).map(([k, v]: any) => (
            <span key={k} className="text-xs bg-gray-100 px-2 py-1 rounded">{k}: {v}</span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Top Products</h4>
        {topProducts.length === 0 ? (
          <div className="text-sm text-gray-500">No data</div>
        ) : (
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {topProducts.map((p: any) => (
              <li key={p.product_id}>{p.product_id} — ${Math.round(p.revenue)}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Detected Patterns</h4>
        {patterns.length === 0 ? (
          <div className="text-sm text-gray-500">No patterns detected</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {patterns.map((pat: any, idx: number) => (
              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">{pat.token} ({pat.count})</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
