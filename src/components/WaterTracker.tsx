/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Droplet, Plus, Minus, Coffee, GlassWater, CupSoda, RotateCcw } from 'lucide-react';

interface WaterTrackerProps {
  waterIntake: number;
  goalWater: number;
  onUpdateWater: (amount: number) => void;
}

interface Vessel {
  id: string;
  name: string;
  volume: number;
  icon: React.ReactNode;
  hint: string;
  bgClass: string;
}

export default function WaterTracker({
  waterIntake,
  goalWater,
  onUpdateWater,
}: WaterTrackerProps) {
  const waterPercent = Math.min((waterIntake / goalWater) * 100, 100);

  // Definition of real-world water containers
  const vessels: Vessel[] = [
    {
      id: 'cup',
      name: 'Filiżanka / Kawa',
      volume: 150,
      icon: <Coffee className="w-5 h-5 text-amber-600" />,
      hint: 'Filiżanka kawy/herbaty',
      bgClass: 'hover:bg-amber-50/50 hover:border-amber-200'
    },
    {
      id: 'glass',
      name: 'Szklanka wody',
      volume: 250,
      icon: <GlassWater className="w-5 h-5 text-sky-500" />,
      hint: 'Standardowa szklanka',
      bgClass: 'hover:bg-sky-50/70 hover:border-sky-200'
    },
    {
      id: 'mug',
      name: 'Duży kubek',
      volume: 350,
      icon: <CupSoda className="w-5 h-5 text-indigo-500" />,
      hint: 'Duży ulubiony kubek',
      bgClass: 'hover:bg-indigo-50/50 hover:border-indigo-200'
    },
    {
      id: 'shaker',
      name: 'Bidon / Szejker',
      volume: 500,
      icon: <Droplet className="w-5 h-5 text-emerald-500 fill-emerald-100/30" />,
      hint: 'Średni bidon sportowy',
      bgClass: 'hover:bg-emerald-50/50 hover:border-emerald-200'
    },
    {
      id: 'bottle',
      name: 'Duża butelka',
      volume: 1000,
      icon: <Droplet className="w-5 h-5 text-blue-600 fill-blue-100" />,
      hint: 'Butelka wody mineralnej',
      bgClass: 'hover:bg-blue-50/50 hover:border-blue-200'
    }
  ];

  const addWater = (amount: number) => {
    onUpdateWater(waterIntake + amount);
  };

  const removeWater = (amount: number) => {
    onUpdateWater(Math.max(0, waterIntake - amount));
  };

  const resetTodayWater = () => {
    if (confirm('Czy na pewno chcesz zresetować dzisiejsze nawodnienie do zera?')) {
      onUpdateWater(0);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4" id="water-tracker">
      {/* Header element */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50/80 rounded-xl text-sky-500">
            <Droplet className="w-5 h-5 fill-sky-200 animate-bounce-slow" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 font-heading">Nawodnienie organizmu</h4>
            <p className="text-[10px] text-slate-400">Regularne picie wody przyśpiesza metabolizm i regenerację</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-sky-600 font-extrabold bg-sky-55 bg-sky-50 border border-sky-100/50 px-2.5 py-1 rounded-xl">
            {waterIntake} / {goalWater} ml
          </span>
          {waterIntake > 0 && (
            <button 
              onClick={resetTodayWater}
              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
              title="Resetuj do zera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Glass level visual & quick explanation */}
      <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-3.5">
        
        {/* Dynamic fluid glass visual */}
        <div className="relative w-14 h-22 border-3 border-slate-300 bg-white/80 rounded-b-2xl rounded-t-sm flex items-end overflow-hidden shrink-0 shadow-inner">
          <motion.div 
            className="bg-sky-400 w-full relative" 
            initial={{ height: 0 }}
            animate={{ height: `${waterPercent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            {/* Soft wave visual reflection lines */}
            <span className="absolute top-0 inset-x-0 h-1.5 bg-sky-300/40 opacity-75 inline-block animate-pulse" />
          </motion.div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-slate-800 drop-shadow-sm bg-white/60 px-1 rounded-md leading-none font-sans">
              {Math.round(waterPercent)}%
            </span>
          </div>
        </div>

        {/* Informative advice message based on target progression */}
        <div className="flex-1 space-y-1">
          <h5 className="text-[11px] font-extrabold text-slate-700 font-heading">
            {waterPercent === 0 
              ? 'Rozpoczynamy nawadnianie!' 
              : waterPercent < 50 
              ? 'Dobra baza, pij dalej!' 
              : waterPercent < 100 
              ? 'Świetny progres, blisko celu!' 
              : 'Fantastycznie! Pełne nawodnienie 🎉'}
          </h5>
          <p className="text-[10px] text-slate-500 leading-normal">
            Sugerowane porcje ułatwiają precyzyjne śledzenie bez konieczności odmierzania miarką kuchenną. Kliknij na naczynie, aby dodać je do dziennika.
          </p>
        </div>
      </div>

      {/* Grid of beautifully designed vessels */}
      <div className="space-y-3">
        <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
          Wybierz naczynie, z którego piłeś:
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="vessels-selection-grid">
          {vessels.map((vessel) => (
            <button
              key={vessel.id}
              onClick={() => addWater(vessel.volume)}
              className={`p-3 bg-slate-50/50 border border-slate-200/65 rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 group ${vessel.bgClass}`}
              title={`Kliknij, aby dodać ${vessel.volume}ml`}
            >
              <div className="p-1.5 bg-white group-hover:bg-white rounded-xl shadow-2xs group-hover:scale-105 transition duration-150">
                {vessel.icon}
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-700 mt-1.5 leading-tight font-heading block">
                {vessel.name.split(' ')[0]}
              </span>
              <span className="text-[9px] text-slate-400 font-normal leading-none mt-0.5 font-sans">
                {vessel.name.substring(vessel.name.indexOf(' '))}
              </span>
              <span className="mt-1 px-2 py-0.5 bg-sky-50 group-hover:bg-sky-100 text-sky-600 font-black text-[9.5px] rounded-lg transition font-mono block">
                +{vessel.volume} ml
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Correct actions panel (submitting minus operations) */}
      {waterIntake > 0 && (
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100/70 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Minus className="w-3" /> Korekta pomyłek i odejmowanie:
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => removeWater(100)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded-lg transition font-extrabold flex items-center gap-1 cursor-pointer"
              title="Odejmij 100ml"
            >
              - 100ml
            </button>
            <button
              onClick={() => removeWater(250)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded-lg transition font-extrabold flex items-center gap-1 cursor-pointer"
              title="Odejmij 250ml"
            >
              - 250ml
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

