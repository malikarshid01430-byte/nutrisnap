import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Clock, 
  BarChart3, 
  ChevronRight, 
  RefreshCw,
  Flame,
  Dna,
  Wheat,
  Droplets,
  AlertCircle
} from 'lucide-react';
import { DailySummary, UserProfile, MealSuggestion } from '../types';
import { getMealSuggestions } from '../services/aiService';

interface SuggestionsScreenProps {
  summary: DailySummary;
  profile: UserProfile;
}

export function SuggestionsScreen({ summary, profile }: SuggestionsScreenProps) {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMealSuggestions(summary, profile);
      setSuggestions(data);
    } catch (err) {
      setError("Failed to load suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Smart Suggestions <Sparkles className="text-brand-500" size={24} />
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">AI-powered meals to hit your goals</p>
        </div>
        <button 
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors disabled:opacity-50 active:scale-90"
          aria-label="Refresh suggestions"
        >
          <RefreshCw size={22} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-modern p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-100 dark:bg-white/10 rounded-lg w-2/3" />
              <div className="h-4 bg-slate-50 dark:bg-white/5 rounded-lg w-full" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-12 bg-slate-50 dark:bg-white/5 rounded-xl" />
                <div className="h-12 bg-slate-50 dark:bg-white/5 rounded-xl" />
                <div className="h-12 bg-slate-50 dark:bg-white/5 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-4 bg-rose-50 dark:bg-rose-500/10 rounded-[2rem] border border-rose-100 dark:border-rose-500/20">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <p className="text-rose-800 dark:text-rose-200 font-medium">{error}</p>
          <button 
            onClick={fetchSuggestions}
            className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {suggestions.map((suggestion, idx) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card-modern p-6 space-y-6 relative overflow-hidden group"
            >
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {suggestion.name}
                  </h3>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    suggestion.difficulty === 'Easy' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    suggestion.difficulty === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {suggestion.difficulty}
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {suggestion.description}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3 relative z-10">
                <SuggestionMacro label="Cals" value={suggestion.calories} color="text-slate-800 dark:text-slate-100" />
                <SuggestionMacro label="Prot" value={suggestion.protein} color="text-blue-500 dark:text-blue-400" />
                <SuggestionMacro label="Carb" value={suggestion.carbs} color="text-amber-500 dark:text-amber-400" />
                <SuggestionMacro label="Fat" value={suggestion.fat} color="text-rose-500 dark:text-rose-400" />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5 relative z-10">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <Clock size={14} />
                  <span className="text-xs font-bold">{suggestion.prepTime}</span>
                </div>
                <button className="flex items-center gap-1 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider hover:gap-2 transition-all min-h-[44px] px-2 active:scale-95">
                  View Recipe <ChevronRight size={16} />
                </button>
              </div>

              {/* Decorative background */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-50 dark:bg-brand-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Info */}
      <div className="bg-slate-900 dark:bg-[#1A1A2E] rounded-[2rem] p-8 text-white space-y-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 opacity-60">
            <BarChart3 size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Remaining Targets</span>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calories</p>
              <p className="text-3xl font-display font-bold">{Math.max(0, profile.dailyGoals.calories - summary.totalCalories)} <span className="text-xs opacity-40">kcal</span></p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <RemainingMacro label="P" value={Math.max(0, profile.dailyGoals.protein - summary.totalProtein)} color="bg-blue-400" />
              <RemainingMacro label="C" value={Math.max(0, profile.dailyGoals.carbs - summary.totalCarbs)} color="bg-amber-400" />
              <RemainingMacro label="F" value={Math.max(0, profile.dailyGoals.fat - summary.totalFat)} color="bg-rose-400" />
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl" />
      </div>
    </motion.div>
  );
}

function SuggestionMacro({ label, value, color }: any) {
  return (
    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2 text-center border border-slate-100 dark:border-white/5">
      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">{label}</p>
      <p className={`text-xs font-bold ${color}`}>{value}{label === 'Cals' ? '' : 'g'}</p>
    </div>
  );
}

function RemainingMacro({ label, value, color }: any) {
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
