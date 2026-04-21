export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  vitamins?: string[];
  confidence?: number;
}

export interface MealEntry {
  id: string;
  timestamp: Date;
  imageUrl: string;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export interface DailySummary {
  date: string;
  meals: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalWater: number;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  dailyGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  aiSettings: {
    accuracyLevel: 'balanced' | 'high' | 'ultra';
    preferOrganic: boolean;
    regionalCuisine: string;
    showDetailedMacros: boolean;
    dietaryPreference: 'none' | 'vegan' | 'vegetarian' | 'keto' | 'paleo';
  };
  appSettings: {
    darkMode: boolean;
    notifications: boolean;
  };
}

export interface PlannedMeal {
  id: string;
  day: string; // e.g., 'Mon', 'Tue', etc.
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealSuggestion {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}

export type Screen = 'home' | 'camera' | 'today' | 'history' | 'results' | 'profile' | 'recipes' | 'planner' | 'suggestions' | 'insights' | 'diary';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number; // 0 to 100
  target: number;
  current: number;
}

export interface UserStats {
  totalMealsLogged: number;
  currentStreak: number;
  bestStreak: number;
  proteinGoalMetDays: number;
  waterGoalMetDays: number;
  perfectMacroDays: number;
  uniqueFoodsLogged: string[];
  lastLoggedDate?: string;
}
