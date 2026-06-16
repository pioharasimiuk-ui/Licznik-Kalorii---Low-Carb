import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Plus,
  Cloud,
  CloudLightning,
  User,
  Lock,
  Mail,
  LogOut,
  Wifi,
  Radio,
  ToggleLeft
} from 'lucide-react';
import { Product, Recipe, DayLog, UserGoals } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  fetchUserData, 
  fetchUserProducts, 
  fetchUserRecipes, 
  fetchUserDayLogs, 
  saveGoalsToFirebase,
  saveProductToFirebase,
  saveRecipeToFirebase,
  saveDayLogToFirebase,
  bulkUploadToFirebase 
} from '../sync';

interface ShareBackupProps {
  customProducts: Product[];
  recipes: Recipe[];
  dayLogs: Record<string, DayLog>;
  goals: UserGoals;
  setCustomProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  setDayLogs: React.Dispatch<React.SetStateAction<Record<string, DayLog>>>;
  setGoals: React.Dispatch<React.SetStateAction<UserGoals>>;
  onImportData: (importedProducts: Product[], importedRecipes: Recipe[]) => void;
}

export default function ShareBackup({
  customProducts,
  recipes,
  dayLogs,
  goals,
  setCustomProducts,
  setRecipes,
  setDayLogs,
  setGoals,
  onImportData
}: ShareBackupProps) {
  // --- Legacy Sharing States ---
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // --- Firebase Cloud Sync States ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('kcal_autosync_enabled') === 'true';
  });

  // Track Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save auto-sync preference
  useEffect(() => {
    localStorage.setItem('kcal_autosync_enabled', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncMessage(null);
    setSyncLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setSyncMessage({
        type: 'success',
        text: `Konto stworzone pomyślnie! Zalogowano jako ${userCredential.user.email}. Zalecamy wykonanie pierwszego scalenia danych.`
      });
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Wystąpił błąd podczas rejestracji.';
      if (err.code === 'auth/weak-password') errMsg = 'Hasło musi mieć co najmniej 6 znaków.';
      if (err.code === 'auth/email-already-in-use') errMsg = 'Ten adres e-mail jest już zarejestrowany.';
      if (err.code === 'auth/invalid-email') errMsg = 'Niepoprawny format adresu e-mail.';
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Rejestracja e-mailem i hasłem jest aktualnie wyłączona w Firebase Console dla tej instancji. Użyj "Zaloguj przez Google" lub poproś o włączenie metody E-mail/Password w konsoli Firebase.';
      }
      setSyncMessage({ type: 'error', text: errMsg });
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncMessage(null);
    setSyncLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setSyncMessage({
        type: 'success',
        text: `Zalogowano pomyślnie! Witaj ponownie ${userCredential.user.email}.`
      });
      setEmail('');
      setPassword('');
      
      // Auto-trigger sync merge on logins
      await handleSyncMerge(userCredential.user.uid, userCredential.user.email || '');
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Błędny e-mail lub hasło.';
      if (err.code === 'auth/invalid-credential') errMsg = 'Nieprawidłowe dane logowania. Spróbuj ponownie.';
      if (err.code === 'auth/invalid-email') errMsg = 'Niepoprawny format adresu e-mail.';
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Obsługa logowania e-mailem i hasłem jest aktualnie wyłączona w Firebase Console. Użyj przycisku "Zaloguj przez Google" (który jest zazwyczaj domyślnie aktywny) lub uaktywnij opcję "E-mail/Password" we właściwościach Firebase Autentykacji.';
      }
      setSyncMessage({ type: 'error', text: errMsg });
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setSyncMessage(null);
    setSyncLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setSyncMessage({
        type: 'success',
        text: `Zalogowano pomyślnie z Google! Witaj ${userCredential.user.email || ''}.`
      });
      
      // Auto-trigger sync merge on logins
      await handleSyncMerge(userCredential.user.uid, userCredential.user.email || '');
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Błąd logowania przez Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        errMsg = 'Okno logowania zostało zamknięte przez użytkownika.';
      } else if (err.code === 'auth/blocked-by-popup-killer') {
        errMsg = 'Blokada wyskakujących okieniek (popup blocker) uniemożliwiła otwarcie logowania.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setSyncMessage({ type: 'error', text: errMsg });
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (window.confirm('Czy na pewno chcesz się wylogować? Twoje lokalne dane zostaną zachowane.')) {
      await signOut(auth);
      setSyncMessage({ type: 'info', text: 'Wylogowano pomyślnie. Dane będą zapisywane lokalnie.' });
    }
  };

  // Perform Intelligent Merge (Cloud + Local)
  const handleSyncMerge = async (userId: string, userEmail: string) => {
    setSyncLoading(true);
    setSyncMessage({ type: 'info', text: 'Trwa synchronizacja i scalanie baz... Proszę czekać.' });
    try {
      // 1. Fetch all cloud data
      const cloudGoals = await fetchUserData(userId);
      const cloudProducts = await fetchUserProducts(userId);
      const cloudRecipes = await fetchUserRecipes(userId);
      const cloudDayLogs = await fetchUserDayLogs(userId);

      // 2. Perform Intelligent Merging
      // A. Goals: Cloud wins, or fallback to current
      const mergedGoals = cloudGoals || goals;

      // B. Custom Products: Merge by unique product ID
      const localProductIds = new Set(customProducts.map(p => p.id));
      const mergedProducts = [...customProducts];
      let productsAddedCount = 0;
      
      for (const cp of cloudProducts) {
        if (!localProductIds.has(cp.id)) {
          mergedProducts.push({ ...cp, isCustom: true });
          productsAddedCount++;
        }
      }

      // C. Recipes: Merge by unique recipe ID
      const localRecipeIds = new Set(recipes.map(r => r.id));
      const mergedRecipes = [...recipes];
      let recipesAddedCount = 0;

      for (const cr of cloudRecipes) {
        if (!localRecipeIds.has(cr.id)) {
          mergedRecipes.push(cr);
          recipesAddedCount++;
        }
      }

      // D. Day Logs: Merge by date, and merge individual meals within duplicate dates by unique meal ID!
      const mergedDayLogs = { ...dayLogs };
      let logsMergedCount = 0;

      for (const [date, cloudLog] of Object.entries(cloudDayLogs)) {
        if (!mergedDayLogs[date]) {
          mergedDayLogs[date] = cloudLog;
          logsMergedCount++;
        } else {
          // Date exists in both: merge meals list dynamically
          const localLog = { ...mergedDayLogs[date] };
          const localMealIds = new Set(localLog.meals.map(m => m.id));
          
          const uniqueCloudMeals = cloudLog.meals.filter(m => !localMealIds.has(m.id));
          localLog.meals = [...localLog.meals, ...uniqueCloudMeals];
          
          // Max water intake to avoid loss
          localLog.waterIntakeMl = Math.max(localLog.waterIntakeMl, cloudLog.waterIntakeMl);
          
          // Weight configuration
          if (cloudLog.weightKg && !localLog.weightKg) {
            localLog.weightKg = cloudLog.weightKg;
          }
          
          // Meds
          localLog.medsTaken = {
            ...(localLog.medsTaken || {}),
            ...(cloudLog.medsTaken || {})
          };

          mergedDayLogs[date] = localLog;
          logsMergedCount++;
        }
      }

      // 3. Update React local states (which updates LocalStorage automatically)
      setGoals(mergedGoals);
      setCustomProducts(mergedProducts);
      setRecipes(mergedRecipes);
      setDayLogs(mergedDayLogs);

      // 4. Send fully merged states back to Cloud Firestore
      await bulkUploadToFirebase(
        userId,
        userEmail,
        mergedGoals,
        mergedProducts,
        mergedRecipes,
        mergedDayLogs
      );

      setSyncMessage({
        type: 'success',
        text: `Udane scalenie baz danych! Dodano ${productsAddedCount} nowych potraw, ${recipesAddedCount} przepisów i zsynchronizowano wpisy z ${logsMergedCount} dni.`
      });
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: 'Błąd synchronizacji. Sprawdź połączenie internetowe.' });
    } finally {
      setSyncLoading(false);
    }
  };

  // Force Push local base to cloud (Overwrite)
  const handlePushToCloud = async () => {
    if (!user) return;
    if (window.confirm('Czy na pewno chcesz ZASTĄPIĆ wszystkie kopie w chmurze aktualnymi danymi z tego urządzenia? Dane innych urządzeń mogą zostać nadpisane.')) {
      setSyncLoading(true);
      setSyncMessage({ type: 'info', text: 'Wysyłanie bazy do chmury...' });
      try {
        await bulkUploadToFirebase(
          user.uid,
          user.email || '',
          goals,
          customProducts,
          recipes,
          dayLogs
        );
        setSyncMessage({ type: 'success', text: 'Gratulacje! Baza danych w chmurze została w pełni nadpisana aktualnymi danymi z telefonu.' });
      } catch (err) {
        console.error(err);
        setSyncMessage({ type: 'error', text: 'Nie udało się wysłać danych.' });
      } finally {
        setSyncLoading(false);
      }
    }
  };

  // Force Pull cloud base to local (Overwrite)
  const handlePullFromCloud = async () => {
    if (!user) return;
    if (window.confirm('Czy na pewno chcesz USUNĄĆ wszystkie wpisy na tym urządzeniu i zastąpić je danymi z chmury? Te zmodyfikowane lokalnie dane zostaną bezpowrotnie utracone.')) {
      setSyncLoading(true);
      setSyncMessage({ type: 'info', text: 'Pobieranie bazy z chmury...' });
      try {
        const cloudGoals = await fetchUserData(user.uid);
        const cloudProducts = await fetchUserProducts(user.uid);
        const cloudRecipes = await fetchUserRecipes(user.uid);
        const cloudDayLogs = await fetchUserDayLogs(user.uid);

        if (cloudGoals) setGoals(cloudGoals);
        setCustomProducts(cloudProducts);
        setRecipes(cloudRecipes);
        setDayLogs(cloudDayLogs);

        setSyncMessage({ type: 'success', text: 'Pomyślnie zastąpiono lokalną bazę danymi z chmury!' });
      } catch (err) {
        console.error(err);
        setSyncMessage({ type: 'error', text: 'Nie udało się pobrać danych z chmury.' });
      } finally {
        setSyncLoading(false);
      }
    }
  };

  // Legacy local base64 code generator
  const generateExportCode = (): string => {
    try {
      const payload = {
        version: 1,
        customProducts,
        recipes
      };
      const jsonString = JSON.stringify(payload);
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
        message: 'Kod importu nie może być pusty. Wklej kod!'
      });
      return;
    }

    try {
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
          message: 'Brak danych do zaimportowania.'
        });
        return;
      }

      onImportData(importedProducts, importedRecipes);
      
      setImportStatus({
        success: true,
        message: `Sukces! Pomyślnie dodano ${importedProducts.length} produktów i ${importedRecipes.length} przepisów!`
      });
      setImportCode('');
    } catch (err) {
      console.error(err);
      setImportStatus({
        success: false,
        message: 'Nieprawidłowy kod.'
      });
    }
  };

  return (
    <div className="space-y-6" id="share-backup-root">
      
      {/* 1. CLOUD SYNCHRONIZATION (FIREBASE) BLOCK */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div>
          <h2 className="text-lg font-black font-heading text-slate-800 flex items-center gap-2">
            <Cloud className="w-5.5 h-5.5 text-blue-500" /> Synchronizacja w Chmurze (Firebase)
          </h2>
          <p className="text-xs text-slate-400">
            Automatyczne łącznie i bezpieczny podgląd wpisów na wszystkich urządzeniach (komputer, telefon, tablet)
          </p>
        </div>

        {authLoading ? (
          <div className="flex justify-center items-center py-6 text-xs text-slate-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            Weryfikacja stanu połączenia...
          </div>
        ) : !user ? (
          /* NOT LOGGED IN FRAME */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
              <div className="space-y-3.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[10px] font-black tracking-wider text-blue-600 uppercase rounded-full">
                  <Wifi className="w-3.5 h-3.5" /> Synchronizacja Offline-to-Online
                </span>
                
                <h3 className="text-sm font-extrabold text-slate-800">
                  Jak działa synchronizacja między telefonem a przeglądarką?
                </h3>
                
                <p className="text-xs text-slate-500 leading-relaxed space-y-2">
                  Teraz możesz bez problemu spiąć swoją aplikację mobilną oraz komputer w jedną spójną całość! 
                  Po zarejestrowaniu darmowego konta:
                </p>

                <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                  <li><strong>Automatyczny zapis</strong>: Każdy wpis posiłku, wody czy wagi trafi od razu do chmury.</li>
                  <li><strong>Szybkie łączenie</strong>: Zaloguj się tymi samymi danymi na telefonie, a cała Twoja historia od razu się połączy.</li>
                  <li><strong>Pełne bezpieczeństwo</strong>: Twoje wpisy są chronione przez szyfrowanie Firebase.</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 leading-normal">
                💡 <strong>Ważne:</strong> Twoje obecne lokalne wpisy nie znikną! Po zalogowaniu zostaniesz poproszony o kliknięcie <strong>Scal dane</strong>, co połączy wpisy z telefonu z chmurą bez usuwania czegokolwiek.
              </div>
            </div>

            {/* REGISTER & LOGIN PANEL */}
            <form 
              onSubmit={isRegistering ? handleRegister : handleLogin}
              className="md:col-span-5 bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-xs"
            >
              <div className="flex border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); setSyncMessage(null); }}
                  className={`flex-1 text-xs font-bold pb-2 transition border-b-2 ${
                    !isRegistering ? 'border-blue-500 text-blue-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Logowanie
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setSyncMessage(null); }}
                  className={`flex-1 text-xs font-bold pb-2 transition border-b-2 ${
                    isRegistering ? 'border-blue-500 text-blue-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Rejestracja darmowa
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="twoj@email.com"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-blue-500 rounded-xl pl-9 pr-3 py-1.8 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Hasło</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-blue-500 rounded-xl pl-9 pr-3 py-1.8 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={syncLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                {syncLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isRegistering ? (
                  'Stwórz darmowe konto'
                ) : (
                  'Zaloguj się do chmury'
                )}
              </button>

              <div className="relative my-2 flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">LUB</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={syncLoading}
                className="w-full bg-slate-50 hover:bg-slate-100 disabled:bg-slate-200 disabled:text-slate-400 border border-slate-200 text-slate-700 rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.3 1.5-1.12 2.76-2.38 3.6l3.65 2.84c2.15-1.98 3.865-4.9 3.865-8.29z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.65-2.84c-1.01.67-2.31 1.09-4.31 1.09-3.32 0-6.14-2.24-7.14-5.26H1.08v2.96C3.06 20.19 7.23 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M4.86 14.08a7.18 7.18 0 0 1 0-4.16V6.96H1.08a11.97 11.97 0 0 0 0 10.08l3.78-2.96z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.23 0 3.06 3.81 1.08 7.96l3.78 2.96c1-3.02 3.82-5.17 7.14-5.17z"
                  />
                </svg>
                Zaloguj przez Google (Zalecane)
              </button>

              {/* Status messages info */}
              {syncMessage && (
                <div className={`p-3 rounded-xl border text-xs leading-normal ${
                  syncMessage.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-medium' 
                    : syncMessage.type === 'error'
                    ? 'bg-rose-50 border-rose-100 text-rose-800'
                    : 'bg-blue-50 border-blue-105 text-blue-800'
                }`}>
                  {syncMessage.text}
                </div>
              )}
            </form>
          </div>
        ) : (
          /* SIGNED IN CONTROLS */
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    POŁĄCZONO Z CHMURĄ FIREBASE
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border border-slate-200 hover:bg-rose-55 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl text-xs font-bold text-slate-500 transition flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Wyloguj się
              </button>
            </div>

            {/* Sync control core actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-150 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                    🟢 1. Scal dane razem
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    Pobiera dane z chmury i łączy je bezstratnie z danymi zapisanymi na urządzeniu. Idealna opcja przy pierwszym logowaniu!
                  </p>
                </div>
                <button
                  onClick={() => handleSyncMerge(user.uid, user.email || '')}
                  disabled={syncLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 text-white rounded-lg py-1.8 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} /> Scal bazy
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-150 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                    📤 2. Wyślij lokalne
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    Nadpisuje bazę w chmurze danymi z tego urządzenia. Użyj, jeśli to urządzenie ma najnowszy, prawidłowy jadłospis.
                  </p>
                </div>
                <button
                  onClick={handlePushToCloud}
                  disabled={syncLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white rounded-lg py-1.8 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Wyślij do chmury
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-150 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                    📥 3. Pobierz z chmury
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    Usuwa lokalne wpisy tego urządzenia i zastępuje je danymi pobranymi z chmury Firebase.
                  </p>
                </div>
                <button
                  onClick={handlePullFromCloud}
                  disabled={syncLoading}
                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-100 text-white rounded-lg py-1.8 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Pobierz z chmury
                </button>
              </div>
            </div>

            {/* AutoSync Indicator Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
                <div>
                  <strong className="text-blue-900 block font-bold">Automatyczny zapis w tle</strong>
                  <span className="text-[10.5px] text-slate-500">Każda modyfikacja jadłospisu od razu trafia na serwer</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">{autoSyncEnabled ? 'AKTYWNY' : 'WYŁĄCZONY'}</span>
                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoSyncEnabled ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Status messages info */}
            {syncMessage && (
              <div className={`p-3 rounded-xl border text-xs leading-normal ${
                syncMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-805 text-emerald-800 font-medium' 
                  : syncMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-100 text-rose-800'
                  : 'bg-blue-50 border-blue-105 text-blue-800'
              }`}>
                {syncMessage.text}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ================= COLUMN 1: INTERACTIVE SYNC / SHARING CODES ================= */}
        <div className="space-y-6">
          
          {/* Export Code generator panel */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-3 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 font-heading">
              <Download className="w-4.5 h-4.5 text-emerald-500" /> Szybkie udostępnianie (Kod jednorazowy)
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chcesz jednorazowo przenieść swoje produkty i przepisy bez zakładania konta? Skopiuj ten tymczasowy kod i wklej go na drugim telefonie.
            </p>

            <div className="relative mt-2">
              <textarea
                readOnly
                value={exportCode}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full h-24 bg-slate-50 border border-slate-150 rounded-xl p-3 text-[10px] text-slate-500 font-mono focus:outline-none resize-none break-all"
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
          <form onSubmit={handleImport} className="bg-white rounded-3xl p-6 border border-slate-100 space-y-3 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 font-heading">
              <Upload className="w-4.5 h-4.5 text-emerald-500" /> Importuj baze (Z jednorazowego kodu)
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Wklej tutaj kod jednorazowy od znajomego. Nowe potrawy i przepisy zostaną bezpiecznie scalone bez usuwania Twoich wpisów!
            </p>

            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="w-full h-20 bg-slate-50 border border-slate-150 focus:border-emerald-500 focus:outline-[1.5px] focus:outline-emerald-500 focus:bg-white rounded-xl p-3 text-[10px] text-slate-700 font-mono resize-none"
              placeholder="Wklej tutaj otrzymany długi kod tekstowy..."
            />

            <button
              type="submit"
              disabled={!importCode.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-450 text-white rounded-xl py-2 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Importuj i scal potrawy
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
          <div className="bg-emerald-50/40 rounded-3xl p-6 border border-emerald-100 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-500" /> Synchronizacja w APK na Telefonie
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Zalogowanie się w aplikacji mobilnej do tego samego konta pozwoli Ci na bieżąco uzupełniać jadłospis w ciągu dnia na telefonie i automatycznie widzieć go po powrocie do domu na komputerze:
            </p>

            <div className="space-y-3.5 mt-2">
              <div className="flex gap-2.5 items-start text-xs">
                <span className="w-5 h-5 rounded-full bg-blue-605 bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-800 block">Stwórz darmowe konto powyżej</strong>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">
                    Wypełnij krótki formularz "Rejestracja darmowa" w sekcji wyżej bezpośrednio na tym komputerze lub w przeglądarce i zatwierdź.
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start text-xs">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-800 block">Kliknij "Scal bazy" (Pierwsza konfiguracja)</strong>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">
                    Ten krok wyśle Twoje dotychczasowe lokalne produkty i całą historię posiłków zapisaną w przeglądarce bezpiecznie do chmury Firebase.
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start text-xs">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-800 block">Zaloguj się na to samo konto w telefonie</strong>
                  <span className="text-slate-500 block text-[11px] leading-relaxed">
                    Otwórz aplikację mobilną (.apk) u siebie na smartfonie, wejdź w zakładkę synchronizacji, wybierz "Logowanie" i wpisz te same dane. Twoja baza pobierze się i spnie natychmiast!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-700 block mb-0.5">Synchronizacja jest w pełni dobrowolna</strong>
              Jeśli nie zalogujesz się na konto, aplikacja nadal działa w 100% lokalnie i bezpiecznie w Twojej przeglądarce bez przesyłania żadnych danych osobowych do internetu. Wybór należy do Ciebie!
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
