export async function fetchMetricsSummary(productId?: string) {
  const url = new URL((import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/metrics/summary');
  if (productId) url.searchParams.append('product_id', productId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch metrics summary');
  return res.json();
}

export async function postMonthlySummary(summary: any) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/metrics/monthly_summary';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  });
  return res.json();
}

export async function recordEvent(event: any) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/metrics/record';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return res.json();
}

export async function getMerchantProfile(shopId: string) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/merchant/${shopId}/profile`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch merchant profile');
  return res.json();
}

export async function upsertMerchantProfile(shopId: string, profile: any) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/merchant/${shopId}/profile`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  return res.json();
}

export async function computeEmbeddings(shopId: string, descriptions: string[]) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/merchant/${shopId}/compute_embeddings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(descriptions),
  });
  return res.json();
}

export async function getBestProducts(shopId: string, topN = 5) {
  const url = new URL((import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/merchant/${shopId}/best_products`);
  url.searchParams.append('top_n', String(topN));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch best products');
  return res.json();
}

export async function rateOutput(shopId: string, productId: string | undefined, outputType: string, rating: number, notes?: string) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/metrics/rate_output';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id: shopId, product_id: productId, output_type: outputType, rating, notes }),
  });
  return res.json();
}

export async function recordEdit(shopId: string, productId: string | undefined, field: string, original: string, edited: string, timeSavedMinutes?: number) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/metrics/record_edit';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id: shopId, product_id: productId, field, original, edited, time_saved_minutes: timeSavedMinutes }),
  });
  return res.json();
}

export async function getMerchantSettings(shopId: string) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/merchant/${encodeURIComponent(shopId)}/settings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch merchant settings');
  return res.json();
}

export async function setMerchantSettings(shopId: string, payload: any) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/merchant/${encodeURIComponent(shopId)}/settings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getBenchmarkDescriptionStyles(niche?: string, topN = 5) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const url = new URL(base + '/benchmarks/description_styles');
  if (niche) url.searchParams.append('niche', niche);
  url.searchParams.append('top_n', String(topN));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch benchmark description styles');
  return res.json();
}

export async function getIndustryTrends(niche?: string, periodDays = 90) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const url = new URL(base + '/benchmarks/industry_trends');
  if (niche) url.searchParams.append('niche', niche);
  url.searchParams.append('period_days', String(periodDays));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch industry trends');
  return res.json();
}
