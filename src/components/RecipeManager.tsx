import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  BookOpen, 
  Utensils, 
  Scale, 
  Check, 
  ArrowLeft,
  ChefHat,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import { Product, Recipe, RecipeIngredient, MealCategory } from '../types';

interface RecipeManagerProps {
  recipes: Recipe[];
  productDatabase: Product[];
  activeCategories: MealCategory[];
  selectedCategory: MealCategory;
  onSaveRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onLogRecipe: (recipe: Recipe, portionWeight: number, category: MealCategory) => void;
  onOpenProductForm: (initialName?: string) => void;
}

export default function RecipeManager({
  recipes,
  productDatabase,
  activeCategories,
  selectedCategory,
  onSaveRecipe,
  onDeleteRecipe,
  onLogRecipe,
  onOpenProductForm
}: RecipeManagerProps) {
  // Navigation inside Recipes tab
  const [isCreating, setIsCreating] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');

  // --- Recipe Creation Form State ---
  const [newRecipeName, setNewRecipeName] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  
  // Creation Form -> Ingredient Selector State
  const [ingSearch, setIngSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [ingWeight, setIngWeight] = useState<number>(100);

  // --- Recipe Logging Dialog State ---
  const [loggingRecipe, setLoggingRecipe] = useState<Recipe | null>(null);
  const [logPortionWeight, setLogPortionWeight] = useState<number>(150);
  const [logCategory, setLogCategory] = useState<MealCategory>(selectedCategory);

  // Filter products for ingredients dropdown
  const filteredProducts = useMemo(() => {
    if (!ingSearch.trim()) return [];
    const query = ingSearch.toLowerCase();
    return productDatabase.filter((p) => p.name.toLowerCase().includes(query));
  }, [productDatabase, ingSearch]);

  // Filter active saved recipes
  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return recipes;
    const query = recipeSearch.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(query));
  }, [recipes, recipeSearch]);

  // Running sum statistics of the recipe being created
  const creationTotals = useMemo(() => {
    return recipeIngredients.reduce(
      (acc, ing) => {
        const factor = ing.weightGrams / 100;
        acc.weight += ing.weightGrams;
        acc.calories += Math.round(ing.caloriesPer100g * factor);
        acc.protein += ing.proteinPer100g * factor;
        acc.carbs += ing.carbsPer100g * factor;
        acc.fat += ing.fatPer100g * factor;
        return acc;
      },
      { weight: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [recipeIngredients]);

  // Macros per 100g of the finished recipe
  const creationMacrosPer100g = useMemo(() => {
    const totalWeight = creationTotals.weight;
    if (totalWeight === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      calories: Math.round((creationTotals.calories / totalWeight) * 100),
      protein: parseFloat(((creationTotals.protein / totalWeight) * 100).toFixed(1)),
      carbs: parseFloat(((creationTotals.carbs / totalWeight) * 100).toFixed(1)),
      fat: parseFloat(((creationTotals.fat / totalWeight) * 100).toFixed(1))
    };
  }, [creationTotals]);

  // Add selected product to running ingredients list
  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Check if ingredient already exists in recipe
    const existsIndex = recipeIngredients.findIndex(ing => ing.productId === selectedProduct.id);
    if (existsIndex > -1) {
      const updated = [...recipeIngredients];
      updated[existsIndex].weightGrams += ingWeight;
      setRecipeIngredients(updated);
    } else {
      const newIngredient: RecipeIngredient = {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        weightGrams: ingWeight,
        caloriesPer100g: selectedProduct.caloriesPer100g,
        proteinPer100g: selectedProduct.proteinPer100g,
        carbsPer100g: selectedProduct.carbsPer100g,
        fatPer100g: selectedProduct.fatPer100g
      };
      setRecipeIngredients([...recipeIngredients, newIngredient]);
    }

    // Reset ingredient selectors
    setSelectedProduct(null);
    setIngSearch('');
    setIngWeight(100);
  };

  // Remove an ingredient during creation
  const handleRemoveIngredient = (productId: string) => {
    setRecipeIngredients(recipeIngredients.filter(ing => ing.productId !== productId));
  };

  // Fully save the built recipe
  const handleSaveFullRecipe = () => {
    if (!newRecipeName.trim()) {
      alert('Wpisz nazwę przepisu.');
      return;
    }
    if (recipeIngredients.length === 0) {
      alert('Dodaj przynajmniej jeden składnik do przepisu.');
      return;
    }

    const savedRecipe: Recipe = {
      id: 'recipe-' + Date.now(),
      name: newRecipeName.trim(),
      ingredients: recipeIngredients,
      totalWeightGrams: creationTotals.weight,
      totalCalories: creationTotals.calories,
      totalProtein: parseFloat(creationTotals.protein.toFixed(1)),
      totalCarbs: parseFloat(creationTotals.carbs.toFixed(1)),
      totalFat: parseFloat(creationTotals.fat.toFixed(1))
    };

    onSaveRecipe(savedRecipe);

    // Reset creation states
    setIsCreating(false);
    setNewRecipeName('');
    setRecipeIngredients([]);
  };

  // Open portion logger for chosen recipe
  const handleOpenLogDialog = (recipe: Recipe) => {
    setLoggingRecipe(recipe);
    // Set default portion weight to either whole recipe or 150g
    setLogPortionWeight(recipe.totalWeightGrams);
    // Align with active category if valid
    setLogCategory(activeCategories.includes(selectedCategory) ? selectedCategory : activeCategories[0]);
  };

  // Log recipe portion to user's journal
  const handleConfirmRecipeLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingRecipe) return;

    onLogRecipe(loggingRecipe, logPortionWeight, logCategory);
    setLoggingRecipe(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6" id="baza-przepisow-root">
      
      <AnimatePresence mode="wait">
        {!isCreating ? (
          /* ================= MODE: RECIPE INDEX / LIST ================= */
          <motion.div
            key="recipe-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black font-heading text-slate-800 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-emerald-500" /> Moja Baza Przepisów
                </h2>
                <p className="text-xs text-slate-400">Komponuj złożone potrawy i łatwo loguj zjadane porcje gramowe</p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
                id="btn-stworz-przepis"
              >
                <Plus className="w-4 h-4" /> Stwórz nowy przepis
              </button>
            </div>

            {/* Recipe search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Wyszukaj przepis po nazwie (np. omlet, sałatka)..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-[1.5px] focus:outline-emerald-500 focus:bg-white transition-colors"
                id="recipe-search-input"
              />
            </div>

            {/* Recipes Grid */}
            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="recipes-grid">
                {filteredRecipes.map((recipe) => {
                  // Calculate macros per 100g of the saved recipe for a quick lookup
                  const kcalPer100g = Math.round((recipe.totalCalories / recipe.totalWeightGrams) * 100);
                  
                  return (
                    <div 
                      key={recipe.id}
                      className="p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-slate-50/40 transition duration-200 flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden"
                      id={`recipe-card-${recipe.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-extrabold text-slate-800 text-sm font-heading tracking-tight block">
                            {recipe.name}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black lowercase shrink-0">
                            {recipe.totalWeightGrams}g (całość)
                          </span>
                        </div>
                        <span className="text-emerald-600 font-extrabold text-xs block">
                          {recipe.totalCalories} kcal <span className="text-slate-400 font-medium text-[10px]">w całości</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium uppercase font-mono">
                          Średnio: {kcalPer100g} kcal / 100g
                        </span>
                      </div>

                      {/* Ingredients preview chip list */}
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1 scroller">
                        {recipe.ingredients.map((ing, i) => (
                          <span 
                            key={i} 
                            className="bg-slate-100 text-[10px] text-slate-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            {ing.name} ({ing.weightGrams}g)
                          </span>
                        ))}
                      </div>

                      {/* Macro Breakdown Footer */}
                      <div className="border-t border-slate-100/50 pt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Białko</span>
                          <strong className="text-slate-700">{recipe.totalProtein}g</strong>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Węgle</span>
                          <strong className="text-slate-700">{recipe.totalCarbs}g</strong>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Tłuszcz</span>
                          <strong className="text-slate-700">{recipe.totalFat}g</strong>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-between items-center pt-2">
                        <button
                          onClick={() => onDeleteRecipe(recipe.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition cursor-pointer"
                          title="Usuń przepis z bazy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleOpenLogDialog(recipe)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Utensils className="w-3.5 h-3.5" /> Loguj zjedzoną wagę
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">Brak przepisów w Twojej bazie.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Stwórz swój pierwszy przepis! Połączysz w nim kilka produktów, a system automatycznie obliczy cały bilans kaloryczny.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Dodaj pierwszy przepis
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* ================= MODE: CREATE RECIPE CREATOR ================= */
          <motion.div
            key="recipe-creator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="recipes-creator-panel"
          >
            {/* Header back button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setRecipeIngredients([]);
                  setNewRecipeName('');
                }}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Wróć do bazy
              </button>
              <span className="text-xs font-bold text-slate-400">Nowy przepis</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Form Column: Recipe details & Ingredient Adder */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Basic Recipe info */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">KROK 1: Nazwij swoją potrawę</span>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Nazwa Przepisu:</label>
                    <input
                      type="text"
                      placeholder="np. Moja Jajecznica Maślana ze Szczypiorkiem"
                      value={newRecipeName}
                      onChange={(e) => setNewRecipeName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-500"
                    />
                  </div>
                </div>

                {/* 2. Adding Ingredients Adder */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">KROK 2: Dodaj produkty składowe</span>
                    <button
                      type="button"
                      onClick={() => onOpenProductForm(ingSearch)}
                      className="text-[10px] font-bold text-emerald-600 hover:underline"
                    >
                      + Nowy produkt od zera
                    </button>
                  </div>

                  {/* Autocomplete Selector inside creator */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Wyszukaj składnik w bazie produktów..."
                        value={ingSearch}
                        onChange={(e) => setIngSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-[1.5px] focus:outline-emerald-500"
                      />
                    </div>

                    {/* Autocomplete dropdown options */}
                    {ingSearch.trim() && (
                      <div className="bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100 shadow-xs">
                        {filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setIngSearch('');
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between items-center"
                          >
                            <span>{p.name}</span>
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-extrabold">
                              {p.caloriesPer100g} kcal/100g
                            </span>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="px-4 py-3 text-center text-[11px] text-slate-400 italic">
                            Brak pasujących produktów.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Weight Selector for selected ingredient */}
                  <AnimatePresence>
                    {selectedProduct && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white/80 rounded-xl p-3 border border-slate-200/50 space-y-3 overflow-hidden"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">Składnik: <strong>{selectedProduct.name}</strong></span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedProduct(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                          >
                            Anuluj
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Wpisz waga (w gramach):</span>
                            <strong className="text-slate-800">{ingWeight}g</strong>
                          </div>
                          
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max="2000"
                              value={ingWeight}
                              onChange={(e) => setIngWeight(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-center text-slate-800 focus:outline-emerald-500"
                            />
                            <input
                              type="range"
                              min="5"
                              max="500"
                              step="5"
                              value={ingWeight > 500 ? 500 : ingWeight}
                              onChange={(e) => setIngWeight(parseInt(e.target.value))}
                              className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg self-center"
                            />
                          </div>

                          <div className="flex justify-between gap-1 mt-1.5">
                            {[20, 50, 100, 150, 200, 250].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setIngWeight(preset)}
                                className={`flex-1 text-[9px] font-bold py-1 rounded-sm border transition ${
                                  ingWeight === preset 
                                    ? 'bg-slate-800 border-slate-800 text-white' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {preset}g
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddIngredient}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Dodaj składnik do przepisu
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* 3. Added ingredients list with delete options */}
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest block">Komponenty Przepisu ({recipeIngredients.length})</span>
                  
                  {recipeIngredients.length > 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                      {recipeIngredients.map((ing) => {
                        const factor = ing.weightGrams / 100;
                        const ingKcal = Math.round(ing.caloriesPer100g * factor);
                        return (
                          <div key={ing.productId} className="p-3 px-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                            <div>
                              <strong className="text-slate-800 block text-xs">{ing.name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mt-0.5">
                                {ing.weightGrams}g &middot; {ingKcal} kcal (B: {(ing.proteinPer100g * factor).toFixed(1)}g, W: {(ing.carbsPer100g * factor).toFixed(1)}g, T: {(ing.fatPer100g * factor).toFixed(1)}g)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(ing.productId)}
                              className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl italic">
                      Brak składników. Przeszukaj i dodaj produkty powyżej, aby utworzyć potrawę.
                    </div>
                  )}
                </div>

              </div>
              
              {/* Right Column: Recipe Summary, Running Macros & Complete saving */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-sm space-y-6">
                  
                  <div>
                    <h3 className="text-sm font-black font-heading tracking-tight text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> Bilans całego przepisu
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Wartości sumaryczne dla surowej gotowej potrawy</p>
                  </div>

                  {/* Summary Values Box */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/65 rounded-2xl p-3 border border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">WAGA CAŁOŚCI</span>
                        <strong className="text-base font-black text-white">{creationTotals.weight} g</strong>
                      </div>
                      <div className="bg-slate-800/65 rounded-2xl p-3 border border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">KALORIE CAŁOŚCI</span>
                        <strong className="text-base font-black text-emerald-400">{creationTotals.calories} kcal</strong>
                      </div>
                    </div>

                    {/* Macro distribution bars for entire recipe */}
                    <div className="space-y-2 border-t border-b border-slate-800 py-4">
                      <span className="text-[10px] font-bold text-slate-400 block">PODZIAŁ MAKROSKŁADNIKÓW</span>
                      
                      {/* Protein */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium font-mono">
                          <span className="text-slate-300">Białko</span>
                          <strong className="text-white">{creationTotals.protein.toFixed(1)}g</strong>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-400 rounded-full transition-all" 
                            style={{ width: `${creationTotals.weight > 0 ? Math.min(100, (creationTotals.protein / creationTotals.weight) * 300) : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Carbs */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium font-mono">
                          <span className="text-slate-300">Węglowodany</span>
                          <strong className="text-white">{creationTotals.carbs.toFixed(1)}g</strong>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full transition-all" 
                            style={{ width: `${creationTotals.weight > 0 ? Math.min(100, (creationTotals.carbs / creationTotals.weight) * 300) : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Fat */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium font-mono">
                          <span className="text-slate-300">Tłuszcze</span>
                          <strong className="text-white">{creationTotals.fat.toFixed(1)}g</strong>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sky-450 bg-sky-400 rounded-full transition-all" 
                            style={{ width: `${creationTotals.weight > 0 ? Math.min(100, (creationTotals.fat / creationTotals.weight) * 300) : 0}%` }}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Calculated values per 100g snippet */}
                    <div className="bg-slate-800/80 p-3 rounded-2xl text-[11px] text-slate-300 flex items-start gap-1.5 border border-slate-800/40">
                      <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Średnia wartość na 100g:</strong>
                        <div className="grid grid-cols-4 gap-1.5 text-center mt-1.5 font-mono text-[10px] text-slate-200">
                          <div className="p-1 bg-slate-900/60 rounded-md">
                            Kcal: <strong className="text-emerald-400 block">{creationMacrosPer100g.calories}</strong>
                          </div>
                          <div className="p-1 bg-slate-900/60 rounded-md animate-pulse">
                            B: <strong className="text-white block">{creationMacrosPer100g.protein}g</strong>
                          </div>
                          <div className="p-1 bg-slate-900/60 rounded-md">
                            W: <strong className="text-white block">{creationMacrosPer100g.carbs}g</strong>
                          </div>
                          <div className="p-1 bg-slate-900/60 rounded-md">
                            T: <strong className="text-white block">{creationMacrosPer100g.fat}g</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <button
                    onClick={handleSaveFullRecipe}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition text-slate-950 rounded-xl py-3 text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-5 h-5 text-slate-900" /> ZAPISZ PRZEPIS W BAZIE
                  </button>

                </div>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL DIALOG: LOGGING PORTION OF RECIPE ================= */}
      <AnimatePresence>
        {loggingRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="log-recipe-dialog-overlay">
            <motion.form
              onSubmit={handleConfirmRecipeLog}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-md w-full border border-slate-100 space-y-5 relative overflow-hidden"
              id="log-recipe-dialog-form"
            >
              <div>
                <h3 className="text-base font-black font-heading text-slate-800 flex items-center gap-1.5">
                  <Utensils className="w-5 h-5 text-emerald-500 animate-pulse" /> Logowanie przepisu w jadłospisie
                </h3>
                <p className="text-xs text-slate-400 mt-1">Podaj wagę porcji ugotowanego przepisu, jaką dzisiaj zjadłeś.</p>
              </div>

              {/* Recipe Info details */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">PRZEPIS</span>
                  <strong className="text-slate-800 text-xs block mt-0.5">{loggingRecipe.name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Waga całkowita</span>
                  <strong className="text-slate-800 block text-xs mt-0.5">{loggingRecipe.totalWeightGrams} g</strong>
                </div>
              </div>

              {/* Meal log destination selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">KATEGORIA POSIŁKU:</label>
                <select
                  value={logCategory}
                  onChange={(e) => setLogCategory(e.target.value as MealCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-emerald-500"
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

              {/* Portion size selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>WAGA ZJEDZONEJ PORCJI:</span>
                  <strong className="text-emerald-600 shrink-0 font-extrabold text-sm font-mono">{logPortionWeight} g</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max={loggingRecipe.totalWeightGrams}
                  step="5"
                  value={logPortionWeight}
                  onChange={(e) => setLogPortionWeight(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLogPortionWeight(Math.round(loggingRecipe.totalWeightGrams / 4))}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] py-1.5 font-extrabold rounded-lg transition"
                  >
                    1/4 porcji
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogPortionWeight(Math.round(loggingRecipe.totalWeightGrams / 2))}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] py-1.5 font-extrabold rounded-lg transition"
                  >
                    Przekrój (1/2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogPortionWeight(loggingRecipe.totalWeightGrams)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] py-1.5 font-extrabold rounded-lg transition"
                  >
                    Całość (1/1)
                  </button>
                </div>
              </div>

              {/* Calculated dynamic macro preview box */}
              {(() => {
                const ratio = logPortionWeight / loggingRecipe.totalWeightGrams;
                const portionCalories = Math.round(loggingRecipe.totalCalories * ratio);
                const portionProtein = parseFloat((loggingRecipe.totalProtein * ratio).toFixed(1));
                const portionCarbs = parseFloat((loggingRecipe.totalCarbs * ratio).toFixed(1));
                const portionFat = parseFloat((loggingRecipe.totalFat * ratio).toFixed(1));

                return (
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 text-center space-y-2.5">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">MAKROSKŁADNIKI W TEJ PORCJI</span>
                    <strong className="text-xl font-black text-emerald-700 block font-heading">{portionCalories} kcal</strong>
                    
                    <div className="grid grid-cols-3 gap-1 border-t border-emerald-100/40 pt-2.5 text-[10px] text-slate-500 font-mono">
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">BIAŁKO</span>
                        <strong className="text-slate-700 font-extrabold">{portionProtein} g</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">WĘGLOWODANY</span>
                        <strong className="text-slate-700 font-extrabold">{portionCarbs} g</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">TŁUSZCZE</span>
                        <strong className="text-slate-700 font-extrabold">{portionFat} g</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Finish logging button actions */}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setLoggingRecipe(null)}
                  className="px-4 py-2 text-xs hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Zapisz do Dziennika
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
