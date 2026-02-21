import React, { useState } from 'react';
import { startBulkAction, getJob } from './services/catalogApi';

export default function FirstOptimizationFlow({ shopId, onFinish }: { shopId: string, onFinish?: () => void }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const run = async () => {
    try {
      const res = await startBulkAction('optimize_all');
      setJobId(res.job_id);
      setStatus('queued');
      // poll
      const interval = setInterval(async () => {
        try {
          const s = await getJob(res.job_id);
          setStatus(s.status);
          setProgress(s.progress || 0);
          if (s.status === 'completed' || s.status === 'undone') {
            clearInterval(interval);
            onFinish && onFinish();
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {!jobId ? (
        <div>
          <button onClick={run} className="px-4 py-2 bg-indigo-600 text-white rounded">Run Optimization</button>
        </div>
      ) : (
        <div className="text-sm text-gray-700">
          <div>Job ID: {jobId}</div>
          <div>Status: {status}</div>
          <div>Progress: {progress ?? 0}</div>
        </div>
      )}
    </div>
  );
}
