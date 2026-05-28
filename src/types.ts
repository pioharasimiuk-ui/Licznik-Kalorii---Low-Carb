/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MealCategory = 'Śniadanie' | 'Drugie śniadanie' | 'Obiad' | 'Kolacja' | 'Przekąski';

export interface Product {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number; // in grams
  carbsPer100g: number;   // in grams
  fatPer100g: number;     // in grams
  isCustom?: boolean;     // user-created products
}

export interface MealLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weightGrams: number;
  category: MealCategory;
  loggedAt: string; // ISO date string or timestamp
}

export interface DayLog {
  date: string; // YYYY-MM-DD format
  meals: MealLog[];
  waterIntakeMl: number;
  weightKg?: number;
  medsTaken?: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  };
}

export interface UserGoals {
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fat: number;     // g
  waterMl: number; // ml
  targetWeightKg?: number;
  dietType?: 'balanced' | 'low-carb' | 'mediterranean' | 'custom';
  mealCount?: 3 | 5;
}
