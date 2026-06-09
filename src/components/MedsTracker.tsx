/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Pill, Check, Zap, Sunset, Sun, Moon } from 'lucide-react';

interface MedsTrackerProps {
  medsTaken?: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  };
  onUpdateMeds: (meds: { breakfast?: boolean; lunch?: boolean; dinner?: boolean }) => void;
}

export default function MedsTracker({ medsTaken = {}, onUpdateMeds }: MedsTrackerProps) {
  const toggleMed = (time: 'breakfast' | 'lunch' | 'dinner') => {
    const updated = {
      breakfast: medsTaken.breakfast || false,
      lunch: medsTaken.lunch || false,
      dinner: medsTaken.dinner || false,
      [time]: !medsTaken[time]
    };
    onUpdateMeds(updated);
  };

  const countChecked = [
    medsTaken.breakfast,
    medsTaken.lunch,
    medsTaken.dinner
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4" id="meds-tracker-component">
      {/* Header and status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Pill className="w-5 h-5 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 font-heading">Leki i Suplementy</h4>
            <p className="text-[10px] text-slate-400">Oznacz zażyte witaminy, leki lub suplementy</p>
          </div>
        </div>
        
        {countChecked === 3 ? (
          <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-bounce-slow">
            <Zap className="w-3 h-3 text-emerald-500 fill-emerald-100" /> Wszystko wzięte!
          </span>
        ) : (
          <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50/50 border border-indigo-100/30 px-2 py-0.5 rounded-full">
            Wykonano: {countChecked} / 3
          </span>
        )}
      </div>

      {/* Grid of custom buttons for morning, noon, evening */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Morning */}
        <button
          onClick={() => toggleMed('breakfast')}
          className={`relative p-3.5 rounded-2xl border text-center transition duration-200 cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
            medsTaken.breakfast
              ? 'bg-emerald-50/70 border-emerald-250 text-emerald-800 scale-[1.02] shadow-sm'
              : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/80 text-slate-500'
          }`}
          id="med- morning-btn"
        >
          <Sun className={`w-5 h-5 ${medsTaken.breakfast ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span className="text-[10.5px] font-extrabold font-heading block">Rano</span>
          <span className="text-[9px] text-slate-400 block font-normal leading-none">Do śniadania</span>
          {medsTaken.breakfast && (
            <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
        </button>

        {/* Noon */}
        <button
          onClick={() => toggleMed('lunch')}
          className={`relative p-3.5 rounded-2xl border text-center transition duration-200 cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
            medsTaken.lunch
              ? 'bg-emerald-50/70 border-emerald-250 text-emerald-800 scale-[1.02] shadow-sm'
              : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/80 text-slate-500'
          }`}
          id="med-lunch-btn"
        >
          <Sunset className={`w-5 h-5 ${medsTaken.lunch ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span className="text-[10.5px] font-extrabold font-heading block">Południe</span>
          <span className="text-[9px] text-slate-400 block font-normal leading-none font-sans">Do obiadu</span>
          {medsTaken.lunch && (
            <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
        </button>

        {/* Evening */}
        <button
          onClick={() => toggleMed('dinner')}
          className={`relative p-3.5 rounded-2xl border text-center transition duration-200 cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
            medsTaken.dinner
              ? 'bg-emerald-50/70 border-emerald-250 text-emerald-800 scale-[1.02] shadow-sm'
              : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/80 text-slate-500'
          }`}
          id="med-dinner-btn"
        >
          <Moon className={`w-5 h-5 ${medsTaken.dinner ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span className="text-[10.5px] font-extrabold font-heading block">Wieczór</span>
          <span className="text-[9px] text-slate-400 block font-normal leading-none">Do kolacji</span>
          {medsTaken.dinner && (
            <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
        </button>

      </div>
    </div>
  );
}
