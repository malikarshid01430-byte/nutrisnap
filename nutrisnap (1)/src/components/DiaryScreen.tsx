import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  Dna,
  Wheat,
  Droplets,
  Clock,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Apple,
  X
} from 'lucide-react';
import { MealEntry, FoodItem, UserProfile, DailySummary } from '../types';

interface DiaryScreenProps {
  meals: MealEntry[];
  setMeals: React.Dispatch<React.SetStateAction<MealEntry[]>>;
  profile: UserProfile;
  onNavigate: (screen: any) => void;
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export function DiaryScreen({ meals, setMeals, profile, onNavigate }: DiaryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<typeof MEAL_TYPES[number]>('Breakfast');
  const [showManualAdd, setShowManualAdd] = useState(false);

  // Filter meals for today
  const today = new Date().toDateString();
  const todayMeals = useMemo(() => {
    return meals.filter(m => new Date(m.timestamp).toDateString() === today);
  }, [meals, today]);

  // Group meals by type
  const groupedMeals = useMemo(() => {
    const groups: Record<string, MealEntry[]> = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: []
    };
    todayMeals.forEach(m => {
      const type = m.mealType || 'Snack';
      if (groups[type]) groups[type].push(m);
      else groups.Snack.push(m);
    });
    return groups;
  }, [todayMeals]);

  // Calculate daily totals
  const totals = useMemo(() => {
    return todayMeals.reduce((acc, m) => {
      acc.calories += m.totalCalories;
      acc.protein += m.totalProtein;
      acc.carbs += m.totalCarbs;
      acc.fat += m.totalFat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayMeals]);

  const handleDeleteMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const handleCopyYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    const yesterdayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === yesterdayStr);
    
    if (yesterdayMeals.length === 0) {
      alert("No meals found for yesterday.");
      return;
    }

    const newMeals = yesterdayMeals.map(m => ({
      ...m,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }));

    setMeals(prev => [...prev, ...newMeals]);
  };

