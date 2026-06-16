import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, Recipe, DayLog, UserGoals } from './types';

/**
 * Recursively removes all 'undefined' properties from an object so that Firestore does not throw
 * "Unsupported field value: undefined" errors. It also ensures nested objects and arrays are sanitized.
 */
export function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as any; 
  }
  if (val === null) {
    return null as any;
  }
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof val === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(val as any)) {
      const value = (val as any)[key];
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return val;
}

// Save/Update User Goals
export async function saveGoalsToFirebase(userId: string, goals: UserGoals, email: string) {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), sanitizeForFirestore({
      uid: userId,
      email: email,
      goals,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch User Profile of Goals
export async function fetchUserData(userId: string): Promise<UserGoals | null> {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.goals || null;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Save/Update a Single Custom Product
export async function saveProductToFirebase(userId: string, product: Product) {
  const path = `users/${userId}/customProducts/${product.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'customProducts', product.id), sanitizeForFirestore({
      ...product,
      // For type enforcement, ensure undefined fields are removed
      imageUrl: product.imageUrl || '',
      barcode: product.barcode || '',
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Custom Product
export async function deleteProductFromFirebase(userId: string, productId: string) {
  const path = `users/${userId}/customProducts/${productId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'customProducts', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Fetch All Custom Products
export async function fetchUserProducts(userId: string): Promise<Product[]> {
  const path = `users/${userId}/customProducts`;
  try {
    const querySnap = await getDocs(collection(db, 'users', userId, 'customProducts'));
    const products: Product[] = [];
    querySnap.forEach((doc) => {
      products.push(doc.data() as Product);
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Save/Update a Single Recipe
export async function saveRecipeToFirebase(userId: string, recipe: Recipe) {
  const path = `users/${userId}/recipes/${recipe.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'recipes', recipe.id), sanitizeForFirestore(recipe));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Recipe
export async function deleteRecipeFromFirebase(userId: string, recipeId: string) {
  const path = `users/${userId}/recipes/${recipeId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'recipes', recipeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Fetch All Recipes
export async function fetchUserRecipes(userId: string): Promise<Recipe[]> {
  const path = `users/${userId}/recipes`;
  try {
    const querySnap = await getDocs(collection(db, 'users', userId, 'recipes'));
    const recipes: Recipe[] = [];
    querySnap.forEach((doc) => {
      recipes.push(doc.data() as Recipe);
    });
    return recipes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Save/Update Daily Log
export async function saveDayLogToFirebase(userId: string, date: string, dayLog: DayLog) {
  const path = `users/${userId}/dayLogs/${date}`;
  try {
    await setDoc(doc(db, 'users', userId, 'dayLogs', date), sanitizeForFirestore({
      date: dayLog.date,
      meals: dayLog.meals || [],
      waterIntakeMl: dayLog.waterIntakeMl || 0,
      weightKg: dayLog.weightKg ?? null,
      medsTaken: dayLog.medsTaken || {}
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch All Daily Logs for Sync Merge
export async function fetchUserDayLogs(userId: string): Promise<Record<string, DayLog>> {
  const path = `users/${userId}/dayLogs`;
  try {
    const querySnap = await getDocs(collection(db, 'users', userId, 'dayLogs'));
    const dayLogs: Record<string, DayLog> = {};
    querySnap.forEach((doc) => {
      const data = doc.data();
      dayLogs[doc.id] = {
        date: data.date,
        meals: data.meals || [],
        waterIntakeMl: data.waterIntakeMl || 0,
        weightKg: data.weightKg !== null ? data.weightKg : undefined,
        medsTaken: data.medsTaken || {}
      };
    });
    return dayLogs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

// Bulk Upload function for merging local -> cloud
export async function bulkUploadToFirebase(
  userId: string,
  email: string,
  goals: UserGoals,
  products: Product[],
  recipes: Recipe[],
  dayLogs: Record<string, DayLog>
) {
  // First, save goals
  await saveGoalsToFirebase(userId, goals, email);

  // Use write batches for efficient network transfer where possible
  // Firestore batch has a limit of 500 operations
  let batch = writeBatch(db);
  let opCount = 0;

  const commitBatchIfNeeded = async () => {
    if (opCount >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  // Upload products
  for (const product of products) {
    const docRef = doc(db, 'users', userId, 'customProducts', product.id);
    batch.set(docRef, sanitizeForFirestore({
      ...product,
      imageUrl: product.imageUrl || '',
      barcode: product.barcode || '',
    }));
    opCount++;
    await commitBatchIfNeeded();
  }

  // Upload recipes
  for (const recipe of recipes) {
    const docRef = doc(db, 'users', userId, 'recipes', recipe.id);
    batch.set(docRef, sanitizeForFirestore(recipe));
    opCount++;
    await commitBatchIfNeeded();
  }

  // Upload daily logs
  for (const [date, log] of Object.entries(dayLogs)) {
    const docRef = doc(db, 'users', userId, 'dayLogs', date);
    batch.set(docRef, sanitizeForFirestore({
      date: log.date,
      meals: log.meals || [],
      waterIntakeMl: log.waterIntakeMl || 0,
      weightKg: log.weightKg ?? null,
      medsTaken: log.medsTaken || {}
    }));
    opCount++;
    await commitBatchIfNeeded();
  }

  if (opCount > 0) {
    await batch.commit();
  }
}
