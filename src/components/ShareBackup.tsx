import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  Info, 
  Smartphone, 
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Product, Recipe } from '../types';

interface ShareBackupProps {
  customProducts: Product[];
  recipes: Recipe[];
  onImportData: (importedProducts: Product[], importedRecipes: Recipe[]) => void;
}

export default function ShareBackup({
  customProducts,
  recipes,
  onImportData
}: ShareBackupProps) {
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Generate Base64 string from custom products and recipes
  const generateExportCode = (): string => {
    try {
      const payload = {
        version: 1,
        customProducts,
        recipes
      };
      const jsonString = JSON.stringify(payload);
      // Polish characters support in base64 encoding
      const utf8Bytes = new TextEncoder().encode(jsonString);
      const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
      return btoa(binaryString);
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  const exportCode = generateExportCode();

  const handleCopy = () => {
    if (!exportCode) return;
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    const cleanedCode = importCode.trim();

    if (!cleanedCode) {
      setImportStatus({
        success: false,
        message: 'Kod importu nie może być pusty. Wklej kod otrzymany od znajomego!'
      });
      return;
    }

    try {
      // Decode Base64 with Polish characters support
      const binaryString = atob(cleanedCode);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const jsonString = new TextDecoder().decode(bytes);
      const payload = JSON.parse(jsonString);

      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid format');
      }

      const importedProducts: Product[] = Array.isArray(payload.customProducts) ? payload.customProducts : [];
      const importedRecipes: Recipe[] = Array.isArray(payload.recipes) ? payload.recipes : [];

      if (importedProducts.length === 0 && importedRecipes.length === 0) {
        setImportStatus({
          success: false,
          message: 'Podany kod nie zawiera żadnych produktów i przepisów do zaimportowania.'
        });
        return;
      }

      // Call import function to merge other's database with theirs
      onImportData(importedProducts, importedRecipes);
      
      setImportStatus({
        success: true,
        message: `Sukces! Pomyślnie dodano ${importedProducts.length} produktów i ${importedRecipes.length} przepisów do Twojej bazy!`
      });
      setImportCode('');
    } catch (err) {
      console.error(err);
      setImportStatus({
        success: false,
        message: 'Nieprawidłowy kod. Upewnij się, że skopiowano cały tekst i niczego nie pominięto.'
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6" id="share-backup-root">
      
      {/* Tab Header description */}
      <div>
        <h2 className="text-lg font-black font-heading text-slate-800 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-500" /> Udostępnianie i Kopia zapasowa
        </h2>
        <p className="text-xs text-slate-400">Przenoś swoją bazę potraw na inne urządzenia lub wyślij do koleżanki</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ================= COLUMN 1: INTERACTIVE SYNC / SHARING CODES ================= */}
        <div className="space-y-6">
          
          {/* Export Code generator panel */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> 1. Eksportuj swoje produkty i przepisy
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Stworzyłeś własne dania, jajecznice lub szejki? Skopiuj ten unikalny kod i prześlij go koleżance. Wklejając go u siebie na telefonie, natychmiast otrzyma całą Twoją bazę przepisów!
            </p>

            <div className="relative mt-2">
              <textarea
                readOnly
                value={exportCode}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full h-24 bg-white border border-slate-200 rounded-xl p-3 text-[10px] text-slate-400 font-mono focus:outline-none resize-none break-all"
                placeholder="Wygląda na to, że Twoja baza jest pusta. Dodaj jakieś elementy!"
              />
              
              <button
                onClick={handleCopy}
                disabled={!exportCode}
                className={`absolute bottom-3 right-3 rounded-lg px-3 py-1.5 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition shadow-xs ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-200 disabled:text-slate-450'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Skopiowano!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Skopiuj kod bazy
                  </>
                )}
              </button>
            </div>

            <div className="text-[10px] text-slate-400 flex justify-between px-1">
              <span>Baza zawiera: <strong>{customProducts.length} wł. produktów</strong>, <strong>{recipes.length} przepisów</strong></span>
            </div>
          </div>

          {/* Import Code input panel */}
          <form onSubmit={handleImport} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> 2. Importuj i scal bazę na telefonie
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Otrzymałeś kod od znajomego? Wklej go w poniższe pole. Nowe produkty i przepisy zostaną automatycznie bezpiecznie dodane do Twojej bazy, bez usuwania Twoich własnych wpisów!
            </p>

            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="w-full h-20 bg-white border border-slate-200 focus:border-emerald-500 focus:outline-[1.5px] focus:outline-emerald-500 rounded-xl p-3 text-[10px] text-slate-700 font-mono resize-none"
              placeholder="Wklej tutaj otrzymany długi kod tekstowy..."
            />

            <button
              type="submit"
              disabled={!importCode.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-450 text-white rounded-xl py-2 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Importuj i scal dane
            </button>

            {/* Import Feedback message */}
            {importStatus && (
              <div className={`p-3 rounded-xl border text-xs leading-normal ${
                importStatus.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-850 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {importStatus.message}
              </div>
            )}
          </form>

        </div>

        {/* ================= COLUMN 2: EDUCATION AND INSTRUCTIONS ================= */}
        <div className="space-y-4">
          
          {/* APK Instruction card */}
          <div className="bg-emerald-50/40 rounded-3xl p-5 border border-emerald-100 space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-500" /> Jak udostępnić aplikację koleżance?
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Ponieważ stworzona przez Ciebie aplikacja działa bezpośrednio na Twoim systemie, nie musisz jej programować na nowo! Cały proces udostępniania i uruchomienia na telefonie Twojej koleżanki zajmie 1 minutę:
            </p>

            <div className="space-y-3.5 mt-2">
              <div className="flex gap-2.5 items-start text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-800 block">Wyślij jej plik instalacyjny (.apk)</strong>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">
                    Plik <code className="bg-white/80 px-1 border rounded text-[10px] text-slate-700">app-debug.apk</code>, który pobrałeś na komputer i przesłałeś na swój telefon, prześlij również do swojej znajomej (możesz go wrzucić na Google Drive, przesłać mailem lub za pomocą WhatsApp / Telegrama).
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-800 block">Zezwolenie na instalację</strong>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">
                    U znajomej na telefonie, po kliknięciu w plik instalacyjny, wyskoczy okienko systemu Android ostrzegające o instalacji z nieznanych źródeł (ponieważ aplikacja nie pochodzi ze sklepu Google Play). Powinna wybrać opcję <strong className="text-emerald-700">Zainstaluj mimo to</strong> lub <strong className="text-emerald-700">Więcej szczegółów &rarr; Zezwól</strong>.
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-800 block">Gotowe! To niezależna instalacja</strong>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">
                    Koleżanka ma teraz idealnego klona Twojej aplikacji na swoim telefonie. Jej cele kaloryczne, dzienniki, woda i produkty zapisywane są tylko u niej – działają w pełni lokalnie i bez zbędnych kont online!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-650 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-700 block mb-0.5">Wszelkie dane są w pełni prywatne</strong>
              Twoja aplikacja celowo nie przesyła żadnych danych do sieci – nie potrzebuje logowania, reklam ani profilowania. Całkowite bezpieczeństwo i stuprocentowa kontrola bez śledzenia!
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
