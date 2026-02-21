import React, { useState, useEffect } from 'react';
import { startBulkAction, getJob, undoJob, loadSampleItems, optimizeAndDeliver } from './services/catalogApi';
import { recordUsageFeature } from './services/billingApi';

export default function CatalogBulkActions({ selectedIds = [] }: { selectedIds?: string[] }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    let timer: any;
    if (jobId && polling) {
      timer = setInterval(async () => {
        try {
          const s = await getJob(jobId);
          setStatus(s);
          if (s.status === 'completed' || s.status === 'undone') {
            setPolling(false);
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [jobId, polling]);

  const start = async (action: string) => {
    try {
      const payload = selectedIds.length ? selectedIds : undefined;
      const res = await startBulkAction(action, payload as any);
      setJobId(res.job_id);
      setPolling(true);
    } catch (e) {
      console.error(e);
    }
  };

  const optimizeDeliver = async (action: string) => {
    try {
      const res = await optimizeAndDeliver(action, 'demo-shop', selectedIds.length ? selectedIds : undefined);
      // show brief summary
      alert(`Delivered: ${res.productsProcessed || res.monthlyAiSummary?.productsProcessed || res.details?.length || 0} products. Estimated revenue lift: $${res.estimatedRevenueLift || res.estimatedRevenueLift}.`);
      // optionally record usage/charge credits (demo): charge 2 credits per product
      const credits = (res.monthlyAiSummary?.productsProcessed || res.details?.length || 0) * 2.0;
      const timeSaved = res.timeSavedMinutes || res.timeSavedMinutes === 0 ? res.timeSavedMinutes : res.total_time_saved_minutes;
      try {
        await recordUsageFeature('demo-shop', 'ai_credit', credits, 'catalog_optimize', timeSaved, 'Catalog optimize & deliver');
      } catch (e) {
        console.warn('Failed to record usage', e);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const doUndo = async () => {
    if (!jobId) return;
    try {
      await undoJob(jobId);
      setStatus((s: any) => ({ ...s, status: 'undone' }));
    } catch (e) {
      console.error(e);
    }
  };

  const loadSamples = async () => {
    try {
      await loadSampleItems();
      alert('Sample items loaded');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <button onClick={() => start('optimize_all')} className="px-3 py-2 bg-blue-600 text-white rounded">Optimize Entire Catalog</button>
        <button onClick={() => optimizeDeliver('optimize_all')} className="px-3 py-2 bg-yellow-600 text-white rounded">Optimize & Deliver</button>
        <button onClick={() => start('seo')} className="px-3 py-2 bg-green-600 text-white rounded">Bulk SEO</button>
        <button onClick={() => start('enhance_images')} className="px-3 py-2 bg-indigo-600 text-white rounded">Bulk Image Enhancement</button>
        <button onClick={() => start('regen_descriptions')} className="px-3 py-2 bg-purple-600 text-white rounded">Bulk Description Regen</button>
        <button onClick={loadSamples} className="px-3 py-2 bg-gray-200 rounded">Load Sample Items</button>
      </div>

      {jobId && (
        <div className="mt-2">
          <div className="text-sm">Job ID: {jobId}</div>
          <div className="text-sm">Status: {status?.status || 'queued'}</div>
          <div className="text-sm">Progress: {status?.progress || 0} / {status?.total || '—'}</div>
          <div className="mt-2">
            <button onClick={doUndo} className="px-3 py-1 bg-red-500 text-white rounded">Undo / Restore</button>
          </div>
        </div>
      )}
    </div>
  );
}
