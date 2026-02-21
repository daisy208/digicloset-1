import React, { useState } from 'react';
import FirstOptimizationFlow from './FirstOptimizationFlow';

export default function OnboardingWizard({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(1);
  const [shopId, setShopId] = useState<string>('demo-shop');
  const [preferences, setPreferences] = useState({ preferredStyles: ['minimalist'] });

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const finish = () => {
    localStorage.setItem('vf_onboard_complete', '1');
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Welcome to VirtualFit — Onboarding</h3>
          <button onClick={() => { localStorage.setItem('vf_onboard_complete', '1'); onClose && onClose(); }} className="text-sm text-gray-500">Skip</button>
        </div>

        {step === 1 && (
          <div>
            <h4 className="font-medium mb-2">Connect your store</h4>
            <p className="text-sm text-gray-600 mb-3">Enter your store identifier to keep settings and credits scoped.</p>
            <input value={shopId} onChange={(e) => setShopId(e.target.value)} className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end space-x-2">
              <button onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 className="font-medium mb-2">Set basic preferences</h4>
            <p className="text-sm text-gray-600 mb-3">Choose a default style preference for AI suggestions.</p>
            <select value={preferences.preferredStyles[0]} onChange={(e) => setPreferences({ preferredStyles: [e.target.value] })} className="w-full p-2 border rounded mb-4">
              <option value="minimalist">Minimalist</option>
              <option value="casual">Casual</option>
              <option value="trendy">Trendy</option>
            </select>
            <div className="flex justify-between">
              <button onClick={prev} className="px-4 py-2 border rounded">Back</button>
              <button onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 className="font-medium mb-2">Run your first optimization</h4>
            <p className="text-sm text-gray-600 mb-3">We will run a small catalog optimization to show results and credits used.</p>
            <FirstOptimizationFlow shopId={shopId} onFinish={finish} />
            <div className="flex justify-end mt-4">
              <button onClick={prev} className="px-4 py-2 border rounded mr-2">Back</button>
              <button onClick={finish} className="px-4 py-2 bg-green-600 text-white rounded">Finish later</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
