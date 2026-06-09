/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Flame, 
  Droplet, 
  Scale, 
  CheckCircle, 
  AlertCircle,
  FileBarChart2, 
  Info,
  Layers,
  Award
} from 'lucide-react';
import { DayLog, UserGoals } from '../types';

interface ReportDashboardProps {
  dayLogs: Record<string, DayLog>;
  goals: UserGoals;
}

export default function ReportDashboard({ dayLogs, goals }: ReportDashboardProps) {
  const [timeWindow, setTimeWindow] = useState<'7' | '30'>('7');

  // Generate historical list of dates for the last N days
  const chartData = useMemo(() => {
    const daysCount = parseInt(timeWindow);
    const list = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const log = dayLogs[dateStr];
      const calories = log
        ? log.meals.reduce((total, m) => total + m.calories, 0)
        : 0;
      const water = log ? log.waterIntakeMl : 0;
      const weight = log ? log.weightKg : undefined;

      // Formatting date labels (e.g., "09.06")
      const label = `${day}.${month}`;

      list.push({
        dateString: dateStr,
        label,
        calories,
        water,
        weight,
        hasLog: !!log
      });
    }
    return list;
  }, [dayLogs, timeWindow]);

  // Compute key averages and high level statistics
  const summaryStats = useMemo(() => {
    const loggedDays = chartData.filter(d => d.hasLog || d.calories > 0 || d.water > 0);
    const daysLogCount = loggedDays.length;

    const avgCal = daysLogCount > 0 
      ? Math.round(chartData.reduce((sum, d) => sum + d.calories, 0) / daysLogCount) 
      : 0;

    const avgWater = daysLogCount > 0 
      ? Math.round(chartData.reduce((sum, d) => sum + d.water, 0) / daysLogCount) 
      : 0;

    // Weight progress
    const weightLogs = chartData.filter(d => d.weight !== undefined).map(d => d.weight as number);
    let initialWeight = weightLogs.length > 0 ? weightLogs[0] : undefined;
    let latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : undefined;
    let weightDiff = initialWeight !== undefined && latestWeight !== undefined 
      ? parseFloat((latestWeight - initialWeight).toFixed(1))
      : 0;

    // Calculate goals achievement rate (percentage of logged days that met standard thresholds)
    let metCalGoalsCount = 0;
    loggedDays.forEach(d => {
      // Met calorie goal if it's within 12% margin or at least 85% of target
      if (d.calories >= goals.calories * 0.85 && d.calories <= goals.calories * 1.15) {
        metCalGoalsCount++;
      }
    });
    const achievementRate = daysLogCount > 0 
      ? Math.round((metCalGoalsCount / daysLogCount) * 100) 
      : 0;

    return {
      daysLogCount,
      avgCal,
      avgWater,
      initialWeight,
      latestWeight,
      weightDiff,
      achievementRate
    };
  }, [chartData, goals]);

  // Max value calculators for SVG chart height proportions
  const maxCalVal = useMemo(() => {
    const vals = chartData.map(d => d.calories);
    return Math.max(...vals, goals.calories, 1000) * 1.15;
  }, [chartData, goals.calories]);

  const maxWaterVal = useMemo(() => {
    const vals = chartData.map(d => d.water);
    return Math.max(...vals, goals.waterMl, 1000) * 1.15;
  }, [chartData, goals.waterMl]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6" id="reports-and-charts">
      
      {/* Top Banner and window selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black font-heading text-slate-800 flex items-center gap-2">
            <FileBarChart2 className="w-5.5 h-5.5 text-indigo-600" /> Analiza i Raporty Postępów
          </h2>
          <p className="text-xs text-slate-400">Podsumowanie trendów kalorii, wody i wagi z ostatnich pomiarów</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setTimeWindow('7')}
            className={`px-4 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1 ${
              timeWindow === '7' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> 7 Dni
          </button>
          <button
            onClick={() => setTimeWindow('30')}
            className={`px-4 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1 ${
              timeWindow === '30' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 30 Dni
          </button>
        </div>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Stat 1: Calories */}
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-1">
          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Średnie Kalorie</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-800 font-heading">{summaryStats.avgCal}</span>
            <span className="text-[10px] text-slate-400 font-medium">kcal/doba</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Cel: {goals.calories} kcal
          </div>
        </div>

        {/* Stat 2: Water */}
        <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100/50 space-y-1">
          <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block">Średnia Woda</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-800 font-heading">{summaryStats.avgWater}</span>
            <span className="text-[10px] text-slate-400 font-medium">ml/doba</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
            <Droplet className="w-3.5 h-3.5 text-sky-500" /> Cel: {goals.waterMl} ml
          </div>
        </div>

        {/* Stat 3: Weight delta */}
        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 space-y-1">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Zmiana Wagi</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-800 font-heading">
              {summaryStats.weightDiff > 0 ? `+${summaryStats.weightDiff}` : summaryStats.weightDiff}
            </span>
            <span className="text-[10px] text-slate-400 font-medium font-sans">kg</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-none">
            {summaryStats.latestWeight ? `Obecnie: ${summaryStats.latestWeight} kg` : 'Brak danych wagi'}
          </p>
        </div>

        {/* Stat 4: Achievement */}
        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 space-y-1">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Realizacja Planu</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-800 font-heading">{summaryStats.achievementRate}%</span>
            <span className="text-[10px] text-slate-400 font-medium">dni w celu</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
            <Award className="w-3.5 h-3.5 text-emerald-500" /> Aktywność: {summaryStats.daysLogCount} dni
          </div>
        </div>

      </div>

      {/* SVG Charts Area */}
      <div className="space-y-6 pt-2">
        
        {/* Chart 1: Calories bar chart */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" /> Wykres Kalorii (Spożycie vs Cel)
            </h3>
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              <span className="w-2.5 h-1 bg-indigo-500 rounded-sm inline-block" /> kalorie zjedzone
              <span className="w-2.5 h-0 bg-transparent border-t-2 border-dashed border-rose-400 inline-block" /> cel dobowy
            </span>
          </div>

          {/* SVG Rendering */}
          <div className="h-44 w-full pt-1 relative">
            <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
              {/* Target Goal Calories horizontal Line */}
              {(() => {
                const targetY = 170 - (goals.calories / maxCalVal) * 150;
                return (
                  <line 
                    x1="40" 
                    y1={targetY} 
                    x2="980" 
                    y2={targetY} 
                    stroke="#fb7185" 
                    strokeWidth="2.5" 
                    strokeDasharray="6 4" 
                  />
                );
              })()}

              {/* Data Bars */}
              {chartData.map((d, index) => {
                const step = 940 / chartData.length;
                const x = 40 + index * step + step * 0.15;
                const width = step * 0.7;
                const barHeight = (d.calories / maxCalVal) * 150;
                const y = Math.max(170 - barHeight, 10);
                const isOver = d.calories > goals.calories;

                return (
                  <g key={index} className="group cursor-pointer">
                    {/* Bar background block highlight */}
                    <rect 
                      x={x} 
                      y="10" 
                      width={width} 
                      height="160" 
                      fill="transparent" 
                      className="hover:fill-slate-50/40 transition duration-150"
                    />

                    {/* The value bar */}
                    <rect 
                      x={x} 
                      y={y} 
                      width={width} 
                      height={Math.max(barHeight, 2)} 
                      rx="3"
                      fill={d.calories === 0 ? '#f1f5f9' : isOver ? '#fb7185' : '#6366f1'} 
                      className="transition duration-300"
                    />

                    {/* Daily text values above each bar (only if 7 days or on hover) */}
                    {d.calories > 0 && (chartData.length <= 7) && (
                      <text 
                        x={x + width / 2} 
                        y={Math.max(y - 5, 20)} 
                        textAnchor="middle" 
                        fill="#475569" 
                        fontSize="14" 
                        fontWeight="bold"
                        className="font-mono text-[10px]"
                      >
                        {d.calories}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Horizontal axis label line */}
              <line x1="30" y1="170" x2="980" y2="170" stroke="#cbd5e1" strokeWidth="1" />
            </svg>

            {/* Date Labels under chart columns */}
            <div className="flex justify-between pl-6 pr-4 pt-1 font-mono text-[9px] text-slate-400 border-none font-semibold">
              {chartData.map((d, i) => (
                <span 
                  key={i} 
                  style={{ width: `${95 / chartData.length}%` }} 
                  className="text-center truncate"
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Water timeline track */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-sky-500" /> Nawodnienie (ml)
            </h3>
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              <span className="w-2.5 h-1 bg-sky-500 rounded-sm inline-block" /> wypita woda
              <span className="w-2.5 h-0 bg-transparent border-t-2 border-dashed border-sky-400 inline-block" /> cel (ml)
            </span>
          </div>

          <div className="h-40 w-full pt-1 relative">
            <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
              {/* Target Goal Water Line */}
              {(() => {
                const targetY = 170 - (goals.waterMl / maxWaterVal) * 150;
                return (
                  <line 
                    x1="40" 
                    y1={targetY} 
                    x2="980" 
                    y2={targetY} 
                    stroke="#38bdf8" 
                    strokeWidth="2.5" 
                    strokeDasharray="6 4" 
                  />
                );
              })()}

              {/* Water Bars */}
              {chartData.map((d, index) => {
                const step = 940 / chartData.length;
                const x = 40 + index * step + step * 0.2;
                const width = step * 0.6;
                const barHeight = (d.water / maxWaterVal) * 150;
                const y = Math.max(170 - barHeight, 10);
                const isMet = d.water >= goals.waterMl;

                return (
                  <rect 
                    key={index}
                    x={x} 
                    y={y} 
                    width={width} 
                    height={Math.max(barHeight, 2)} 
                    rx="3"
                    fill={d.water === 0 ? '#f1f5f9' : isMet ? '#0ea5e9' : '#38bdf8'} 
                    className="transition duration-300"
                  />
                );
              })}

              {/* Bottom line */}
              <line x1="30" y1="170" x2="980" y2="170" stroke="#cbd5e1" strokeWidth="1" />
            </svg>

            {/* Date Labels */}
            <div className="flex justify-between pl-6 pr-4 pt-1 font-mono text-[9px] text-slate-400 font-semibold">
              {chartData.map((d, i) => (
                <span 
                  key={i} 
                  style={{ width: `${95 / chartData.length}%` }} 
                  className="text-center truncate"
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Weight progress chart */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3 shadow-2xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-500" /> Kontrola wagi ciała (Trend)
          </h3>

          {chartData.filter(d => d.weight !== undefined).length === 0 ? (
            <div className="h-28 flex items-center justify-center text-center bg-slate-50 rounded-xl text-slate-400 text-xs gap-1.5 p-4 border border-dashed border-slate-200">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Brak pomiarów wagi w wybranym przedziale {timeWindow} dni. Wpisz wagę w Dzienniku, aby zobaczyć linię trendu!</span>
            </div>
          ) : (
            <div className="h-44 w-full pt-1 relative">
              <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
                {(() => {
                  const weightPoints = chartData
                    .map((d, i) => ({ val: d.weight, index: i }))
                    .filter((pt): pt is { val: number; index: number } => pt.val !== undefined);

                  const vals = weightPoints.map(p => p.val);
                  const minWeight = Math.min(...vals) - 1;
                  const maxWeight = Math.max(...vals) + 1;
                  const range = maxWeight - minWeight || 2;

                  // Generate string for SVG polyline
                  const step = 940 / chartData.length;
                  const pointsStr = weightPoints
                    .map(p => {
                      const x = 40 + p.index * step + step / 2;
                      const y = 160 - ((p.val - minWeight) / range) * 115;
                      return `${x},${y}`;
                    })
                    .join(' ');

                  return (
                    <g>
                      {/* Grid bounds */}
                      <line x1="40" y1="160" x2="980" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="40" y1="45" x2="980" y2="45" stroke="#f1f5f9" strokeWidth="1" />

                      {/* Connective spline trend line */}
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pointsStr}
                      />

                      {/* Single Point Dots */}
                      {weightPoints.map((p, keyId) => {
                        const x = 40 + p.index * step + step / 2;
                        const y = 160 - ((p.val - minWeight) / range) * 115;
                        return (
                          <g key={keyId}>
                            <circle 
                              cx={x} 
                              cy={y} 
                              r="5" 
                              fill="#f59e0b" 
                              stroke="#ffffff" 
                              strokeWidth="2.5" 
                              className="shadow-sm" 
                            />
                            <text 
                              x={x} 
                              y={y - 10} 
                              textAnchor="middle" 
                              fontSize="13" 
                              fontWeight="extrabold" 
                              fill="#1e293b"
                              className="font-mono text-[10px]"
                            >
                              {p.val} kg
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}

                {/* Ground border */}
                <line x1="30" y1="170" x2="980" y2="170" stroke="#cbd5e1" strokeWidth="1" />
              </svg>

              {/* Date Labels */}
              <div className="flex justify-between pl-6 pr-4 pt-1 font-mono text-[9px] text-slate-400 font-semibold">
                {chartData.map((d, i) => (
                  <span 
                    key={i} 
                    style={{ width: `${95 / chartData.length}%` }} 
                    className="text-center truncate"
                  >
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Advice tip and motivation insights card */}
      <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-indigo-900 leading-tight">Mądrość Twoich nawyków:</h4>
          <p className="text-slate-650 leading-relaxed text-[11px]">
            {summaryStats.daysLogCount === 0 ? (
              <>Dane do obliczenia rekomendacji będą dostępne od razu, gdy dodasz swój pierwszy wpis.</>
            ) : summaryStats.avgCal > goals.calories ? (
              <>Twoje średnie dzienne spożycie wynosi <strong className="text-indigo-900">{summaryStats.avgCal} kcal</strong> i jest wyższe niż cel ({goals.calories} kcal). Aby osiągnąć zamierzony cel, spróbuj zamieniać gęste kalorycznie produkty na bogatsze w błonnik warzywa.</>
            ) : (
              <>Świetna robota! Utrzymujesz stabilność energetyczną. Regularne monitorowanie uodparnia metabolizm na wahania limitów. Twój bilans wodny wynosi średnio <strong className="text-indigo-900">{summaryStats.avgWater} ml na dobę</strong> – to super baza dla regeneracji!</>
            )}
          </p>
        </div>
      </div>

    </div>
  );
}
