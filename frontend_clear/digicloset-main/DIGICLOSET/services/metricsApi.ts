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
