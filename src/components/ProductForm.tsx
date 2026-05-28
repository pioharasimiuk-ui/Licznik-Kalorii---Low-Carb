/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, X, Sparkles, AlertCircle } from 'lucide-react';

interface ProductFormProps {
  onAddProduct: (product: Product) => void;
  onClose: () => void;
}

export default function ProductForm({ onAddProduct, onClose }: ProductFormProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nazwa produktu jest wymagana!');
      return;
    }

    const calVal = Math.round(parseFloat(calories) || 0);
    const protVal = parseFloat(protein) || 0;
    const carbVal = parseFloat(carbs) || 0;
    const fatVal = parseFloat(fat) || 0;

    if (calVal < 0 || protVal < 0 || carbVal < 0 || fatVal < 0) {
      setError('Wartości odżywcze nie mogą być ujemne!');
      return;
    }

    // A small sanity check for macros vs calories if they wish,
    // but we allow customization because some packaging numbers are rounded.
    const sumGrams = protVal + carbVal + fatVal;
    if (sumGrams > 100) {
      setError('Suma białka, węglowodanów i tłuszczu w 100g nie może przekraczać 100g!');
      return;
    }

    const newProduct: Product = {
      id: 'custom-' + Date.now(),
      name: name.trim(),
      caloriesPer100g: calVal,
      proteinPer100g: Number(protVal.toFixed(1)),
      carbsPer100g: Number(carbVal.toFixed(1)),
      fatPer100g: Number(fatVal.toFixed(1)),
      isCustom: true
    };

    onAddProduct(newProduct);
    
    // reset form
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setError('');
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-inner relative" id="custom-product-form">
      <button 
        onClick={onClose} 
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition"
        title="Zamknij formularz"
      >
        <X className="w-4 h-4" />
      </button>

      <h3 className="text-sm font-extrabold text-slate-800 font-heading tracking-tight mb-3 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-emerald-500" /> Dodaj własny produkt do bazy
      </h3>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-700 font-medium mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
            Nazwa produktu
          </label>
          <input
            type="text"
            placeholder="np. Domowy chleb gryczany, Kotlet schabowy babci"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-1">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider" title="Kalorie w 100g">
              Kcal (100g)
            </label>
            <input
              type="number"
              placeholder="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-emerald-500 text-center"
            />
          </div>

          <div className="col-span-1">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider" title="Białko w 100g">
              Białko (g)
            </label>
            <input
              type="text"
              placeholder="0"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-emerald-500 text-center"
            />
          </div>

          <div className="col-span-1">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider" title="Węglowodany w 100g">
              Węgle (g)
            </label>
            <input
              type="text"
              placeholder="0"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-emerald-500 text-center"
            />
          </div>

          <div className="col-span-1">
            <label className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider" title="Tłuszcze w 100g">
              Tłuszcz (g)
            </label>
            <input
              type="text"
              placeholder="0"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-emerald-500 text-center"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Zapisz w swojej bazie
        </button>
      </form>
    </div>
  );
}