  const handleManualAdd = (food: Partial<FoodItem>) => {
    const newMeal: MealEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      imageUrl: '',
      mealType: selectedMealType,
      foodItems: [{
        id: Math.random().toString(36).substr(2, 9),
        name: food.name || 'Unknown Food',
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0
      }],
      totalCalories: food.calories || 0,
      totalProtein: food.protein || 0,
      totalCarbs: food.carbs || 0,
      totalFat: food.fat || 0
    };
    setMeals(prev => [...prev, newMeal]);
    setShowManualAdd(false);
    setSearchQuery('');
  };

  // Mock food search results
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const mockDb = [
      { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
      { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
      { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 4 },
      { name: 'Brown Rice', calories: 215, protein: 5, carbs: 45, fat: 2 },
      { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15 },
      { name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 4, fat: 5 },
      { name: 'Egg', calories: 70, protein: 6, carbs: 0, fat: 5 },
      { name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0 },
    ];
    return mockDb.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">Food Diary</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Log your daily intake</p>
        </div>
        <button 
          onClick={handleCopyYesterday}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
        >
          <Copy size={16} />
          Copy Yesterday
        </button>
      </div>

      {/* Manual Add / Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search food to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1A1A2E] border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
          />
        </div>
        
        <AnimatePresence>
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 z-50 overflow-hidden"
            >
              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {searchResults.map((food, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleManualAdd(food)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{food.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                          {food.calories} kcal • {food.protein}g P • {food.carbs}g C • {food.fat}g F
                        </p>
                      </div>
                      <Plus size={18} className="text-brand-500" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400 dark:text-slate-500 text-sm">No results found. Add custom?</p>
                  <button 
                    onClick={() => setShowManualAdd(true)}
                    className="mt-2 text-brand-600 dark:text-brand-400 font-bold text-sm"
                  >
                    Create Custom Food
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Meal Groups */}
      <div className="space-y-6">
        {MEAL_TYPES.map(type => (
          <div key={type} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {type === 'Breakfast' && <Coffee size={16} className="text-amber-500" />}
                {type === 'Lunch' && <Sun size={16} className="text-blue-500" />}
                {type === 'Dinner' && <Moon size={16} className="text-indigo-500" />}
                {type === 'Snack' && <Apple size={16} className="text-rose-500" />}
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">{type}</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {groupedMeals[type].reduce((sum, m) => sum + m.totalCalories, 0)} kcal
              </span>
            </div>

            <div className="space-y-3">
              {groupedMeals[type].length > 0 ? (
                groupedMeals[type].map(meal => (
                  <motion.div 
                    key={meal.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -80) {
                        handleDeleteMeal(meal.id);
                      }
                    }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-rose-500 rounded-2xl flex items-center justify-end px-6 text-white">
                      <Trash2 size={20} />
                    </div>
                    <div className="card-modern p-4 flex items-center justify-between bg-white dark:bg-[#1A1A2E] relative z-10 min-h-[80px]">
                      <div className="flex items-center gap-4 flex-1">
                        {meal.imageUrl ? (
                          <img src={meal.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <Utensils size={20} />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">
                            {meal.foodItems.map(i => i.name).join(', ')}
                          </h4>
                          <div className="flex gap-3 mt-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{meal.totalCalories} kcal</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{meal.totalProtein}g P</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                        aria-label="Delete meal"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <button 
                  onClick={() => {
                    setSelectedMealType(type);
                  }}
                  className="w-full py-5 min-h-[64px] border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-300 dark:text-slate-700 hover:border-brand-200 dark:hover:border-brand-500/40 hover:text-brand-400 dark:hover:text-brand-400 transition-all group active:scale-[0.98]"
                >
                  <Plus size={20} />
                  <span className="text-sm font-bold uppercase tracking-widest">Add {type}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Totals Summary */}
      <div className="bg-slate-900 dark:bg-[#1A1A2E] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Daily Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-display font-bold">{totals.calories}</span>
                <span className="text-lg opacity-40">/ {profile.dailyGoals.calories} kcal</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-400 mb-1">
                {profile.dailyGoals.calories - totals.calories > 0 ? 'Remaining' : 'Over'}
              </p>
              <p className="text-2xl font-display font-bold">
                {Math.abs(profile.dailyGoals.calories - totals.calories)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 opacity-60">
                <Dna size={12} className="text-blue-400" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Protein</span>
              </div>
              <p className="text-sm font-bold">{totals.protein} <span className="text-[10px] opacity-40">/ {profile.dailyGoals.protein}g</span></p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 opacity-60">
                <Wheat size={12} className="text-amber-400" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Carbs</span>
              </div>
              <p className="text-sm font-bold">{totals.carbs} <span className="text-[10px] opacity-40">/ {profile.dailyGoals.carbs}g</span></p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 opacity-60">
                <Droplets size={12} className="text-rose-400" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Fat</span>
              </div>
              <p className="text-sm font-bold">{totals.fat} <span className="text-[10px] opacity-40">/ {profile.dailyGoals.fat}g</span></p>
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {showManualAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-[#1A1A2E] w-full max-w-md rounded-t-[2.5rem] p-8 space-y-6 shadow-2xl pb-[calc(2rem+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Custom Food</h3>
                <button 
                  onClick={() => setShowManualAdd(false)} 
                  className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Protein Shake"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none"
                    id="custom-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Calories</label>
                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none" id="custom-cal" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Protein</label>
                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none" id="custom-pro" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Carbs</label>
                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none" id="custom-carb" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Fat</label>
                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none" id="custom-fat" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  const name = (document.getElementById('custom-name') as HTMLInputElement).value;
                  const cal = parseInt((document.getElementById('custom-cal') as HTMLInputElement).value);
                  const pro = parseInt((document.getElementById('custom-pro') as HTMLInputElement).value);
                  const carb = parseInt((document.getElementById('custom-carb') as HTMLInputElement).value);
                  const fat = parseInt((document.getElementById('custom-fat') as HTMLInputElement).value);
                  handleManualAdd({ name, calories: cal, protein: pro, carbs: carb, fat: fat });
                }}
                className="w-full py-5 min-h-[56px] bg-brand-600 text-white rounded-2xl font-display font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-[0.98]"
              >
                Add to {selectedMealType}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
