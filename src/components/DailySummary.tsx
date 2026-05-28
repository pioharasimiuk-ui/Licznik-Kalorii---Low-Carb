/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { UserGoals } from '../types';

interface DailySummaryProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: UserGoals;
  onUpdateGoals: (goals: UserGoals) => void;
}

export default function DailySummary({
  totals,
  goals,
  onUpdateGoals,
}: DailySummaryProps) {
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalCal, setGoalCal] = useState(goals.calories);
  const [goalProt, setGoalProt] = useState(goals.protein);
  const [goalCarb, setGoalCarb] = useState(goals.carbs);
  const [goalFat, setGoalFat] = useState(goals.fat);
  const [goalWater, setGoalWater] = useState(goals.waterMl);
  const [dietType, setDietType] = useState<'balanced' | 'low-carb' | 'mediterranean' | 'custom'>(goals.dietType || 'balanced');
  const [mealCount, setMealCount] = useState<3 | 5>(goals.mealCount || 3);
  const [errorMsg, setErrorMsg] = useState('');

  const recalculateMacros = (calories: number, type: 'balanced' | 'low-carb' | 'mediterranean' | 'custom') => {
    if (type === 'balanced') {
      setGoalProt(Math.round((calories * 0.3) / 4));
      setGoalCarb(Math.round((calories * 0.45) / 4));
      setGoalFat(Math.round((calories * 0.25) / 9));
    } else if (type === 'low-carb') {
      setGoalProt(Math.round((calories * 0.35) / 4));
      setGoalCarb(Math.round((calories * 0.15) / 4));
      setGoalFat(Math.round((calories * 0.5) / 9));
    } else if (type === 'mediterranean') {
      setGoalProt(Math.round((calories * 0.25) / 4));
      setGoalCarb(Math.round((calories * 0.4) / 4));
      setGoalFat(Math.round((calories * 0.35) / 9));
    }
  };

  const caloriesLeft = goals.calories - totals.calories;
  const calPercent = Math.min((totals.calories / goals.calories) * 100, 100);
  const proteinPercent = Math.min((totals.protein / goals.protein) * 100, 100);
  const carbsPercent = Math.min((totals.carbs / goals.carbs) * 100, 100);
  const fatPercent = Math.min((totals.fat / goals.fat) * 100, 100);

  const strokeWidth = 10;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercent / 100) * circumference;

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalCal <= 0 || goalProt <= 0 || goalCarb <= 0 || goalFat <= 0 || goalWater <= 0) {
      setErrorMsg('Wszystkie cele muszą być większe od 0!');
      return;
    }
    onUpdateGoals({
      calories: Math.round(goalCal),
      protein: Math.round(goalProt),
      carbs: Math.round(goalCarb),
      fat: Math.round(goalFat),
      waterMl: Math.round(goalWater),
      dietType: dietType,
      mealCount: mealCount
    });
    setErrorMsg('');
    setIsEditingGoals(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6" id="calories-display-card">
      {/* Header section */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-50">
        <h3 className="text-base font-black text-slate-800 font-heading tracking-tight flex items-center gap-1.5 animate-pulse">
          <Flame className="w-4 h-4 text-emerald-500 fill-emerald-100" /> Podsumowanie dnia
        </h3>
        <button
           onClick={() => {
             setGoalCal(goals.calories);
             setGoalProt(goals.protein);
             setGoalCarb(goals.carbs);
             setGoalFat(goals.fat);
             setGoalWater(goals.waterMl);
             setDietType(goals.dietType || 'balanced');
             setMealCount(goals.mealCount || 3);
             setIsEditingGoals(!isEditingGoals);
           }}
           className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
           id="edit-goals-btn"
        >
          {isEditingGoals ? "Zamknij" : "Zmień cele"}
        </button>
      </div>

      {isEditingGoals ? (
        <form onSubmit={handleSaveGoals} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3" id="goals-form">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Ustaw swoje cele</h4>
          {errorMsg && <p className="text-xs font-semibold text-rose-500">{errorMsg}</p>}
          
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-0.5">PROFIL DIETY</label>
              <select
                value={dietType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setDietType(val);
                  recalculateMacros(goalCal, val);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-emerald-500 cursor-pointer"
              >
                <option value="balanced">🥗 Zrównoważona (30% B, 45% W, 25% T)</option>
                <option value="low-carb">🥑 Niskowęglowodanowa Low-Carb (35% B, 15% W, 50% T)</option>
                <option value="mediterranean">🐟 Śródziemnomorska (25% B, 40% W, 35% T)</option>
                <option value="custom">⚙️ Własne proporcje makroskładników</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-0.5">STRUKTURA POSIŁKÓW</label>
              <select
                value={mealCount}
                onChange={(e) => setMealCount(parseInt(e.target.value) as 3 | 5)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-emerald-500 cursor-pointer"
              >
                <option value={3}>💊 3 posiłki (Śniadanie, Obiad, Kolacja)</option>
                <option value={5}>🍽️ 5 posiłków (z Drugim śniadaniem i Przekąskami)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Kalorie (kcal)</label>
              <input
                type="number"
                value={goalCal}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setGoalCal(val);
                  recalculateMacros(val, dietType);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Woda (ml)</label>
              <input
                type="number"
                value={goalWater}
                onChange={(e) => setGoalWater(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Białko (g)</label>
              <input
                type="number"
                value={goalProt}
                onChange={(e) => {
                  setGoalProt(parseInt(e.target.value) || 0);
                  setDietType('custom');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Węglowodany (g)</label>
              <input
                type="number"
                value={goalCarb}
                onChange={(e) => {
                  setGoalCarb(parseInt(e.target.value) || 0);
                  setDietType('custom');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-emerald-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Tłuszcze (g)</label>
              <input
                type="number"
                value={goalFat}
                onChange={(e) => {
                  setGoalFat(parseInt(e.target.value) || 0);
                  setDietType('custom');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-emerald-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white rounded-xl py-1.5 text-xs font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
          >
            Zapisz nowe cele
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Ring section */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="text-slate-100"
                  strokeWidth={strokeWidth}
                  stroke="currentColor"
                  fill="transparent"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className={caloriesLeft >= 0 ? "text-emerald-500" : "text-rose-500"}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeDashoffset }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-heading">
                  {Math.abs(caloriesLeft)}
                </span>
                <span className={`text-[10px] font-black tracking-wider uppercase ${caloriesLeft >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {caloriesLeft >= 0 ? "Pozostało" : "Przekroczono"} kcal
                </span>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-slate-400">
              Cel: <span className="font-semibold text-slate-600">{goals.calories} kcal</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Protein Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Protein (Białko)</span>
                <span className="text-slate-400 text-[11px]">
                  <strong className="text-slate-700">{Math.round(totals.protein)}g</strong> / {goals.protein}g
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-emerald-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${proteinPercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>

            {/* Carbs Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Węglowodany</span>
                <span className="text-slate-400 text-[11px]">
                  <strong className="text-slate-700">{Math.round(totals.carbs)}g</strong> / {goals.carbs}g
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-sky-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${carbsPercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>

            {/* Fat Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Tłuszcze</span>
                <span className="text-slate-400 text-[11px]">
                  <strong className="text-slate-700">{Math.round(totals.fat)}g</strong> / {goals.fat}g
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-amber-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${fatPercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>

            {/* Calories stats line */}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1">
                Zjedzone: <strong className="text-slate-700">{totals.calories} kcal</strong>
              </span>
              <span>
                Cel: <strong className="text-slate-700">{goals.calories} kcal</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
