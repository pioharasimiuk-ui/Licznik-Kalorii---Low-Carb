/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Scale, Check } from 'lucide-react';

interface WeightTrackerProps {
  currentWeight?: number;
  onUpdateWeight: (weight: number | undefined) => void;
}

export default function WeightTracker({
  currentWeight,
  onUpdateWeight,
}: WeightTrackerProps) {
  const [weightInput, setWeightInput] = useState(currentWeight?.toString() || '');

  useEffect(() => {
    setWeightInput(currentWeight?.toString() || '');
  }, [currentWeight]);

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightInput.trim()) {
      onUpdateWeight(undefined);
      return;
    }
    const val = parseFloat(weightInput.replace(',', '.'));
    if (!isNaN(val) && val > 30 && val < 300) {
      onUpdateWeight(val);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4" id="weight-tracker">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-extrabold text-slate-800 font-heading flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-amber-500" /> Kontrola wagi na ten dzień
        </h4>
        {currentWeight ? (
          <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full animate-pulse-slow">
            Zapisano: {currentWeight} kg
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-full">Brak pomiaru</span>
        )}
      </div>

      <div>
        <form onSubmit={handleWeightSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={currentWeight ? `${currentWeight} kg` : "Wpisz np: 74.5"}
            value={weightInput}
            onChange={(e) => {
              setWeightInput(e.target.value);
            }}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-amber-500 focus:bg-white font-semibold"
          />
          <button
            type="submit"
            className="bg-slate-800 text-white rounded-xl px-4 py-1.5 text-xs font-bold hover:bg-slate-900 transition flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <Check className="w-3.5 h-3.5" /> Zapisz
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-2 block">
          Zaleca się ważyć rano na czczo w powtarzalnych warunkach rano.
        </p>
      </div>
    </div>
  );
}
