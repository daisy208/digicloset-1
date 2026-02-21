import React, { useEffect, useState } from 'react';
import { getItemQuality } from './services/catalogApi';

export default function ItemQualityBadge({ itemId }: { itemId: string }) {
  const [q, setQ] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getItemQuality(itemId);
        if (mounted) setQ(res);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [itemId]);

  if (!q) return <span className="text-gray-700">—</span>;

  const color = q.priority === 'high' ? 'text-red-600' : q.priority === 'medium' ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className={`flex items-center space-x-2 ${color}`}>
      <span className="font-semibold">{q.score}</span>
      {q.opportunity && <span className="text-xs text-gray-500">opportunity</span>}
    </div>
  );
}
