export async function startBulkAction(action: string, itemIds?: string[]) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/catalog/bulk_action';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, item_ids: itemIds }),
  });
  if (!res.ok) throw new Error('Failed to start bulk action');
  return res.json();
}

export async function getJob(jobId: string) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/catalog/job/${jobId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch job');
  return res.json();
}

export async function undoJob(jobId: string) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/catalog/job/${jobId}/undo`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to undo job');
  return res.json();
}

export async function loadSampleItems() {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/catalog/items/load_sample';
  const res = await fetch(url, { method: 'POST' });
  return res.json();
}

export async function getCatalogQuality() {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + '/catalog/quality';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch catalog quality');
  return res.json();
}

export async function getItemQuality(itemId: string) {
  const url = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000') + `/catalog/item/${itemId}/quality`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch item quality');
  return res.json();
}

export async function getItemSuggestions(itemId: string, shopId?: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const url = new URL(`${base}/catalog/item/${itemId}/suggestions`);
  if (shopId) url.searchParams.append('shop_id', shopId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch item suggestions');
  return res.json();
}

export async function optimizeAndDeliver(action: string, shopId?: string, itemIds?: string[]) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const res = await fetch(`${base}/catalog/optimize_and_deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, shop_id: shopId, item_ids: itemIds }),
  });
  if (!res.ok) throw new Error('Failed to optimize and deliver');
  return res.json();
}

export async function getDeliveries(shopId: string) {
  const base = (import.meta.env.VITE_METRICS_URL || 'http://localhost:8000');
  const res = await fetch(`${base}/catalog/deliveries/${encodeURIComponent(shopId)}`);
  if (!res.ok) throw new Error('Failed to fetch deliveries');
  return res.json();
}
