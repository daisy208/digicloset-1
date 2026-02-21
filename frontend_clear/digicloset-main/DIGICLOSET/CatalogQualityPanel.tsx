import React, { useEffect, useState } from 'react';
import { getCatalogQuality, getItemQuality } from './services/catalogApi';

export default function CatalogQualityPanel({ onSelect }: { onSelect?: (id: string) => void }) {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getCatalogQuality();
        setSummary(res.summary || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border mb-4">
      <h4 className="text-lg font-semibold mb-2">Optimization Opportunities</h4>
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {summary.slice(0, 10).map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">Potential: {s.improvement_potential}% — Priority: {s.priority}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">Score {s.score}</div>
                <button onClick={() => onSelect && onSelect(s.id)} className="text-xs text-blue-600">View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
