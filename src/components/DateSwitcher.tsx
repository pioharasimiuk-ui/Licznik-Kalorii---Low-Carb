/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSwitcherProps {
  currentDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSwitcher({ currentDate, onDateChange }: DateSwitcherProps) {
  const shiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    onDateChange(`${year}-${month}-${day}`);
  };

  const getFriendlyDateLabel = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) return 'Dzisiaj';
    if (dateStr === yesterdayStr) return 'Wczoraj';
    
    const parsed = new Date(dateStr);
    return parsed.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between" id="date-switcher">
      <button 
        onClick={() => shiftDate(-1)} 
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
        title="Poprzedni dzień"
        id="btn-day-prev"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold text-slate-400 font-sans tracking-wide">
          {currentDate}
        </span>
        <span className="text-base font-black text-slate-800 font-heading">
          {getFriendlyDateLabel(currentDate)}
        </span>
      </div>

      <button 
        onClick={() => shiftDate(1)} 
        className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
        title="Następny dzień"
        id="btn-day-next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
