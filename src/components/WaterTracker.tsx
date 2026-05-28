/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Droplet, Plus, Minus } from 'lucide-react';

interface WaterTrackerProps {
  waterIntake: number;
  goalWater: number;
  onUpdateWater: (amount: number) => void;
}

export default function WaterTracker({
  waterIntake,
  goalWater,
  onUpdateWater,
}: WaterTrackerProps) {
  const waterPercent = Math.min((waterIntake / goalWater) * 100, 100);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4" id="water-tracker">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-extrabold text-slate-800 font-heading flex items-center gap-1.5">
          <Droplet className="w-4 h-4 text-sky-500 fill-sky-200 animate-bounce" /> Nawodnienie (Woda)
        </h4>
        <span className="text-xs text-sky-600 font-bold bg-sky-50 px-2.5 py-1 rounded-full">
          {waterIntake} / {goalWater} ml
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Elegant glass visual */}
        <div className="relative w-14 h-20 border-2 border-slate-200 rounded-b-xl rounded-t-sm flex items-end overflow-hidden bg-slate-50 shrink-0 shadow-inner">
          <motion.div 
            className="bg-sky-400 w-full" 
            initial={{ height: 0 }}
            animate={{ height: `${waterPercent}%` }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-slate-700 drop-shadow-sm">
              {Math.round(waterPercent)}%
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-[11px] text-slate-400">Regularne picie wody podkręca metabolizm i ułatwia spalanie!</p>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => onUpdateWater(Math.max(0, waterIntake - 250))}
              className="bg-slate-100 text-slate-700 rounded-lg p-1.5 hover:bg-slate-200 text-[10px] flex items-center gap-0.5 font-bold transition cursor-pointer"
              title="Usuń szklankę"
            >
              <Minus className="w-3" /> 250ml
            </button>
            <button
              onClick={() => onUpdateWater(waterIntake + 250)}
              className="bg-sky-500 text-white rounded-lg p-1.5 hover:bg-sky-600 text-[10px] flex items-center gap-0.5 font-bold transition shadow-sm cursor-pointer"
              title="Dodaj szklankę"
            >
              <Plus className="w-3" /> 250ml
            </button>
            <button
              onClick={() => onUpdateWater(waterIntake + 500)}
              className="bg-sky-600 text-white rounded-lg p-1.5 hover:bg-sky-700 text-[10px] flex items-center gap-0.5 font-bold transition shadow-sm cursor-pointer"
              title="Dodaj butelkę"
            >
              <Plus className="w-3" /> 500ml
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
