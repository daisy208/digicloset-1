import React, { useEffect, useState } from 'react';
import BeforeAfter from './BeforeAfter';
import { fetchMetricsSummary } from './services/metricsApi';

type Props = {
  beforeUrl: string;
  afterUrl: string;
  productId?: string;
};

export default function BeforeAfterWithMetrics({ beforeUrl, afterUrl, productId }: Props) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchMetricsSummary(productId);
        if (mounted) setMetrics(data);
      } catch (e) {
        console.error('Failed to load metrics', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [productId]);

  if (loading) return <div className="p-4">Loading metrics…</div>;

  return (
    <BeforeAfter
      beforeUrl={beforeUrl}
      afterUrl={afterUrl}
      title={metrics?.raw ? 'Before vs After — Example' : undefined}
      description={metrics?.roiStatement}
      estimatedRevenueLift={metrics?.estimatedRevenueLift}
      conversionRateImpact={metrics?.conversionRateImpact}
      timeSavedMinutes={metrics?.timeSavedMinutes}
      monthlyAiSummary={metrics?.monthlyAiSummary}
      roiStatement={metrics?.roiStatement}
    />
  );
}
