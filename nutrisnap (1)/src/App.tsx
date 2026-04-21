/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Camera, 
  History, 
  LayoutDashboard, 
  Plus, 
  Upload, 
  ChevronRight, 
  Flame, 
  Dna, 
  Wheat, 
  Droplets,
  X,
  Check,
  CheckCircle2,
  Loader2,
  Calendar as CalendarIcon,
  TrendingUp,
  Utensils,
  Sparkles,
  Search,
  Calculator,
  Download,
  Search as SearchIcon,
  Keyboard,
  User,
  Settings,
  Save,
  UserCircle,
  Award,
  GlassWater,
  ChefHat,
  Trash2,
  Moon,
  Sun
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, MealEntry, DailySummary, Screen, UserProfile, PlannedMeal, MealSuggestion, Badge, UserStats } from './types';
import { mockAnalyzeImage } from './mockApi';
import { Onboarding } from './components/Onboarding';
import { SuggestionsScreen } from './components/SuggestionsScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { MealPlannerScreen } from './components/MealPlannerScreen';
import { DiaryScreen } from './components/DiaryScreen';
import { WaterBottle } from './components/WaterBottle';
import { Skeleton, EmptyState, useLoading } from './components/UI';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nutrisnap_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<FoodItem[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const defaultProfile: UserProfile = {
      name: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      age: 25,
      gender: 'male',
      weight: 70,
      height: 175,
      dailyGoals: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 70,
        water: 2000
      },
      aiSettings: {
        accuracyLevel: 'balanced',
        preferOrganic: false,
        regionalCuisine: 'Global',
        showDetailedMacros: true,
        dietaryPreference: 'none'
      },
      appSettings: {
        darkMode: false,
        notifications: true
      }
    };

    const saved = localStorage.getItem('nutrisnap_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge or at least ensure appSettings and aiSettings exist
        return {
          ...defaultProfile,
          ...parsed,
          dailyGoals: { ...defaultProfile.dailyGoals, ...(parsed.dailyGoals || {}) },
          aiSettings: { ...defaultProfile.aiSettings, ...(parsed.aiSettings || {}) },
          appSettings: { ...defaultProfile.appSettings, ...(parsed.appSettings || {}) }
        };
      } catch (e) {
        console.error("Failed to parse profile", e);
      }
    }
    return defaultProfile;
  });

  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('nutrisnap_profile'));

  const [waterLogs, setWaterLogs] = useState<Record<string, number>>({});
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('nutrisnap_stats');
    if (saved) return JSON.parse(saved);
    return {
      totalMealsLogged: 0,
      currentStreak: 0,
      bestStreak: 0,
      proteinGoalMetDays: 0,
      waterGoalMetDays: 0,
      perfectMacroDays: 0,
      uniqueFoodsLogged: [],
    };
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('nutrisnap_badges');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'first_scan', title: 'First Scan', description: 'Log your first meal', icon: '📸', target: 1, current: 0, progress: 0 },
      { id: 'streak_7', title: '7-Day Streak', description: 'Log meals for 7 consecutive days', icon: '🔥', target: 7, current: 0, progress: 0 },
      { id: 'protein_champ', title: 'Protein Champion', description: 'Hit protein goal 5 times', icon: '💪', target: 5, current: 0, progress: 0 },
      { id: 'hydration_hero', title: 'Hydration Hero', description: 'Hit water goal 3 days in a row', icon: '💧', target: 3, current: 0, progress: 0 },
      { id: 'calorie_crusader', title: 'Calorie Crusader', description: 'Stay within 100kcal of goal for 5 days', icon: '⚖️', target: 5, current: 0, progress: 0 },
      { id: 'macro_master', title: 'Macro Master', description: 'Hit all macro goals in one day', icon: '🎯', target: 1, current: 0, progress: 0 },
      { id: 'early_bird', title: 'Early Bird', description: 'Log breakfast before 8:00 AM', icon: '🌅', target: 1, current: 0, progress: 0 },
      { id: 'night_owl', title: 'Night Owl', description: 'Log a meal after 10:00 PM', icon: '🦉', target: 1, current: 0, progress: 0 },
      { id: 'variety_king', title: 'Variety King', description: 'Log 20 different food items', icon: '🥗', target: 20, current: 0, progress: 0 },
      { id: 'century_club', title: 'Century Club', description: 'Log 100 total meals', icon: '💯', target: 100, current: 0, progress: 0 },
    ];
  });

  const analysisSteps = [
    { icon: <Search size={18} />, text: "Scanning textures..." },
    { icon: <Sparkles size={18} />, text: "Identifying items..." },
    { icon: <Dna size={18} />, text: "Analyzing molecular profile..." },
    { icon: <Calculator size={18} />, text: "Calculating macros..." },
    { icon: <CheckCircle2 size={18} />, text: "Finalizing report..." }
  ];

  const nutritionFacts = [
    "Fiber helps keep your digestion smooth and your heart healthy.",
    "Protein is essential for muscle repair and growth.",
    "Healthy fats are crucial for brain function and hormone production.",
    "Complex carbs provide sustained energy throughout the day.",
    "Hydration is key! Try to drink water with every meal.",
    "Colorful vegetables are packed with diverse phytonutrients.",
    "Avocados are technically a fruit, specifically a single-seeded berry!",
    "Broccoli contains more protein per calorie than steak.",
    "Apples are more effective at waking you up than coffee in the morning.",
    "Blueberries are one of the highest antioxidant-dense foods in the world.",
    "Spinach is a great source of iron, which helps transport oxygen in your blood.",
    "Almonds are high in Vitamin E, a powerful antioxidant for your skin.",
    "Quinoa is one of the few plant foods that contain all nine essential amino acids.",
    "Dark chocolate (70%+ cocoa) is rich in flavonoids that support heart health.",
    "Sweet potatoes are loaded with beta-carotene, which your body converts to Vitamin A."
  ];

  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setCurrentFactIndex(prev => (prev + 1) % nutritionFacts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // Load meals and profile from localStorage on mount
  useEffect(() => {
    const savedMeals = localStorage.getItem('nutrisnap_meals');
    if (savedMeals) {
      try {
        const parsed = JSON.parse(savedMeals);
        const formatted = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMeals(formatted);
      } catch (e) {
        console.error("Failed to parse meals", e);
      }
    }

    // Profile is already initialized in useState with merge logic
    if (!localStorage.getItem('nutrisnap_profile')) {
      setShowOnboarding(true);
    }

    const savedWater = localStorage.getItem('nutrisnap_water');
    if (savedWater) {
      try {
        setWaterLogs(JSON.parse(savedWater));
      } catch (e) {
        console.error("Failed to parse water logs", e);
      }
    }

    const savedPlanned = localStorage.getItem('nutrisnap_planned');
    if (savedPlanned) {
      try {
        setPlannedMeals(JSON.parse(savedPlanned));
      } catch (e) {
        console.error("Failed to parse planned meals", e);
      }
    }
  }, []);

  // Save meals to localStorage when updated
  useEffect(() => {
    localStorage.setItem('nutrisnap_meals', JSON.stringify(meals));
  }, [meals]);

  // Save profile to localStorage when updated
  useEffect(() => {
    localStorage.setItem('nutrisnap_profile', JSON.stringify(profile));
  }, [profile]);

  // Save water to localStorage when updated
  useEffect(() => {
    localStorage.setItem('nutrisnap_water', JSON.stringify(waterLogs));
  }, [waterLogs]);

  // Save planned meals to localStorage when updated
  useEffect(() => {
    localStorage.setItem('nutrisnap_planned', JSON.stringify(plannedMeals));
  }, [plannedMeals]);

  // Save stats to localStorage when updated
  useEffect(() => {
    localStorage.setItem('nutrisnap_stats', JSON.stringify(stats));
  }, [stats]);

  // Save badges to localStorage when updated
  useEffect(() => {
    localStorage.setItem('nutrisnap_badges', JSON.stringify(badges));
  }, [badges]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setAnalysisStep(0);
    
    // Determine delay based on accuracy level
    const accuracy = profile.aiSettings?.accuracyLevel || 'balanced';
    const delayMultiplier = accuracy === 'ultra' ? 2 : (accuracy === 'high' ? 1.5 : 1);
    
    try {
      // Simulate steps with slightly faster intervals for more steps
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(i);
        await new Promise(resolve => setTimeout(resolve, 800 * delayMultiplier));
      }

      // In a real app, we'd pass the actual file and settings
      const results = await mockAnalyzeImage(new File([], "image.jpg"));
      setCurrentAnalysis(results);
      setShowResults(true);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleManualAdd = (items: FoodItem[]) => {
    setCurrentAnalysis(items);
    // Use a placeholder image for manual entries
    setSelectedImage("https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=1000");
    setShowResults(true);
    setShowManualSearch(false);
  };

  const saveMeal = (itemsToSave?: FoodItem[]) => {
    const finalItems = itemsToSave || currentAnalysis;
    if (!finalItems || !selectedImage) return;

    const totalCals = finalItems.reduce((sum, item) => sum + item.calories, 0);
    const totalProtein = finalItems.reduce((sum, item) => sum + item.protein, 0);
    const totalCarbs = finalItems.reduce((sum, item) => sum + item.carbs, 0);
    const totalFat = finalItems.reduce((sum, item) => sum + item.fat, 0);

    const newMeal: MealEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      imageUrl: selectedImage,
      foodItems: finalItems,
      totalCalories: totalCals,
      totalProtein,
      totalCarbs,
      totalFat,
      mealType: 'Snack'
    };

    setMeals([newMeal, ...meals]);
    setShowResults(false);
    setSelectedImage(null);
    setCurrentAnalysis(null);
    setActiveScreen('today');
  };

  const getTodaySummary = (): DailySummary => {
    const today = new Date().toDateString();
    const todayMeals = meals.filter(m => m.timestamp.toDateString() === today);
    const todayWater = waterLogs[today] || 0;
    
    return {
      date: today,
      meals: todayMeals,
      totalCalories: todayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
      totalProtein: todayMeals.reduce((sum, m) => sum + m.totalProtein, 0),
      totalCarbs: todayMeals.reduce((sum, m) => sum + m.totalCarbs, 0),
      totalFat: todayMeals.reduce((sum, m) => sum + m.totalFat, 0),
      totalWater: todayWater,
    };
  };

  useEffect(() => {
    localStorage.setItem('nutrisnap_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Sync with profile if it exists
    if (profile?.appSettings && profile.appSettings.darkMode !== darkMode) {
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          appSettings: {
            ...prev.appSettings,
            darkMode: darkMode
          }
        };
      });
    }
  }, [darkMode]);

  const addWater = (amount: number) => {
    const today = new Date().toDateString();
    setWaterLogs(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + amount
    }));
  };

  const todaySummary = getTodaySummary();

  // Achievement Logic
  useEffect(() => {
    if (meals.length === 0) return;

    const today = new Date().toDateString();
    const newStats = { ...stats };
    const newBadges = [...badges];
    let statsChanged = false;

    // 1. Total Meals & First Scan
    if (newStats.totalMealsLogged !== meals.length) {
      newStats.totalMealsLogged = meals.length;
      statsChanged = true;
      
      const firstScan = newBadges.find(b => b.id === 'first_scan');
      if (firstScan && !firstScan.unlockedAt) {
        firstScan.current = 1;
        firstScan.progress = 100;
        firstScan.unlockedAt = new Date();
      }

      const century = newBadges.find(b => b.id === 'century_club');
      if (century && !century.unlockedAt) {
        century.current = meals.length;
        century.progress = Math.min(100, (meals.length / century.target) * 100);
        if (century.current >= century.target) century.unlockedAt = new Date();
      }
    }

    // 2. Unique Foods
    const allFoodNames = meals.flatMap(m => m.foodItems.map(f => f.name.toLowerCase()));
    const uniqueFoods = Array.from(new Set(allFoodNames));
    if (uniqueFoods.length !== newStats.uniqueFoodsLogged.length) {
      newStats.uniqueFoodsLogged = uniqueFoods;
      statsChanged = true;

      const variety = newBadges.find(b => b.id === 'variety_king');
      if (variety && !variety.unlockedAt) {
        variety.current = uniqueFoods.length;
        variety.progress = Math.min(100, (uniqueFoods.length / variety.target) * 100);
        if (variety.current >= variety.target) variety.unlockedAt = new Date();
      }
    }

    // 3. Time-based badges (Early Bird / Night Owl)
    const lastMeal = meals[0]; // Assuming newest is first
    if (lastMeal && lastMeal.timestamp.toDateString() === today) {
      const hour = lastMeal.timestamp.getHours();
      
      const earlyBird = newBadges.find(b => b.id === 'early_bird');
      if (earlyBird && !earlyBird.unlockedAt && hour < 8 && lastMeal.mealType === 'Breakfast') {
        earlyBird.current = 1;
        earlyBird.progress = 100;
        earlyBird.unlockedAt = new Date();
      }

      const nightOwl = newBadges.find(b => b.id === 'night_owl');
      if (nightOwl && !nightOwl.unlockedAt && hour >= 22) {
        nightOwl.current = 1;
        nightOwl.progress = 100;
        nightOwl.unlockedAt = new Date();
      }
    }

    // 4. Macro Master (Hit all goals today)
    const macroMaster = newBadges.find(b => b.id === 'macro_master');
    if (macroMaster && !macroMaster.unlockedAt) {
      const pMet = todaySummary.totalProtein >= profile.dailyGoals.protein;
      const cMet = todaySummary.totalCarbs >= profile.dailyGoals.carbs;
      const fMet = todaySummary.totalFat >= profile.dailyGoals.fat;
      const calMet = Math.abs(todaySummary.totalCalories - profile.dailyGoals.calories) <= 100;
      
      if (pMet && cMet && fMet && calMet) {
        macroMaster.current = 1;
        macroMaster.progress = 100;
        macroMaster.unlockedAt = new Date();
      }
    }

    // 5. Protein Champ
    const proteinChamp = newBadges.find(b => b.id === 'protein_champ');
    if (proteinChamp && !proteinChamp.unlockedAt) {
      const pMet = todaySummary.totalProtein >= profile.dailyGoals.protein;
      if (pMet && !newStats.proteinGoalMetDays) { // Simple increment for demo
         // In a real app, we'd check history. For now, let's use the stat.
      }
      // Let's assume stats are updated elsewhere or we do it here
    }

    // 6. Hydration Hero
    const hydrationHero = newBadges.find(b => b.id === 'hydration_hero');
    if (hydrationHero && !hydrationHero.unlockedAt) {
      const wMet = todaySummary.totalWater >= profile.dailyGoals.water;
      if (wMet) {
        // Logic for 3 days in a row would require history
      }
    }

    if (statsChanged) {
      setStats(newStats);
      setBadges(newBadges);
    }
  }, [meals, todaySummary.totalWater]);

  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setActiveScreen('today');
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setShowOnboarding(false);
    localStorage.setItem('nutrisnap_profile', JSON.stringify(newProfile));
  };

  return (
    <div className={`flex flex-col h-dvh w-full md:max-w-[440px] md:mx-auto bg-[#F8F9FE] dark:bg-[#0F0F1A] overflow-hidden relative md:shadow-2xl transition-colors duration-300`}>
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding 
            initialProfile={profile} 
            onComplete={handleOnboardingComplete} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-lg border-b border-slate-100 dark:border-white/5 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-brand-600 dark:text-accent-soft">NutriSnap</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Welcome, {profile.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-11 h-11 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shadow-sm active:scale-90"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setActiveScreen('profile')}
              className="w-11 h-11 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors shadow-sm active:scale-90"
              aria-label="Profile"
            >
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeScreen === 'home' && (
            <HomeScreen 
              profile={profile}
              summary={todaySummary}
              recentMeals={meals.slice(0, 5)}
              onNavigate={setActiveScreen}
            />
          )}
          {activeScreen === 'camera' && (
            <CameraScreen 
              selectedImage={selectedImage} 
              onUpload={handleImageUpload} 
              onAnalyze={handleAnalyze}
              onOpenManualSearch={() => setShowManualSearch(true)}
              isAnalyzing={isAnalyzing}
              recentMeals={meals.slice(0, 3)}
            />
          )}
          {activeScreen === 'today' && (
            <TodayScreen 
              summary={todaySummary} 
              goals={profile.dailyGoals} 
              onAddWater={addWater}
              onNavigate={setActiveScreen}
            />
          )}
          {activeScreen === 'history' && (
            <HistoryScreen meals={meals} onNavigate={setActiveScreen} />
          )}
          {activeScreen === 'recipes' && (
            <RecipeScreen meals={meals} goals={profile.dailyGoals} aiSettings={profile.aiSettings || {}} />
          )}
          {activeScreen === 'planner' && (
            <MealPlannerScreen 
              plannedMeals={plannedMeals} 
              onUpdate={setPlannedMeals} 
              profile={profile}
            />
          )}
          {activeScreen === 'suggestions' && (
            <SuggestionsScreen summary={todaySummary} profile={profile} />
          )}
          {activeScreen === 'insights' && (
            <InsightsScreen meals={meals} profile={profile} />
          )}
          {activeScreen === 'diary' && (
            <DiaryScreen meals={meals} setMeals={setMeals} profile={profile} onNavigate={setActiveScreen} />
          )}
          {activeScreen === 'profile' && (
            <ProfileScreen 
              profile={profile} 
              onSave={handleSaveProfile} 
              badges={badges} 
              stats={stats} 
              meals={meals}
              setDarkMode={setDarkMode}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[440px] z-50 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex justify-around items-center h-16 px-2">
          <NavButton 
            active={activeScreen === 'home'} 
            onClick={() => setActiveScreen('home')}
            icon={<LayoutDashboard size={22} />}
            label="Home"
          />
          <NavButton 
            active={activeScreen === 'camera'} 
            onClick={() => setActiveScreen('camera')}
            icon={<Camera size={22} />}
            label="Scan"
          />
          <NavButton 
            active={activeScreen === 'diary'} 
            onClick={() => setActiveScreen('diary')}
            icon={<Utensils size={22} />}
            label="Diary"
          />
          <NavButton 
            active={activeScreen === 'insights'} 
            onClick={() => setActiveScreen('insights')}
            icon={<TrendingUp size={22} />}
            label="Stats"
          />
          <NavButton 
            active={activeScreen === 'planner'} 
            onClick={() => setActiveScreen('planner')}
            icon={<CalendarIcon size={22} />}
            label="Plan"
          />
        </nav>
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && currentAnalysis && (
          <ResultsModal 
            image={selectedImage!} 
            items={currentAnalysis} 
            onSave={saveMeal} 
            onClose={() => setShowResults(false)} 
          />
        )}
      </AnimatePresence>

      {/* Manual Search Modal */}
      <AnimatePresence>
        {showManualSearch && (
          <ManualSearchModal 
            onAdd={handleManualAdd}
            onClose={() => setShowManualSearch(false)}
          />
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-purple-600 flex flex-col items-center justify-center p-8 text-white"
          >
            <div className="relative w-32 h-32 mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-white/10 border-t-white rounded-full"
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles size={48} className="text-purple-200" />
              </motion.div>
            </div>

            <div className="w-full max-w-xs mb-12">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-400 to-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                />
              </div>
              <div className="flex justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={10} className="animate-spin text-purple-300" />
                  <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">AI Engine Active</span>
                </div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  {Math.round(((analysisStep + 1) / analysisSteps.length) * 100)}%
                </span>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-6 text-center">
              <div className="space-y-4">
                {analysisSteps.map((step, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0.3, x: -10 }}
                    animate={{ 
                      opacity: analysisStep === idx ? 1 : analysisStep > idx ? 0.5 : 0.3,
                      x: analysisStep === idx ? 0 : 0
                    }}
                    className="flex items-center gap-3 justify-center"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center relative ${analysisStep === idx ? 'bg-white text-purple-600' : 'bg-white/10 text-white'}`}>
                      {analysisStep > idx ? <CheckCircle2 size={16} /> : step.icon}
                      {analysisStep === idx && (
                        <motion.div 
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 bg-white rounded-full"
                        />
                      )}
                    </div>
                    <span className={`font-medium ${analysisStep === idx ? 'text-white' : 'text-white/60'}`}>
                      {step.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/20">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200 mb-3">Did you know?</p>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={currentFactIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm font-medium leading-relaxed italic"
                  >
                    "{nutritionFacts[currentFactIndex]}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className="relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-300 group active:scale-90"
    >
      <motion.div
        animate={{ 
          scale: active ? 1.1 : 1,
          y: active ? -2 : 0
        }}
        className={`relative z-10 transition-colors duration-300 ${active ? 'text-brand-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
      >
        {icon}
      </motion.div>
      
      <span className={`text-[10px] font-bold mt-1 transition-colors duration-300 ${active ? 'text-brand-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {label}
      </span>

      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute top-0 w-8 h-1 bg-brand-500 rounded-b-full"
        />
      )}
    </button>
  );
}

function HomeScreen({ profile, summary, recentMeals, onNavigate }: any) {
  const [greeting, setGreeting] = useState('');
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const quotes = [
      "Health is not about the weight you lose, but the life you gain.",
      "Your body is your most priceless possession. Take care of it.",
      "A healthy outside starts from the inside.",
      "The only bad workout is the one that didn't happen.",
      "Eat for the body you want, not for the body you have.",
      "Fitness is not a destination, it's a way of life.",
      "Success starts with self-discipline.",
      "Don't stop when you're tired. Stop when you're done.",
      "Your health is an investment, not an expense.",
      "Small changes make a big difference."
    ];
    // Use date as seed for daily quote
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuote(quotes[dayOfYear % quotes.length]);
  }, []);

  const calorieProgress = Math.min((summary.totalCalories / profile.dailyGoals.calories) * 100, 100);
  const isLoading = useLoading(800);

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full rounded-[20px]" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      {/* Greeting & Quote */}
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">
            {greeting}, <span className="text-brand-600 dark:text-brand-400">{profile.name}</span>
          </h2>
          <button 
            onClick={() => onNavigate('today')}
            className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-all active:scale-90"
            title="View Detailed Stats"
            aria-label="View Detailed Stats"
          >
            <LayoutDashboard size={28} />
          </button>
        </div>
        <div className="bg-brand-50/50 dark:bg-brand-500/5 p-4 rounded-2xl border border-brand-100/50 dark:border-brand-500/20 italic text-brand-800 dark:text-brand-200 text-sm">
          "{quote}"
        </div>
      </div>

      {/* Calorie Ring */}
      <div className="card-modern p-8 flex flex-col items-center gap-6 relative overflow-hidden animate-slide-up">
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-slate-100 dark:text-white/5"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 80}
                initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 80 - (2 * Math.PI * 80 * calorieProgress) / 100 }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="text-brand-600 drop-shadow-[0_0_8px_rgba(124,58,237,0.3)]"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-display font-bold text-slate-800 dark:text-white">{summary.totalCalories}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Calories</span>
              <div className="mt-1 px-2 py-0.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-bold">
                Goal: {profile.dailyGoals.calories}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-50 dark:bg-brand-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Macros */}
      <div className="grid grid-cols-1 gap-4">
        <MacroCard 
          label="Protein" 
          current={summary.totalProtein} 
          goal={profile.dailyGoals.protein} 
          color="bg-blue-500" 
          icon={<Dna size={18} />}
          unit="g"
        />
        <MacroCard 
          label="Carbs" 
          current={summary.totalCarbs} 
          goal={profile.dailyGoals.carbs} 
          color="bg-amber-500" 
          icon={<Wheat size={18} />}
          unit="g"
        />
        <MacroCard 
          label="Fat" 
          current={summary.totalFat} 
          goal={profile.dailyGoals.fat} 
          color="bg-rose-500" 
          icon={<Droplets size={18} />}
          unit="g"
        />
      </div>

      {/* Recent Meals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">Recent Meals</h3>
          <button 
            onClick={() => onNavigate('history')}
            className="text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider hover:underline min-h-[44px] px-2 active:scale-95"
          >
            View All
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {recentMeals.length > 0 ? (
            recentMeals.map((meal: any) => (
              <div key={meal.id} className="flex-shrink-0 w-32 space-y-2 animate-slide-up">
                <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-md border-2 border-white">
                  <img src={meal.imageUrl} alt="Meal" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="px-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{meal.foodItems[0]?.name || 'Meal'}</p>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">{meal.totalCalories} kcal</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState 
              illustration="https://illustrations.popsy.co/violet/eating-noodles.svg"
              title="No meals logged yet"
              description="Your nutrition history will appear here once you start logging."
              actionLabel="Start Logging"
              onAction={() => onNavigate('camera')}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MacroCard({ label, current, goal, color, icon, unit }: any) {
  const progress = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="card-modern p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} text-white flex items-center justify-center shadow-lg shadow-current/20`}>
        {icon}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {current}<span className="text-[10px] opacity-60 font-normal"> / {goal}{unit}</span>
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${color}`}
          />
        </div>
      </div>
    </div>
  );
}

function CameraScreen({ selectedImage, onUpload, onAnalyze, onOpenManualSearch, isAnalyzing, recentMeals }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 flex flex-col items-center gap-8"
    >
      <div className="text-center">
        <h2 className="text-xl font-display font-semibold text-slate-800 dark:text-slate-100">Snap Your Meal</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">AI will analyze the nutrition for you</p>
      </div>

      <div className="relative w-80 h-80">
        <div className={`w-full h-full rounded-full border-4 border-dashed border-brand-100 dark:border-white/10 flex items-center justify-center overflow-hidden bg-white dark:bg-[#1A1A2E] shadow-inner transition-all relative ${selectedImage ? 'border-solid border-brand-500' : ''}`}>
          {selectedImage ? (
            <>
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              {isAnalyzing && (
                <>
                  <motion.div 
                    initial={{ top: "-10%" }}
                    animate={{ top: "110%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_20px_rgba(124,58,237,1)] z-10"
                  />
                  {/* Random AI Scan Points */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1.2, 0.8],
                        x: Math.random() * 200 - 100,
                        y: Math.random() * 200 - 100
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.4,
                        ease: "easeInOut"
                      }}
                      className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] z-20"
                    />
                  ))}
                  <div className="absolute inset-0 bg-brand-900/10 backdrop-grayscale-[0.5] z-0" />
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-brand-200">
              <Camera size={80} strokeWidth={1.5} />
              <span className="text-sm font-medium mt-2">No image selected</span>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-4 right-4 flex flex-col gap-4">
          <button 
            onClick={onOpenManualSearch}
            className="w-14 h-14 bg-white dark:bg-[#1A1A2E] text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-brand-50 dark:border-white/5 active:scale-90"
            title="Manual Entry"
            aria-label="Manual Entry"
          >
            <Keyboard size={28} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-700 transition-all active:scale-90"
            title="Snap Photo"
            aria-label="Snap Photo"
          >
            <Plus size={32} />
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className="w-full flex flex-col gap-3">
        <button 
          disabled={!selectedImage || isAnalyzing}
          onClick={onAnalyze}
          className={`w-full min-h-[56px] py-4 rounded-2xl font-display font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
            !selectedImage || isAnalyzing 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-brand-600 hover:bg-brand-700 active:scale-[0.98]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing...
            </>
          ) : (
            <>
              <Upload size={20} />
              Analyze Meal
            </>
          )}
        </button>
      </div>

      {recentMeals.length > 0 && (
        <div className="w-full mt-4">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Recent Snapshots</h3>
          <div className="flex gap-4">
            {recentMeals.map((meal: MealEntry) => (
              <div key={meal.id} className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-white/10 shadow-md">
                <img src={meal.imageUrl} alt="Recent" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TodayScreen({ summary, goals, onAddWater, onNavigate }: { summary: DailySummary, goals: any, onAddWater: (amount: number) => void, onNavigate: (s: Screen) => void }) {
  const calorieProgress = Math.min((summary.totalCalories / goals.calories) * 100, 100);
  const waterProgress = Math.min((summary.totalWater / goals.water) * 100, 100);
  const isLoading = useLoading(1200);

  const getWaterReminder = () => {
    if (waterProgress === 0) return "Time to start hydrating! Your body will thank you.";
    if (waterProgress < 25) return "Good start! Keep those sips coming.";
    if (waterProgress < 50) return "You're doing great! Almost halfway to your goal.";
    if (waterProgress < 75) return "Keep it up! You're well hydrated today.";
    if (waterProgress < 100) return "So close! Just a few more glasses to go.";
    return "Goal reached! You're a hydration champion! 🏆";
  };

  const macroChartData = [
    { name: 'Protein', current: summary.totalProtein, target: goals.protein, fill: '#60a5fa' },
    { name: 'Carbs', current: summary.totalCarbs, target: goals.carbs, fill: '#fbbf24' },
    { name: 'Fat', current: summary.totalFat, target: goals.fat, fill: '#f87171' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-[20px]" />
        <Skeleton className="h-64 w-full rounded-[20px]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Daily Summary</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{summary.date}</p>
        </div>
        <div className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1 rounded-full text-xs font-bold border border-brand-100 dark:border-brand-500/20">
          TODAY
        </div>
      </div>

      {/* Main Calorie Card */}
      <div className="bg-brand-600 rounded-[20px] p-6 text-white shadow-xl relative overflow-hidden animate-slide-up">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 opacity-80 mb-1">
                <Flame size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Calories</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-display font-bold">{summary.totalCalories}</span>
                <span className="text-lg opacity-80">/ {goals.calories} kcal</span>
              </div>
            </div>
            
            {/* Circular Progress for Calories - Segmented */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Track */}
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray="4 2"
                  className="text-white/20"
                />
                {/* Progress Layer */}
                <motion.circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray="4 2"
                  initial={{ strokeDashoffset: 213.6 }}
                  animate={{ strokeDashoffset: 213.6 - (213.6 * calorieProgress) / 100 }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold leading-none">{Math.round(calorieProgress)}%</span>
                <span className="text-[8px] opacity-60 uppercase tracking-tighter">Goal</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
            <MacroStat 
              icon={<Dna size={14} />} 
              label="Protein" 
              value={summary.totalProtein} 
              goal={goals.protein} 
              unit="g" 
              color="bg-blue-400"
            />
            <MacroStat 
              icon={<Wheat size={14} />} 
              label="Carbs" 
              value={summary.totalCarbs} 
              goal={goals.carbs} 
              unit="g" 
              color="bg-amber-400"
            />
            <MacroStat 
              icon={<Droplets size={14} />} 
              label="Fat" 
              value={summary.totalFat} 
              goal={goals.fat} 
              unit="g" 
              color="bg-rose-400"
            />
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-400/20 rounded-full blur-3xl" />
      </div>

      {/* Macro Progress Chart */}
      <div className="card-modern p-6 space-y-4 dark:bg-[#1A1A2E] dark:border-white/5">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Macro Balance</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={macroChartData}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                className="text-slate-500 dark:text-slate-400"
                width={60}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 dark:bg-[#0F0F1A] text-white p-2 rounded-lg text-[10px] font-bold shadow-xl border border-white/5">
                        <p>{data.name}: {data.current}g / {data.target}g</p>
                        <p className="opacity-60">{Math.round((data.current / data.target) * 100)}% of goal</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="current" radius={[0, 4, 4, 0]} barSize={20}>
                {macroChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Tracking Section */}
      <div className="card-modern p-6 space-y-6 dark:bg-[#1A1A2E] dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GlassWater size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Water Intake</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Daily Target: {Math.round(goals.water / 250)} Glasses</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">{summary.totalWater}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">/ {goals.water} ml</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <WaterBottle progress={waterProgress} />
          <div className="flex-1 space-y-4">
            <div className="bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium italic">
                "{getWaterReminder()}"
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onAddWater(250)}
                className="min-h-[48px] py-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus size={18} /> 250ml
              </button>
              <button
                onClick={() => onAddWater(500)}
                className="min-h-[48px] py-3 rounded-xl border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus size={18} /> 500ml
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Meals</h3>
        {summary.meals.length > 0 ? (
          summary.meals.map((meal) => (
            <MealListItem key={meal.id} meal={meal} />
          ))
        ) : (
          <EmptyState 
            illustration="https://illustrations.popsy.co/violet/eating-noodles.svg"
            title="No meals logged yet"
            description="Start your day by snapping a photo of your first meal!"
            actionLabel="Log a Meal"
            onAction={() => onNavigate('camera')}
          />
        )}
      </div>
    </motion.div>
  );
}

function ProfileScreen({ profile, onSave, badges, stats, meals, setDarkMode }: { profile: UserProfile, onSave: (p: UserProfile) => void, badges: Badge[], stats: UserStats, meals: MealEntry[], setDarkMode: (val: boolean) => void }) {
  const [formData, setFormData] = useState(profile);
  const [activeTab, setActiveTab] = useState<'settings' | 'badges'>('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avgCalories = meals.length > 0 
    ? Math.round(meals.reduce((sum, m) => sum + m.totalCalories, 0) / (new Set(meals.map(m => m.timestamp.toDateString())).size || 1))
    : 0;

  const today = new Date().toDateString();
  const todayMeals = meals.filter(m => m.timestamp.toDateString() === today);
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  const calorieProgress = Math.min(100, (todayCalories / profile.dailyGoals.calories) * 100);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith('goal_')) {
      const goalName = name.replace('goal_', '');
      setFormData(prev => ({
        ...prev,
        dailyGoals: {
          ...prev.dailyGoals,
          [goalName]: parseInt(value) || 0
        }
      }));
    } else if (name.startsWith('ai_')) {
      const settingName = name.replace('ai_', '');
      setFormData(prev => ({
        ...prev,
        aiSettings: {
          ...prev.aiSettings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.startsWith('app_')) {
      const settingName = name.replace('app_', '');
      const newValue = type === 'checkbox' ? checked : value;
      
      if (settingName === 'darkMode') {
        setDarkMode(newValue as boolean);
      }

      setFormData(prev => ({
        ...prev,
        appSettings: {
          ...prev.appSettings,
          [settingName]: newValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'name' || name === 'gender' ? value : (parseInt(value) || 0)
      }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex flex-col items-center space-y-4 pt-4">
        <div className="relative group">
          <div 
            onClick={handleAvatarClick}
            className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1A1A2E] shadow-xl overflow-hidden cursor-pointer relative"
          >
            <img 
              src={formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">{formData.name || 'Your Profile'}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Member since March 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card-modern p-3 text-center space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Meals</p>
          <p className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">{stats.totalMealsLogged}</p>
        </div>
        <div className="card-modern p-3 text-center space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Streak</p>
          <p className="text-lg font-display font-bold text-orange-500 flex items-center justify-center gap-1">
            <Flame size={16} /> {stats.currentStreak}
          </p>
        </div>
        <div className="card-modern p-3 text-center space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Cal</p>
          <p className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">{avgCalories}</p>
        </div>
      </div>

      <div className="card-modern p-5 space-y-3">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Daily Goal Progress</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{todayCalories} / {profile.dailyGoals.calories} kcal consumed</p>
          </div>
          <p className="text-sm font-display font-bold text-brand-600">{Math.round(calorieProgress)}%</p>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${calorieProgress}%` }}
            className="h-full bg-brand-500 rounded-full"
          />
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 ${activeTab === 'settings' ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
        >
          Settings
        </button>
        <button 
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-3 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 ${activeTab === 'badges' ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
        >
          Badges
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'settings' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Personal Info
                </h3>
                <button 
                  onClick={() => onSave(formData)}
                  className="text-[10px] font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1 hover:text-brand-700 min-h-[44px] px-2 active:scale-95"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
          <div className="card-modern p-6 space-y-4 dark:bg-[#1A1A2E] dark:border-white/5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Age</label>
                <input 
                  type="number" 
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Gender</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Weight (kg)</label>
                <input 
                  type="number" 
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Height (cm)</label>
                <input 
                  type="number" 
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} /> Daily Macro Goals
          </h3>
          <div className="card-modern p-6 space-y-4 dark:bg-[#1A1A2E] dark:border-white/5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Calories (kcal)</label>
              <input 
                type="number" 
                name="goal_calories"
                value={formData.dailyGoals.calories}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Protein (g)</label>
                <input 
                  type="number" 
                  name="goal_protein"
                  value={formData.dailyGoals.protein}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Carbs (g)</label>
                <input 
                  type="number" 
                  name="goal_carbs"
                  value={formData.dailyGoals.carbs}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Fat (g)</label>
                <input 
                  type="number" 
                  name="goal_fat"
                  value={formData.dailyGoals.fat}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-3 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Water Intake Goal (ml)</label>
              <input 
                type="number" 
                name="goal_water"
                value={formData.dailyGoals.water}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Settings size={14} /> App Preferences
          </h3>
          <div className="card-modern p-6 space-y-4 dark:bg-[#1A1A2E] dark:border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Dark Mode</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Switch to dark interface</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="app_darkMode"
                  checked={formData.appSettings?.darkMode || false}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Meal reminders & insights</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="app_notifications"
                  checked={formData.appSettings?.notifications || false}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={14} /> AI Analysis Settings
          </h3>
          <div className="card-modern p-6 space-y-6 dark:bg-[#1A1A2E] dark:border-white/5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5">
                Accuracy Level
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(How deep the AI analyzes)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['balanced', 'high', 'ultra'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      aiSettings: { ...prev.aiSettings, accuracyLevel: level as any }
                    }))}
                    className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      formData.aiSettings?.accuracyLevel === level
                        ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-white/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                {formData.aiSettings?.accuracyLevel === 'balanced' && "Standard analysis, optimized for speed."}
                {formData.aiSettings?.accuracyLevel === 'high' && "Enhanced visual scanning for better portion estimation."}
                {formData.aiSettings?.accuracyLevel === 'ultra' && "Deep molecular analysis simulation for maximum precision."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Prefer Organic Data</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Prioritize organic food database matches</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="ai_preferOrganic"
                    checked={formData.aiSettings?.preferOrganic || false}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Detailed Macros</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Show micronutrients in analysis results</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="ai_showDetailedMacros"
                    checked={formData.aiSettings?.showDetailedMacros || false}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5">
                  Regional Cuisine Focus
                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(Optimizes for local ingredients)</span>
                </label>
                <select 
                  name="ai_regionalCuisine"
                  value={formData.aiSettings?.regionalCuisine || 'Global'}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                >
                  <option value="Global">Global / Universal</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Asian">Asian</option>
                  <option value="American">American</option>
                  <option value="Indian">Indian</option>
                  <option value="Latin American">Latin American</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5">
                  Dietary Preference
                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(Filters AI suggestions)</span>
                </label>
                <select 
                  name="ai_dietaryPreference"
                  value={formData.aiSettings?.dietaryPreference || 'none'}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                >
                  <option value="none">None / Balanced</option>
                  <option value="vegan">Vegan</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="keto">Keto</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>
            </div>
            </div>
          </section>
        </motion.div>
      ) : (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {badges.map(badge => (
                <div 
                  key={badge.id} 
                  className={`card-modern p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden ${!badge.unlockedAt ? 'opacity-60 grayscale' : 'border-brand-200 dark:border-brand-500/20 bg-brand-50/30 dark:bg-brand-500/10'}`}
                >
                  <div className="text-4xl mb-1">{badge.icon}</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{badge.title}</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-1">{badge.description}</p>
                  </div>
                  
                  <div className="w-full space-y-1 mt-auto pt-2">
                    <div className="flex justify-between text-[8px] font-bold text-slate-400">
                      <span>{badge.current} / {badge.target}</span>
                      <span>{Math.round(badge.progress)}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${badge.progress}%` }}
                        className={`h-full ${badge.unlockedAt ? 'bg-brand-500' : 'bg-slate-300'}`}
                      />
                    </div>
                  </div>

                  {badge.unlockedAt && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={12} className="text-brand-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'settings' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-3">
          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
            <Sparkles size={20} />
            <h4 className="font-bold">Pro Tip</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Setting realistic goals is key to long-term success. Most nutritionists recommend a balanced split of 30% Protein, 40% Carbs, and 30% Fat for general health.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function RecipeScreen({ meals, goals, aiSettings }: { meals: MealEntry[], goals: any, aiSettings: any }) {
  const [cuisine, setCuisine] = useState(aiSettings?.regionalCuisine && aiSettings.regionalCuisine !== 'Global' ? aiSettings.regionalCuisine : '');
  const [restrictions, setRestrictions] = useState(aiSettings?.dietaryPreference && aiSettings.dietaryPreference !== 'none' ? aiSettings.dietaryPreference : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateRecipe = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const today = new Date().toDateString();
      const todayMeals = meals.filter(m => m.timestamp.toDateString() === today);
      const consumed = {
        calories: todayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
        protein: todayMeals.reduce((sum, m) => sum + m.totalProtein, 0),
        carbs: todayMeals.reduce((sum, m) => sum + m.totalCarbs, 0),
        fat: todayMeals.reduce((sum, m) => sum + m.totalFat, 0),
      };

      const remaining = {
        calories: Math.max(0, goals.calories - consumed.calories),
        protein: Math.max(0, goals.protein - consumed.protein),
        carbs: Math.max(0, goals.carbs - consumed.carbs),
        fat: Math.max(0, goals.fat - consumed.fat),
      };

      const prompt = `
        You are a precision nutrition AI chef. Your task is to generate a healthy recipe that EXACTLY matches the user's remaining daily nutritional targets.
        
        CRITICAL TARGETS (DO NOT EXCEED):
        - Calories: ${remaining.calories} kcal
        - Protein: ${remaining.protein}g
        - Carbohydrates: ${remaining.carbs}g
        - Fats: ${remaining.fat}g
        
        USER CONSTRAINTS:
        - Cuisine Preference: ${cuisine || 'Any/Global'}
        - Dietary Restrictions: ${restrictions || 'None'}
        
        INSTRUCTIONS:
        1. Design a recipe where the total macros are as close as possible to the targets above (within ±5% margin).
        2. If a target is very low (e.g., <10g fat), prioritize low-fat ingredients.
        3. Ensure the recipe is culinary sound, delicious, and realistic to cook.
        4. Adjust portion sizes of ingredients specifically to hit these numbers.
        
        Provide the response in JSON format with the following structure:
        {
          "title": "Recipe Name",
          "description": "Short description explaining how this fits their specific macro needs",
          "ingredients": ["item 1 (with precise weight/volume)", "item 2"],
          "instructions": ["step 1", "step 2"],
          "macros": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number
          }
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              macros: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER }
                }
              }
            },
            required: ["title", "description", "ingredients", "instructions", "macros"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setRecipe(result);
    } catch (err) {
      console.error("Failed to generate recipe", err);
      setError("Failed to generate recipe. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6 pb-32"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ChefHat size={32} />
        </div>
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">AI Personal Chef</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Recipes tailored to your remaining macros</p>
      </div>

      <div className="card-modern p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Cuisine</label>
            <input 
              type="text" 
              placeholder="e.g. Italian"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Diet</label>
            <input 
              type="text" 
              placeholder="e.g. Vegan"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <button 
          onClick={generateRecipe}
          disabled={isGenerating}
          className={`w-full py-4 rounded-2xl font-display font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
            isGenerating ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 active:scale-[0.98]'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Crafting Recipe...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Recipe
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-medium text-center">
          {error}
        </div>
      )}

      {recipe && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern overflow-hidden"
        >
          <div className="bg-brand-600 dark:bg-accent-soft p-6 text-white">
            <h3 className="text-xl font-display font-bold">{recipe.title}</h3>
            <p className="text-white/80 text-xs mt-2 leading-relaxed">{recipe.description}</p>
            
            <div className="grid grid-cols-4 gap-2 mt-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center">
                <span className="block text-[10px] uppercase font-bold opacity-60">Cals</span>
                <span className="text-sm font-bold">{recipe.macros.calories}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center">
                <span className="block text-[10px] uppercase font-bold opacity-60">Prot</span>
                <span className="text-sm font-bold">{recipe.macros.protein}g</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center">
                <span className="block text-[10px] uppercase font-bold opacity-60">Carb</span>
                <span className="text-sm font-bold">{recipe.macros.carbs}g</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center">
                <span className="block text-[10px] uppercase font-bold opacity-60">Fat</span>
                <span className="text-sm font-bold">{recipe.macros.fat}g</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Utensils size={16} className="text-brand-600 dark:text-accent-soft" /> Ingredients
              </h4>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing: string, i: number) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-300 dark:bg-accent-soft/40 mt-1.5 flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles size={16} className="text-brand-600 dark:text-accent-soft" /> Instructions
              </h4>
              <div className="space-y-4">
                {recipe.instructions.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-accent-soft/20 text-brand-600 dark:text-accent-soft text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MacroStat({ icon, label, value, goal, unit, color }: any) {
  const progress = Math.min((value / goal) * 100, 100);
  const strokeColor = color.replace('bg-', 'text-');
  
  // Calculate segments (e.g., 12 segments for a clock-like feel)
  const segments = 12;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const segmentGap = 2; // gap between segments in pixels
  const segmentLength = (circumference / segments) - segmentGap;
  const dashArray = `${segmentLength} ${segmentGap}`;
  
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Track - Segmented */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={dashArray}
            className="text-white/10"
          />
          
          {/* Progress Layer - Segmented */}
          <motion.circle
            cx="28"
            cy="28"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={dashArray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className={`${strokeColor} drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]`}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
          {React.cloneElement(icon, { size: 16 })}
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-white/80">{label}</span>
        <div className="text-xs font-bold text-white">
          {value}<span className="text-[9px] ml-0.5 opacity-60 font-normal">/ {goal}{unit}</span>
        </div>
      </div>
    </div>
  );
}

function MealListItem({ meal }: any) {
  return (
    <button className="w-full bg-white dark:bg-[#1A1A2E] p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <img src={meal.imageUrl} alt="Meal" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {meal.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-brand-600 dark:text-purple-400 font-bold text-sm">{meal.totalCalories} kcal</span>
        </div>
        <p className="text-slate-800 dark:text-slate-100 font-medium truncate">
          {meal.foodItems.map((f: any) => f.name).join(', ')}
        </p>
      </div>
      <ChevronRight className="text-slate-300 dark:text-slate-600" size={20} />
    </button>
  );
}

function HistoryScreen({ meals, onNavigate }: { meals: MealEntry[], onNavigate: (s: Screen) => void }) {
  const exportToCSV = () => {
    if (meals.length === 0) return;

    const headers = ["Date", "Time", "Food Items", "Calories (kcal)", "Protein (g)", "Carbs (g)", "Fat (g)"];
    const rows = meals.map(meal => [
      meal.timestamp.toLocaleDateString(),
      meal.timestamp.toLocaleTimeString(),
      `"${meal.foodItems.map(f => f.name).join(', ')}"`,
      meal.totalCalories,
      meal.totalProtein,
      meal.totalCarbs,
      meal.totalFat
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nutrisnap_diary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group meals by date
  const groupedMeals = meals.reduce((groups: Record<string, MealEntry[]>, meal) => {
    const date = meal.timestamp.toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(meal);
    return groups;
  }, {});

  const dates = Object.keys(groupedMeals).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Prepare data for weekly chart
  const getWeeklyData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    return last7Days.map(dateStr => {
      const dayMeals = meals.filter(m => m.timestamp.toDateString() === dateStr);
      const totalCals = dayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      return { name: dayName, calories: totalCals, fullDate: dateStr };
    });
  };

  const chartData = getWeeklyData();

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 dark:bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 dark:shadow-purple-500/20">
            <CalendarIcon size={20} />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Meal History</h2>
        </div>
        {meals.length > 0 && (
          <button 
            onClick={exportToCSV}
            className="w-11 h-11 rounded-xl bg-white dark:bg-[#1A1A2E] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm active:scale-90"
            title="Export to CSV"
            aria-label="Export to CSV"
          >
            <Download size={22} />
          </button>
        )}
      </div>

      {/* Weekly Chart */}
      {meals.length > 0 && (
        <div className="card-modern p-6 space-y-4 dark:bg-[#1A1A2E] dark:border-white/5">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Weekly Progress</h3>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'currentColor', fontWeight: 600 }}
                  className="text-slate-400 dark:text-slate-500"
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', className: 'text-slate-50 dark:text-white/5', radius: 4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-[#1A1A2E] p-3 rounded-xl shadow-xl border border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {payload[0].payload.fullDate === new Date().toDateString() ? 'Today' : payload[0].payload.name}
                          </p>
                          <p className="text-sm font-bold text-brand-600 dark:text-purple-400">
                            {payload[0].value} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">kcal</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="calories" 
                  radius={[6, 6, 0, 0]}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fullDate === new Date().toDateString() ? '#7C3AED' : 'currentColor'}
                      className={`transition-all duration-300 hover:opacity-80 ${entry.fullDate === new Date().toDateString() ? '' : 'text-slate-200 dark:text-white/10'}`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {dates.length > 0 ? (
        <div className="space-y-8">
          {dates.map(date => (
            <div key={date} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-purple-400" />
                {date === new Date().toDateString() ? 'Today' : date}
              </h3>
              <div className="space-y-3">
                {groupedMeals[date].map(meal => (
                  <MealListItem key={meal.id} meal={meal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-modern p-10 text-center flex flex-col items-center gap-8 shadow-sm dark:bg-[#1A1A2E] dark:border-white/5">
          <div className="relative">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-40 h-40 rounded-full bg-brand-50 dark:bg-purple-900/20 flex items-center justify-center overflow-hidden border-8 border-slate-50 dark:border-white/5 shadow-inner"
            >
              <img 
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=500" 
                alt="Healthy food illustration"
                className="w-full h-full object-cover opacity-60 dark:opacity-40 mix-blend-multiply dark:mix-blend-overlay"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils size={48} className="text-brand-400 dark:text-purple-400 opacity-40" />
              </div>
            </motion.div>
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-white dark:bg-[#1A1A2E] shadow-xl flex items-center justify-center text-brand-600 dark:text-purple-400 border-4 border-slate-50 dark:border-white/5"
            >
              <Plus size={28} />
            </motion.div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">Your diary is empty</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[260px] mx-auto leading-relaxed">
              Every great journey starts with a single bite. Log your first meal to start tracking your progress!
            </p>
          </div>

          <button 
            onClick={() => onNavigate('camera')}
            className="w-full py-4 bg-brand-600 dark:bg-purple-600 text-white rounded-2xl font-display font-bold shadow-lg shadow-brand-600/25 dark:shadow-purple-600/25 hover:bg-brand-700 dark:hover:bg-purple-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            <Camera size={22} className="group-hover:scale-110 transition-transform" />
            Start Your First Log
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ResultsModal({ image, items, onSave, onClose }: any) {
  const [portionSize, setPortionSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const portionMultipliers = {
    small: 0.7,
    medium: 1,
    large: 1.3
  };

  const multiplier = portionMultipliers[portionSize];
  
  const totalCals = Math.round(items.reduce((sum: number, i: any) => sum + i.calories, 0) * multiplier);
  const totalProtein = Math.round(items.reduce((sum: number, i: any) => sum + i.protein, 0) * multiplier);
  const totalCarbs = Math.round(items.reduce((sum: number, i: any) => sum + i.carbs, 0) * multiplier);
  const totalFat = Math.round(items.reduce((sum: number, i: any) => sum + i.fat, 0) * multiplier);
  const totalFiber = Math.round(items.reduce((sum: number, i: any) => sum + (i.fiber || 0), 0) * multiplier);
  
  // Aggregate vitamins
  const allVitamins = Array.from(new Set(items.flatMap((i: any) => i.vitamins || []))).slice(0, 4);
  
  // Average confidence
  const avgConfidence = Math.round((items.reduce((sum: number, i: any) => sum + (i.confidence || 0.9), 0) / items.length) * 100);

  const handleSave = () => {
    setIsSuccess(true);
    setTimeout(() => {
      // Scale items before saving
      const scaledItems = items.map((item: any) => ({
        ...item,
        calories: Math.round(item.calories * multiplier),
        protein: Math.round(item.protein * multiplier),
        carbs: Math.round(item.carbs * multiplier),
        fat: Math.round(item.fat * multiplier),
        fiber: Math.round((item.fiber || 0) * multiplier)
      }));
      onSave(scaledItems);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-[#1A1A2E] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative"
      >
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-[60] bg-white dark:bg-[#1A1A2E] flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
              >
                <Check size={48} strokeWidth={3} />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 mb-2">Logged Successfully!</h2>
              <p className="text-slate-500 dark:text-slate-400">Your meal has been added to today's diary.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative h-56 flex-shrink-0">
          <img src={image} alt="Analyzed" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-11 h-11 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/40 transition-colors active:scale-90"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <div className="absolute bottom-6 left-8 right-8 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">AI Analysis Confirmed</span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold">
                {avgConfidence}% Confidence
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold leading-tight">
              {items.length > 1 ? 'Mixed Meal' : items[0].name}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Nutrition Breakdown Card */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nutrition Breakdown</h3>
            <div className="bg-slate-900 dark:bg-[#0F0F1A] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calories</p>
                  <div className="flex items-baseline gap-1">
                    <motion.span 
                      key={totalCals}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-display font-bold"
                    >
                      {totalCals}
                    </motion.span>
                    <span className="text-sm opacity-60">kcal</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                  {allVitamins.map((vit: string) => (
                    <div key={vit} className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/5">
                      Vit {vit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-4 relative z-10">
                <MacroItem label="Protein" value={totalProtein} color="bg-blue-400" />
                <MacroItem label="Carbs" value={totalCarbs} color="bg-amber-400" />
                <MacroItem label="Fat" value={totalFat} color="bg-rose-400" />
                <MacroItem label="Fiber" value={totalFiber} color="bg-emerald-400" />
              </div>

              {/* Background Decoration */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl" />
            </div>
          </div>

          {/* Portion Selector */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Adjust Portion Size</h3>
            <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl gap-1">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setPortionSize(size)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize transition-all ${
                    portionSize === size 
                      ? 'bg-white dark:bg-purple-600 text-brand-600 dark:text-white shadow-sm' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Itemized List */}
          {items.length > 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Detected Items</h3>
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-400" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{Math.round(item.calories * multiplier)} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-white dark:bg-[#1A1A2E] border-t border-slate-100 dark:border-white/5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <button 
            onClick={handleSave}
            className="w-full py-5 min-h-[56px] rounded-2xl font-display font-bold text-white bg-brand-600 shadow-lg shadow-brand-200 dark:shadow-brand-900/40 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Plus size={20} strokeWidth={3} />
            Add to Today's Log
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MacroItem({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{label}</span>
      </div>
      <div className="text-sm font-bold dark:text-slate-200">{value}g</div>
    </div>
  );
}

function ManualSearchModal({ onAdd, onClose }: { onAdd: (items: FoodItem[]) => void, onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);

  const foodDatabase: FoodItem[] = [
    { id: '1', name: 'Avocado Toast', calories: 280, protein: 8, carbs: 24, fat: 18 },
    { id: '2', name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { id: '3', name: 'Quinoa Salad', calories: 220, protein: 8, carbs: 32, fat: 7 },
    { id: '4', name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 4, fat: 5 },
    { id: '5', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { id: '6', name: 'Almonds (28g)', calories: 160, protein: 6, carbs: 6, fat: 14 },
    { id: '7', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 2.5 },
    { id: '8', name: 'Hard Boiled Egg', calories: 78, protein: 6, carbs: 0.6, fat: 5 },
  ];

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = foodDatabase.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const toggleItem = (item: FoodItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white dark:bg-[#1A1A2E] w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Manual Entry</h2>
          <button 
            onClick={onClose} 
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 active:scale-90 transition-all"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input 
              type="text"
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-slate-100 transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-4">
            {searchQuery.length > 1 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Search Results</h3>
                {searchResults.length > 0 ? (
                  searchResults.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        selectedItems.find(i => i.id === item.id)
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300'
                          : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-200 dark:hover:border-white/10'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs opacity-60">{item.calories} kcal</p>
                      </div>
                      {selectedItems.find(i => i.id === item.id) && <CheckCircle2 size={20} />}
                    </button>
                  ))
                ) : (
                  <p className="text-slate-400 dark:text-slate-500 text-sm py-4">No matching food found.</p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-200 dark:text-slate-700 mx-auto">
                  <SearchIcon size={32} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Type to search our food database</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button 
            disabled={selectedItems.length === 0}
            onClick={() => onAdd(selectedItems)}
            className={`w-full py-4 min-h-[56px] rounded-2xl font-display font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              selectedItems.length === 0 
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98]'
            }`}
          >
            Add {selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
