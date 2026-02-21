export async function getCredits(shopId?: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const url = shopId ? `${base}/billing/credits?shop_id=${encodeURIComponent(shopId)}` : `${base}/billing/credits`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch credits');
  return res.json();
}

export async function charge(shopId: string, amount: number, description?: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const res = await fetch(`${base}/billing/charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id: shopId, amount, description }),
  });
  if (!res.ok) throw new Error('Failed to charge account');
  return res.json();
}

export async function recordUsage(shopId: string | undefined, type: string, amount: number, description?: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const res = await fetch(`${base}/billing/usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id: shopId, type, amount, description }),
  });
  if (!res.ok) throw new Error('Failed to record usage');
  return res.json();
}

export async function recordUsageFeature(shopId: string | undefined, type: string, amount: number, feature?: string, timeSavedMinutes?: number, description?: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const res = await fetch(`${base}/billing/usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id: shopId, type, amount, feature, time_saved_minutes: timeSavedMinutes, description }),
  });
  if (!res.ok) throw new Error('Failed to record usage');
  return res.json();
}

export async function getUsage(shopId?: string, limit = 100) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const url = new URL(`${base}/billing/usage`);
  if (shopId) url.searchParams.append('shop_id', shopId);
  url.searchParams.append('limit', String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch usage');
  return res.json();
}

export async function getUsagePerFeature(shopId?: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const url = new URL(`${base}/billing/usage_per_feature`);
  if (shopId) url.searchParams.append('shop_id', shopId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch usage per feature');
  return res.json();
}

export async function getSavingsEstimate(shopId?: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const url = new URL(`${base}/billing/savings_estimate`);
  if (shopId) url.searchParams.append('shop_id', shopId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch savings estimate');
  return res.json();
}
