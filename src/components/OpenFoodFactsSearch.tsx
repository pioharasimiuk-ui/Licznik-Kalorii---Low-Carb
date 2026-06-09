import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Loader2, 
  FileCheck, 
  Database, 
  Globe, 
  Sparkles,
  Barcode,
  ShoppingBag,
  Heart,
  ExternalLink
} from 'lucide-react';
import { Product } from '../types';

interface OpenFoodFactsSearchProps {
  onImportProduct: (product: Product) => void;
  customProducts: Product[];
}

interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_pl?: string;
  brands?: string;
  image_front_small_url?: string;
  image_front_thumb_url?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_value'?: number;
    'energy_105g'?: number; // fallback
    energy_100g?: number;
    proteins_100g?: number;
    proteins_value?: number;
    carbohydrates_100g?: number;
    carbohydrates_value?: number;
    fat_100g?: number;
    fat_value?: number;
  };
}

export default function OpenFoodFactsSearch({ onImportProduct, customProducts }: OpenFoodFactsSearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorOnSearch, setErrorOnSearch] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Parse a single OFF API product record into our internal Product type
  const parseOFFProduct = (item: OFFProduct): Product | null => {
    const name = item.product_name_pl || item.product_name || '';
    if (!name.trim()) return null;

    const brand = item.brands ? ` (${item.brands})` : '';
    const fullName = `${name}${brand}`.trim();

    // Parse nutriments safely
    const nutriments = item.nutriments || {};
    let calories = 0;
    if (typeof nutriments['energy-kcal_100g'] === 'number') {
      calories = nutriments['energy-kcal_100g'];
    } else if (typeof nutriments['energy-kcal_value'] === 'number') {
      calories = nutriments['energy-kcal_value'];
    } else if (typeof nutriments.energy_100g === 'number') {
      // open food facts sometimes returns Kj (kilojoule), we convert to kcal (1 kcal = 4.184 kj)
      calories = Math.round(nutriments.energy_100g / 4.184);
    }

    const protein = typeof nutriments.proteins_100g === 'number' ? nutriments.proteins_100g : (typeof nutriments.proteins_value === 'number' ? nutriments.proteins_value : 0);
    const carbs = typeof nutriments.carbohydrates_100g === 'number' ? nutriments.carbohydrates_100g : (typeof nutriments.carbohydrates_value === 'number' ? nutriments.carbohydrates_value : 0);
    const fat = typeof nutriments.fat_100g === 'number' ? nutriments.fat_100g : (typeof nutriments.fat_value === 'number' ? nutriments.fat_value : 0);

    return {
      id: `off-${item.code || Date.now() + Math.random().toString()}`,
      name: fullName,
      caloriesPer100g: Math.round(calories),
      proteinPer100g: Number(protein.toFixed(1)),
      carbsPer100g: Number(carbs.toFixed(1)),
      fatPer100g: Number(fat.toFixed(1)),
      isCustom: true, // Imported items behave as editable custom items
      imageUrl: item.image_front_small_url || item.image_front_thumb_url || undefined,
      barcode: item.code || undefined
    };
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setErrorOnSearch('');
    setHasSearched(true);
    setResults([]);

    try {
      // Determine if searching for barcode (only digits, 8-14 chars)
      const isBarcode = /^\d{8,14}$/.test(cleanQuery);

      if (isBarcode) {
        // Barcode query endpoint
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanQuery}.json`);
        if (!response.ok) {
          throw new Error('Nie udało się połączyć z bazą Open Food Facts.');
        }
        const data = await response.json();
        if (data.status === 1 && data.product) {
          const parsed = parseOFFProduct(data.product);
          if (parsed) {
            setResults([parsed]);
          } else {
            setResults([]);
          }
        } else {
          setResults([]);
        }
      } else {
        // Text keyword query endpoint on global CORS-enabled server
        const response = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=true&page_size=24&fields=code,product_name,product_name_pl,brands,image_front_small_url,image_front_thumb_url,nutriments`
        );
        if (!response.ok) {
          throw new Error('Błąd połączenia z bazą Open Food Facts.');
        }
        const data = await response.json();
        
        if (data && Array.isArray(data.products)) {
          const parsedList = data.products
            .map((p: OFFProduct) => parseOFFProduct(p))
            .filter((p: Product | null): p is Product => p !== null);
          setResults(parsedList);
        } else {
          setResults([]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorOnSearch('Nie udało się pobrać danych ze serwera Open Food Facts. Sprawdź swoje połączenie z internetem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = (product: Product) => {
    onImportProduct(product);
    setSuccessId(product.id);
    // Auto reset notification badge
    setTimeout(() => {
      setSuccessId(null);
    }, 2500);
  };

  // Check if product is already added based on name or barcode
  const isAlreadyImported = (product: Product): boolean => {
    return customProducts.some(
      cp => cp.name.toLowerCase() === product.name.toLowerCase() || 
      (product.barcode && cp.barcode === product.barcode)
    );
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 rounded-3xl p-5 border border-indigo-150/55 shadow-xs space-y-4" id="off-search-container">
      
      {/* Title & Badge */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black font-heading text-slate-805 text-indigo-950 flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-indigo-500 animate-pulse" /> Skaner & Baza Open Food Facts
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Wyszukaj z darmowej, ogólnodostępnej bazy milionów produktów. Wpisz nazwę, markę lub skanuj kod kreskowy!
          </p>
        </div>
        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
          <Database className="w-3 h-3" /> Chmura LIVE
        </span>
      </div>

      {/* Input query form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-indigo-400">
            {/^\d+$/.test(query) ? <Barcode className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </span>
          <input
            type="text"
            placeholder="Wpisz np. 'Almette rzodkiewka', 'Skittles', lub kod: '5900251123456'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-[1.5px] focus:outline-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 shadow-xs"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-xl px-4 py-2 text-xs transition duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <>Szukaj w bazie</>
          )}
        </button>
      </form>

      {/* Helper fast links prompts */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
        <span>Przykłady:</span>
        {['Skyr', 'Serek Wiejski Piątnica', 'Bake Rolls', 'Owsiane', '5900251196429'].map((demo) => (
          <button
            key={demo}
            type="button"
            onClick={() => {
              setQuery(demo);
              setTimeout(() => {
                const btn = document.createElement('button');
                btn.type = 'submit';
                // Trigger fake search
              });
            }}
            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] text-slate-600 transition cursor-pointer"
          >
            {demo}
          </button>
        ))}
      </div>

      {/* Results panel */}
      {errorOnSearch && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl" id="off-error">
          {errorOnSearch}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Odpytujemy serwer Open Food Facts...</p>
        </div>
      )}

      {hasSearched && !isLoading && results.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 text-xs">
            Brak wyników dla <strong className="text-slate-700">„{query}”</strong>. 
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Upewnij się, czy wpisano prawidłową nazwę lub kod kreskowy ze skanera.
          </p>
        </div>
      )}

      {results.length > 0 && !isLoading && (
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">
            Wyniki wyszukiwania ({results.length}):
          </h4>
          
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2 divide-y divide-slate-105 scrollbar-thin">
            {results.map((product) => {
              const imported = isAlreadyImported(product);
              const isSuccess = successId === product.id;

              return (
                <div 
                  key={product.id} 
                  className="pt-2 hover:bg-slate-50/60 p-2 rounded-xl transition duration-150 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Img or icon */}
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-100 shadow-2xs shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100/40 flex items-center justify-center text-indigo-700 font-extrabold text-[10px] shrink-0">
                        OFF
                      </div>
                    )}

                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-800 leading-tight block text-[11px] sm:text-xs truncate" title={product.name}>
                        {product.name}
                      </span>
                      
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-indigo-650 text-indigo-600 font-extrabold">{product.caloriesPer100g} kcal/100g</span>
                        {product.barcode && (
                          <span className="flex items-center gap-0.5 bg-slate-100 px-1 py-0.2 rounded text-[9px] font-mono text-slate-500">
                            <Barcode className="w-2.5 h-2.5" /> {product.barcode}
                          </span>
                        )}
                      </div>

                      {/* Small macronutrients list */}
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        B: <strong>{product.proteinPer100g}g</strong> • W: <strong>{product.carbsPer100g}g</strong> • T: <strong>{product.fatPer100g}g</strong>
                      </span>
                    </div>
                  </div>

                  {/* Add action */}
                  <button
                    onClick={() => handleImport(product)}
                    disabled={imported && !isSuccess}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black tracking-tight shrink-0 flex items-center gap-1 cursor-pointer transition ${
                      isSuccess
                        ? 'bg-emerald-600 text-white scale-105 shadow-sm'
                        : imported
                        ? 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                        : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 shadow-2xs'
                    }`}
                  >
                    {isSuccess ? (
                      <>Pomyślnie dodano!</>
                    ) : imported ? (
                      <>Już w bazie</>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Dodaj do bazy
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Information disclaimer */}
      <p className="text-[9px] text-slate-400 leading-relaxed text-center px-4 mt-2">
        Dane są pobierane w czasie rzeczywistym z wolnej, otwartej bazy <a href="https://pl.openfoodfacts.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-750 inline-flex items-center gap-0.5">Open Food Facts <ExternalLink className="w-2 h-2" /></a> współtworzonej przez miliony konsumentów na całym świecie.
      </p>

    </div>
  );
}
