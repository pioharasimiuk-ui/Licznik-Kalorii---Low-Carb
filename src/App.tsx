/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Search, 
  Plus, 
  Trash2, 
  PlusCircle, 
  Scale, 
  Utensils, 
  Sparkles, 
  Apple, 
  BookOpen, 
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Clock,
  ChefHat,
  Share2
} from 'lucide-react';
import { Product, MealLog, DayLog, UserGoals, MealCategory, Recipe } from './types';
import { POPULAR_PRODUCTS } from './data/mockProducts';
import DateSwitcher from './components/DateSwitcher';
import DailySummary from './components/DailySummary';
import WaterTracker from './components/WaterTracker';
import WeightTracker from './components/WeightTracker';
import ProductForm from './components/ProductForm';
import RecipeManager from './components/RecipeManager';
import ShareBackup from './components/ShareBackup';

// Helper to get local date string YYYY-MM-DD
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  // --- Persistent Local States ---
  const [currentDate, setCurrentDate] = useState<string>(getTodayString());
  
  // Custom user products
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kcal_custom_products');
    return saved ? JSON.parse(saved) : [];
  });

  // User created culinary recipes database
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('kcal_user_recipes');
    return saved ? JSON.parse(saved) : [];
  });

  // Daily logs dictionary mapping YYYY-MM-DD -> DayLog
  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>(() => {
    const saved = localStorage.getItem('kcal_daily_logs');
    return saved ? JSON.parse(saved) : {};
  });

  // User nutrition goal targets
  const [goals, setGoals] = useState<UserGoals>(() => {
    const saved = localStorage.getItem('kcal_user_goals');
    if (saved) return JSON.parse(saved);
    return {
      calories: 2000,
      protein: 150,
      carbs: 225,
      fat: 55,
      waterMl: 2000,
      dietType: 'balanced',
      mealCount: 3 // Default 3 meals, tailor-made for the user
    };
  });

  // --- UI Interactivity States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('Śniadanie');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [portionWeight, setPortionWeight] = useState<number>(100);
  const [showProductForm, setShowProductForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'dziennik' | 'baza' | 'przepisy' | 'kopia'>('dziennik');
  const [tipMessage, setTipMessage] = useState('');

  // Dynamic set of categories based on user choice
  const activeCategories = useMemo<MealCategory[]>(() => {
    if (goals.mealCount === 3) {
      return ['Śniadanie', 'Obiad', 'Kolacja'];
    }
    return ['Śniadanie', 'Drugie śniadanie', 'Obiad', 'Kolacja', 'Przekąski'];
  }, [goals.mealCount]);

  // Adjust selected category if it is not currently active
  useEffect(() => {
    if (!activeCategories.includes(selectedCategory)) {
      setSelectedCategory(activeCategories[0]);
    }
  }, [activeCategories, selectedCategory]);

  // Persist states to LocalStorage
  useEffect(() => {
    localStorage.setItem('kcal_custom_products', JSON.stringify(customProducts));
  }, [customProducts]);

  useEffect(() => {
    localStorage.setItem('kcal_user_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('kcal_daily_logs', JSON.stringify(dayLogs));
  }, [dayLogs]);

  useEffect(() => {
    localStorage.setItem('kcal_user_goals', JSON.stringify(goals));
  }, [goals]);

  // Combine static and custom products
  const productDatabase = useMemo(() => {
    return [...customProducts, ...POPULAR_PRODUCTS];
  }, [customProducts]);

  // Get or lazy-init log for current selected date
  const currentDayLog = useMemo(() => {
    const existing = dayLogs[currentDate];
    if (existing) return existing;
    return {
      date: currentDate,
      meals: [],
      waterIntakeMl: 0,
      weightKg: undefined
    };
  }, [dayLogs, currentDate]);

  // Compute daily macro and calorie consumption
  const dailyTotals = useMemo(() => {
    const meals = currentDayLog.meals;
    return meals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fat += meal.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [currentDayLog]);

  // Handle dynamic motivational tip messages
  useEffect(() => {
    const caloriesLeft = goals.calories - dailyTotals.calories;
    if (dailyTotals.calories === 0) {
      setTipMessage('Wpisz swoje dzisiejsze posiłki, aby zacząć liczyć kalorie!');
    } else if (caloriesLeft > 300) {
      setTipMessage('Dobrze Ci idzie! Masz jeszcze zapas kalorii na lekki posiłek.');
    } else if (caloriesLeft >= 0) {
      setTipMessage('Idealnie! Jesteś bardzo blisko swojego dziennego zapotrzebowania.');
    } else {
      setTipMessage('Przekroczyłeś limit kalorii. Dostosuj makroskładniki w kolejnych posiłkach.');
    }
  }, [dailyTotals, goals.calories]);

  // Update current date day logs
  const updateCurrentDayLog = (updated: Partial<DayLog>) => {
    setDayLogs((prev) => {
      const current = prev[currentDate] || {
        date: currentDate,
        meals: [],
        waterIntakeMl: 0,
        weightKg: undefined
      };
      return {
        ...prev,
        [currentDate]: {
          ...current,
          ...updated
        }
      };
    });
  };

  // Log a product portion to selected category
  const handleAddMealLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const factor = portionWeight / 100;
    const newMeal: MealLog = {
      id: 'meal-' + Date.now(),
      name: selectedProduct.name,
      calories: Math.round(selectedProduct.caloriesPer100g * factor),
      protein: parseFloat((selectedProduct.proteinPer100g * factor).toFixed(1)),
      carbs: parseFloat((selectedProduct.carbsPer100g * factor).toFixed(1)),
      fat: parseFloat((selectedProduct.fatPer100g * factor).toFixed(1)),
      weightGrams: portionWeight,
      category: selectedCategory,
      loggedAt: new Date().toISOString()
    };

    const currentMeals = currentDayLog.meals;
    updateCurrentDayLog({
      meals: [...currentMeals, newMeal]
    });

    // Reset temporary layout states
    setSelectedProduct(null);
    setSearchTerm('');
    setPortionWeight(100);
  };

  // Delete logged meal item
  const handleDeleteMeal = (mealId: string) => {
    const filteredMeals = currentDayLog.meals.filter((m) => m.id !== mealId);
    updateCurrentDayLog({
      meals: filteredMeals
    });
  };

  // Add custom user product to database
  const handleAddCustomProduct = (prod: Product) => {
    setCustomProducts((prev) => [prod, ...prev]);
    setShowProductForm(false);
  };

  // Remove a custom product from permanent library
  const handleDeleteCustomProduct = (productId: string) => {
    setCustomProducts((prev) => prev.filter((p) => p.id !== productId));
    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }
  };

  // Save a new recipe
  const handleSaveRecipe = (recipe: Recipe) => {
    setRecipes((prev) => [recipe, ...prev]);
  };

  // Delete an existing recipe from database
  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  // Import custom products and recipes from sync code
  const handleImportData = (importedProducts: Product[], importedRecipes: Recipe[]) => {
    setCustomProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filteredNew = importedProducts.map(p => ({ ...p, isCustom: true })).filter((p) => !existingIds.has(p.id));
      return [...filteredNew, ...prev];
    });

    setRecipes((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const filteredNew = importedRecipes.filter((r) => !existingIds.has(r.id));
      return [...filteredNew, ...prev];
    });
  };

  // Log a specific cooked portion of a recipe
  const handleLogRecipe = (recipe: Recipe, portionWeightGrams: number, category: MealCategory) => {
    const ratio = portionWeightGrams / recipe.totalWeightGrams;
    const newMeal: MealLog = {
      id: 'meal-' + Date.now(),
      name: `[Przepis] ${recipe.name}`,
      calories: Math.round(recipe.totalCalories * ratio),
      protein: parseFloat((recipe.totalProtein * ratio).toFixed(1)),
      carbs: parseFloat((recipe.totalCarbs * ratio).toFixed(1)),
      fat: parseFloat((recipe.totalFat * ratio).toFixed(1)),
      weightGrams: portionWeightGrams,
      category: category,
      loggedAt: new Date().toISOString()
    };

    const currentMeals = currentDayLog.meals;
    updateCurrentDayLog({
      meals: [...currentMeals, newMeal]
    });
    
    setActiveTab('dziennik');
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  // Reset current selection or log
  const handleResetDay = () => {
    if (window.confirm('Czy na pewno chcesz usunąć wszystkie dzisiejsze wpisy, wodę i wagę?')) {
      const copy = { ...dayLogs };
      delete copy[currentDate];
      setDayLogs(copy);
    }
  };

  // Filter products by query search input
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const query = searchTerm.toLowerCase();
    return productDatabase.filter((p) => p.name.toLowerCase().includes(query));
  }, [productDatabase, searchTerm]);

  // Group logged meals into their category containers
  const mealsByCategory = useMemo(() => {
    const categories: Record<string, MealLog[]> = {};
    activeCategories.forEach((cat) => {
      categories[cat] = [];
    });
    
    currentDayLog.meals.forEach((meal) => {
      if (categories[meal.category]) {
        categories[meal.category].push(meal);
      } else {
        // Fallback for missing/inactive category
        if (meal.category === 'Drugie śniadanie' && categories['Śniadanie']) {
          categories['Śniadanie'].push(meal);
        } else if (meal.category === 'Przekąski' && categories['Kolacja']) {
          categories['Kolacja'].push(meal);
        } else {
          // If no fallback matches, initialize category dynamically
          if (!categories[meal.category]) {
            categories[meal.category] = [];
          }
          categories[meal.category].push(meal);
        }
      }
    });
    return categories;
  }, [currentDayLog, activeCategories]);

  // Calculate sum of calories/macros per meal category directly
  const getCategorySum = (categoryMeals: MealLog[]) => {
    return categoryMeals.reduce(
      (acc, m) => {
        acc.calories += m.calories;
        acc.protein += m.protein;
        acc.carbs += m.carbs;
        acc.fat += m.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Safe division helpers for interactive calculators
  const caloriesForSelectedPortion = selectedProduct
    ? Math.round((selectedProduct.caloriesPer100g * portionWeight) / 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-3 sm:px-6" id="app-root">
      
      {/* Maximum Layout bounds container */}
      <div className="w-full max-w-6xl mx-auto space-y-6" id="app-inner-container">
        
        {/* Navigation / Header Brand block */}
        <header className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4" id="app-header">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-md shadow-emerald-500/10">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 font-heading tracking-tight flex items-center gap-2">
                Licznik Kalorii
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                  FitDziennik
                </span>
              </h1>
              <p className="text-xs text-slate-400">Twój osobisty asystent kalorii i makroskładników</p>
            </div>
          </div>

          {/* Quick Stats overview or reset button */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center sm:justify-end">
            <button
              onClick={() => setActiveTab('dziennik')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dziennik' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100/60'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> 
              Dziennik
            </button>
            <button
              onClick={() => setActiveTab('baza')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'baza' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> 
              Moje Produkty
            </button>
            <button
              onClick={() => setActiveTab('przepisy')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'przepisy' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100/60'
              }`}
              id="tab-przepisy"
            >
              <ChefHat className="w-3.5 h-3.5" /> 
              Moje Przepisy
            </button>
            <button
              onClick={() => setActiveTab('kopia')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'kopia' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100/60'
              }`}
              id="tab-kopia"
            >
              <Share2 className="w-3.5 h-3.5" /> 
              Udostępnianie
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

            <button
              onClick={handleResetDay}
              className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
              title="Resetuj dane dzisiejszego dnia"
              id="reset-day-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Tip Message banner */}
        <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-3.5 flex items-center gap-2 text-xs text-slate-600" id="tip-message-banner">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong className="text-emerald-700 font-bold">Wskazówka:</strong> {tipMessage}
          </span>
        </div>

        {activeTab === 'baza' && (
          /* ================= APP MODE: PRODUCT LIBRARY MANAGE ================= */
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6" id="baza-produktow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black font-heading text-slate-800">Moja Baza Produktów</h2>
                <p className="text-xs text-slate-400">Przeglądaj, wyszukuj i twórz własne wpisy żywnościowe</p>
              </div>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Nowy produkt
              </button>
            </div>

            {/* Custom product form popup */}
            <AnimatePresence>
              {showProductForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <ProductForm 
                    onAddProduct={handleAddCustomProduct} 
                    onClose={() => setShowProductForm(false)} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Wyszukaj z bazy (wpisz np. chleb, mleko, ryż...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(searchTerm.trim() ? filteredProducts : productDatabase).map((p) => (
                  <div 
                    key={p.id} 
                    className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50 transition duration-200 flex flex-col justify-between space-y-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-slate-800 text-xs font-heading tracking-tight block">
                          {p.name}
                        </span>
                        {p.isCustom ? (
                          <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700 rounded-sm shrink-0 uppercase tracking-widest leading-none">
                            Własny
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-50 text-[9px] font-medium text-slate-500 rounded-sm shrink-0 uppercase tracking-widest leading-none">
                            Standard
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-600 font-extrabold text-xs block mt-1">
                        {p.caloriesPer100g} kcal <span className="text-slate-400 font-medium text-[10px]">/ 100g</span>
                      </span>
                    </div>

                    <div className="border-t border-slate-50 pt-2 grid grid-cols-3 gap-1.5 text-center text-[10px] text-slate-500">
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Białko</span>
                        <strong className="text-slate-700">{p.proteinPer100g}g</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Węgle</span>
                        <strong className="text-slate-700">{p.carbsPer100g}g</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Tłuszcz</span>
                        <strong className="text-slate-700">{p.fatPer100g}g</strong>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1 justify-end">
                      {p.isCustom && (
                        <button
                          onClick={() => handleDeleteCustomProduct(p.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition"
                          title="Usuń produkt z bazy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setActiveTab('dziennik');
                          // focus search / logger scroll
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer"
                        title="Dodaj do dzisiejszego jadłospisu"
                      >
                        Dodaj do dziennika
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(searchDayLogsCount() === 0 && searchTerm.trim() && filteredProducts.length === 0) && (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm">Nie znaleziono takiego produktu w bazie.</p>
                  <button
                    onClick={() => {
                      setNameAndOpenForm(searchTerm);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Stwórz go teraz! <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= APP MODE: RECIPE DATABASE AND MANAGER ================= */}
        {activeTab === 'przepisy' && (
          <RecipeManager
            recipes={recipes}
            productDatabase={productDatabase}
            activeCategories={activeCategories}
            selectedCategory={selectedCategory}
            onSaveRecipe={handleSaveRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onLogRecipe={handleLogRecipe}
            onOpenProductForm={(initialName) => {
              setActiveTab('baza');
              setShowProductForm(true);
              if (initialName) {
                setSearchTerm(initialName);
              }
            }}
          />
        )}

        {/* ================= APP MODE: SHARE AND BACKUP UTILITY ================= */}
        {activeTab === 'kopia' && (
          <ShareBackup
            customProducts={customProducts}
            recipes={recipes}
            onImportData={handleImportData}
          />
        )}

        {/* ================= APP MODE: CORE MEAL DIARY ================= */}
        {activeTab === 'dziennik' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="diary-grid-root">
            
            {/* Left side: Date, Meals list, and Quick Add */}
            <div className="lg:col-span-7 space-y-6" id="left-column-diary">
              
              <DateSwitcher 
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />

              {/* Jadłospis Dzienny: Meal Logs Category List */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4" id="meal-logs-card">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black font-heading text-slate-800 flex items-center gap-1.5">
                      <Utensils className="w-5 h-5 text-emerald-500" /> Jadłospis dzienny
                    </h2>
                    <p className="text-xs text-slate-400">Poniżej znajdziesz swoje posiłki z podziałem na pory dnia</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-semibold block">Suma:</span>
                    <p className="text-base font-black text-slate-800">{dailyTotals.calories} / {goals.calories} kcal</p>
                  </div>
                </div>

                {/* Categorized Meal Logs with detailed tables */}
                <div className="space-y-4" id="category-group-list">
                  {Object.keys(mealsByCategory).map((catName) => {
                    const categoryMeals = mealsByCategory[catName];
                    const catSum = getCategorySum(categoryMeals);

                    return (
                      <div 
                        key={catName}
                        className="border border-slate-100/80 rounded-2xl overflow-hidden shadow-xs"
                        id={`category-wrapper-${catName}`}
                      >
                        {/* Category Heading panel */}
                        <div className="bg-slate-50/70 p-3 px-4 flex items-center justify-between border-b border-slate-100">
                          <span className="text-xs font-black text-slate-800 font-heading">
                            {catName}
                          </span>
                          {categoryMeals.length > 0 ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
                              {catSum.calories} kcal | B: {catSum.protein.toFixed(1)}g | W: {catSum.carbs.toFixed(1)}g | T: {catSum.fat.toFixed(1)}g
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">
                              Brak wpisów
                            </span>
                          )}
                        </div>

                        {/* Category Meal logs list */}
                        <div className="divide-y divide-slate-100 bg-white">
                          <AnimatePresence initial={false}>
                            {categoryMeals.map((meal) => (
                              <motion.div 
                                key={meal.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 px-4 flex items-center justify-between hover:bg-slate-50/45 transition overflow-hidden"
                              >
                                <div className="space-y-0.5 max-w-[70%]">
                                  <span className="text-xs font-bold text-slate-700 block tracking-tight line-clamp-1 font-sans">
                                    {meal.name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-medium font-mono">
                                    <span className="bg-slate-100 text-slate-600 px-1 rounded-sm font-bold">
                                      {meal.weightGrams}g
                                    </span>
                                    <span>
                                      B: <strong className="text-slate-600 font-bold">{meal.protein}g</strong>
                                    </span>
                                    <span>
                                      W: <strong className="text-slate-600 font-bold">{meal.carbs}g</strong>
                                    </span>
                                    <span>
                                      T: <strong className="text-slate-600 font-bold">{meal.fat}g</strong>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-extrabold text-emerald-600 text-right font-mono">
                                    {meal.calories} kcal
                                  </span>
                                  <button
                                    onClick={() => handleDeleteMeal(meal.id)}
                                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
                                    title="Usuń wpis"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {categoryMeals.length === 0 && (
                            <div className="p-4 text-center text-[11px] text-slate-400 italic font-sans">
                              Nie dodano jeszcze nic do kategorii {catName.toLowerCase()}.
                              <button
                                onClick={() => {
                                  setSelectedCategory(catName as MealCategory);
                                  // focus search input
                                  const inp = document.querySelector('input[placeholder*="np. Jajko"]');
                                  if (inp) (inp as HTMLInputElement).focus();
                                }}
                                className="block mx-auto mt-1 text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                              >
                                + Dodaj wpis
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Water Tracker (Nawodnienie pod jadłospisem) */}
              <WaterTracker 
                waterIntake={currentDayLog.waterIntakeMl}
                goalWater={goals.waterMl}
                onUpdateWater={(water) => updateCurrentDayLog({ waterIntakeMl: water })}
              />

              {/* Interactive portion selector of chosen product */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4" id="quick-food-adder-card">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 font-heading tracking-tight flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-emerald-500 animate-pulse" /> Szybkie logowanie posiłku
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Wyszukaj z bazy i dodaj zjadną porcję gramową</p>
                </div>

                {/* Autocomplete Search input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="np. Jajko, Pierś z kurczaka, Chleb..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Display Autocomplete Options */}
                {searchTerm.trim() && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 scroller" id="search-autocomplete-list">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className="w-full px-4 py-2 text-left hover:bg-white text-xs font-semibold text-slate-700 flex justify-between items-center transition"
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-extrabold">
                          {p.caloriesPer100g} kcal/100g
                        </span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="px-4 py-3 text-center text-xs text-slate-400 italic">
                        Brak pasujących produktów.
                        <button
                          onClick={() => {
                            setNameAndOpenForm(searchTerm);
                          }}
                          className="block mx-auto mt-1 te-xs font-bold text-emerald-600 hover:underline"
                        >
                          + Dodaj go jako nowy produkt
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Portions Calculator Panel */}
                <AnimatePresence mode="wait">
                  {selectedProduct ? (
                    <motion.form 
                      onSubmit={handleAddMealLog}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex flex-col space-y-3"
                      id="portion-calculator-panel"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none block">
                            WSPÓŁCZYNNIK PORCJI
                          </span>
                          <span className="font-bold text-slate-800 text-xs mt-1 block">
                            {selectedProduct.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(null)}
                          className="p-1 hover:bg-emerald-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
                        >
                          Anuluj
                        </button>
                      </div>

                      {/* Meal destination category selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">POSIŁEK:</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as MealCategory)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-emerald-500 font-bold"
                        >
                          {activeCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat === 'Śniadanie' ? '🍳 Śniadanie' :
                               cat === 'Drugie śniadanie' ? '🍎 Drugie śniadanie' :
                               cat === 'Obiad' ? '🍛 Obiad' :
                               cat === 'Kolacja' ? '🥪 Kolacja' : '🍪 Przekąski'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Weight Selector */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <label className="text-[10px] font-bold text-slate-500 block">WAGA PORCJI:</label>
                          <span className="font-extrabold text-slate-800">{portionWeight}g</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="600"
                          step="10"
                          value={portionWeight}
                          onChange={(e) => setPortionWeight(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-200 rounded-lg"
                        />
                        <div className="flex justify-between gap-1 mt-1">
                          {[50, 100, 150, 200, 300].map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setPortionWeight(w)}
                              className={`flex-1 text-[10px] font-bold py-1 rounded-md transition ${
                                portionWeight === w 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {w}g
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Calculated Instant Macro Previews */}
                      <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center space-y-2">
                        <div className="text-xs">
                          Suma w porcji: <strong className="text-emerald-600 text-sm font-extrabold">{caloriesForSelectedPortion} kcal</strong>
                        </div>
                        <div className="grid grid-cols-3 gap-1 border-t border-slate-50 pt-2 text-[10px] text-slate-500">
                          <div>
                            <span className="block text-[8px] font-bold uppercase tracking-wider">Białko</span>
                            <strong className="text-slate-700">
                              {((selectedProduct.proteinPer100g * portionWeight) / 100).toFixed(1)}g
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold uppercase tracking-wider">Węgle</span>
                            <strong className="text-slate-700">
                              {((selectedProduct.carbsPer100g * portionWeight) / 100).toFixed(1)}g
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold uppercase tracking-wider">Tłuszcz</span>
                            <strong className="text-slate-700">
                              {((selectedProduct.fatPer100g * portionWeight) / 100).toFixed(1)}g
                            </strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Zatwierdź i Dodaj do Poszkodowa
                      </button>
                    </motion.form>
                  ) : (
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-200 text-center py-6 text-xs text-slate-400">
                      Wyszukaj produkt powyżej i wybierz go, aby obliczyć miksturę. Możesz też wejść w tab "Baza Produktów", aby edytować własną kartotekę!
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side: Podsumowanie Dnia & Kontrola Wagi */}
            <div className="lg:col-span-5 space-y-6" id="right-column-diary">
              
              <DailySummary 
                totals={dailyTotals}
                goals={goals}
                onUpdateGoals={(g) => setGoals(g)}
              />

              <WeightTracker 
                currentWeight={currentDayLog.weightKg}
                onUpdateWeight={(w) => updateCurrentDayLog({ weightKg: w })}
              />

            </div>
          </div>
        )}
      </div>

      {/* Aesthetic Footer details */}
      <footer className="w-full max-w-6xl mx-auto mt-8 border-t border-slate-250 pt-4 pb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Wszystkie dane zapisują się automatycznie w Twojej przeglądarce (offline).</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> 2026 FitDziennik
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            v1.1.0
          </span>
        </div>
      </footer>
    </div>
  );

  // Helper inside loop function to filter / count 
  function searchDayLogsCount() {
    return filteredProducts.length;
  }

  function setNameAndOpenForm(nameText: string) {
    // Open Custom form and prefill field
    setShowProductForm(true);
    // Focus or wait for DOM then trigger name update in ProductForm state
    // To make it fully React standard, we can just toggle standard search tab
    // or let it render, and prompt user to enter the details.
    // Let's scroll to product form block
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}
