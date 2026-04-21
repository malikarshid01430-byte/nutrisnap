import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Trash2,
  Flame,
  Dna,
  Wheat,
  Droplets,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PlannedMeal, UserProfile } from '../types';
import { generateWeeklyMealPlan } from '../services/aiService';
import { Skeleton, EmptyState, useLoading } from './UI';

interface MealPlannerScreenProps {
  plannedMeals: PlannedMeal[];
  onUpdate: (meals: PlannedMeal[]) => void;
  profile: UserProfile;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export function MealPlannerScreen({ plannedMeals, onUpdate, profile }: MealPlannerScreenProps) {
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isLoading = useLoading(1000);

  const dayMeals = useMemo(() => {
    return plannedMeals.filter(m => m.day === selectedDay);
  }, [plannedMeals, selectedDay]);

  const weeklyTotals = useMemo(() => {
    return plannedMeals.reduce((acc, m) => {
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [plannedMeals]);

  const dayTotals = useMemo(() => {
    return dayMeals.reduce((acc, m) => {
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [dayMeals]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const newPlan = await generateWeeklyMealPlan(profile);
      onUpdate(newPlan);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to generate plan", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeMeal = (id: string) => {
    onUpdate(plannedMeals.filter(m => m.id !== id));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-[2rem]" />
        <div className="flex gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-12 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">Meal Planner</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Design your perfect week</p>
        </div>
        <button 
          onClick={handleGenerateAI}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all disabled:opacity-50 active:scale-95"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {isGenerating ? 'Generating...' : 'AI Plan'}
        </button>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">Weekly plan generated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Overview */}
      <div className="bg-slate-900 dark:bg-[#1A1A2E] rounded-[2rem] p-8 text-white space-y-6 shadow-xl relative overflow-hidden animate-slide-up">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 opacity-60">
            <Calendar size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Weekly Totals</span>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Calories</p>
              <p className="text-3xl font-display font-bold">{Math.round(weeklyTotals.calories / 7)} <span className="text-xs opacity-40">kcal/day</span></p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SummaryMacro label="P" value={Math.round(weeklyTotals.protein / 7)} color="bg-blue-400" />
              <SummaryMacro label="C" value={Math.round(weeklyTotals.carbs / 7)} color="bg-amber-400" />
              <SummaryMacro label="F" value={Math.round(weeklyTotals.fat / 7)} color="bg-rose-400" />
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
              selectedDay === day 
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                : 'bg-white dark:bg-[#1A1A2E] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter">{day}</span>
            <div className={`w-1 h-1 rounded-full mt-2 ${selectedDay === day ? 'bg-white' : 'bg-slate-200 dark:bg-slate-700'}`} />
          </button>
        ))}
      </div>

      {/* Day Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">{selectedDay} Plan</h3>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <span>{dayTotals.calories} kcal</span>
            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span>{dayTotals.protein}g P</span>
          </div>
        </div>

        {plannedMeals.length === 0 ? (
          <EmptyState 
            illustration="https://illustrations.popsy.co/violet/calendar.svg"
            title="No meal plan set"
            description="Let AI design a healthy weekly meal plan tailored to your goals!"
            actionLabel="Generate AI Plan"
            onAction={handleGenerateAI}
          />
        ) : (
          <div className="space-y-4">
            {MEAL_TYPES.map(type => {
              const meal = dayMeals.find(m => m.mealType === type);
              return (
                <div key={type} className="group">
                  {meal ? (
                    <motion.div 
                      layoutId={meal.id}
                      className="card-modern p-5 flex items-center justify-between group hover:border-brand-200 dark:hover:border-brand-500/40 transition-all animate-slide-up"
                    >
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{type}</p>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{meal.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          <span>{meal.calories} kcal</span>
                          <span>{meal.protein}g P</span>
                          <span>{meal.carbs}g C</span>
                          <span>{meal.fat}g F</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeMeal(meal.id)}
                        className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
                        aria-label="Remove planned meal"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ) : (
                    <button className="w-full h-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-300 dark:text-slate-700 hover:border-brand-200 dark:hover:border-brand-500/40 hover:text-brand-400 dark:hover:text-brand-400 transition-all group active:scale-[0.98]">
                      <Plus size={20} className="group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-widest">Add {type}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SummaryMacro({ label, value, color }: any) {
  return (
    <div className="text-center space-y-1">
      <div className="flex items-center justify-center gap-1">
        <div className={`w-1 h-1 rounded-full ${color}`} />
        <span className="text-[8px] font-bold text-slate-500 uppercase">{label}</span>
      </div>
      <p className="text-xs font-bold">{value}g</p>
    </div>
  );
}
