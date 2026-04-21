import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Award, 
  Info, 
  ChevronRight,
  Brain,
  Flame,
  Dna,
  Wheat,
  Droplets
} from 'lucide-react';
import { MealEntry, UserProfile } from '../types';
import { getWeeklyInsights } from '../services/aiService';

interface InsightsScreenProps {
  meals: MealEntry[];
  profile: UserProfile;
}

export function InsightsScreen({ meals, profile }: InsightsScreenProps) {
  const [aiInsights, setAiInsights] = useState<{ tips: string[]; score: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate 7-day calorie data
  const weeklyCalorieData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === dateStr);
      const totalCals = dayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
      
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: totalCals,
        target: profile.dailyGoals.calories
      });
    }
    return data;
  }, [meals, profile.dailyGoals.calories]);

  // Calculate macro breakdown for the week
  const macroData = useMemo(() => {
    const totals = meals.reduce((acc, m) => {
      acc.protein += m.totalProtein;
      acc.carbs += m.totalCarbs;
      acc.fat += m.totalFat;
      return acc;
    }, { protein: 0, carbs: 0, fat: 0 });

    const total = totals.protein + totals.carbs + totals.fat || 1;
    
    return [
      { name: 'Protein', value: totals.protein, color: '#3b82f6' },
      { name: 'Carbs', value: totals.carbs, color: '#f59e0b' },
      { name: 'Fat', value: totals.fat, color: '#ef4444' }
    ];
  }, [meals]);

  // Calculate streak
  const streak = useMemo(() => {
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === dateStr);
      const totalCals = dayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
      
      if (totalCals > 0 && totalCals <= profile.dailyGoals.calories * 1.1) {
        currentStreak++;
      } else if (i === 0 && totalCals === 0) {
        // Skip today if no meals yet
        continue;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [meals, profile.dailyGoals.calories]);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const insights = await getWeeklyInsights(meals, profile);
        setAiInsights(insights);
      } catch (error) {
        console.error("Failed to fetch AI insights", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [meals, profile]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">Weekly Insights</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Your nutrition performance at a glance</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-modern p-6 space-y-2 bg-gradient-to-br from-brand-500 to-brand-600 text-white border-none">
          <div className="flex items-center gap-2 opacity-80">
            <Zap size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Current Streak</span>
          </div>
          <p className="text-4xl font-display font-bold">{streak} <span className="text-sm font-normal opacity-60">days</span></p>
        </div>
        <div className="card-modern p-6 space-y-2 bg-slate-900 dark:bg-[#1A1A2E] text-white border-none">
          <div className="flex items-center gap-2 opacity-80">
            <Award size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Weekly Score</span>
          </div>
          <p className="text-4xl font-display font-bold">{aiInsights?.score || '--'} <span className="text-sm font-normal opacity-60">/ 100</span></p>
        </div>
      </div>

      {/* Calorie Chart */}
      <div className="card-modern p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" />
            Calorie Trends
          </h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCalorieData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'currentColor', fontWeight: 600 }}
                className="text-slate-400 dark:text-slate-500"
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'currentColor', className: 'text-slate-50 dark:text-white/5' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-[#1A1A2E] p-3 rounded-xl shadow-xl border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          {payload[0].payload.name}
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
                fill="#F27D26" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macro Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-modern p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Target size={16} className="text-blue-500" />
            Macro Balance
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-[#1A1A2E] p-3 rounded-xl shadow-xl border border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {payload[0].name}
                          </p>
                          <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
                            {payload[0].value} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">g</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  formatter={(value) => <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        <div className="card-modern p-6 space-y-6 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Brain size={16} className="text-brand-500" />
            AI Patterns
          </h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-white dark:bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {aiInsights?.tips.map((tip, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3 p-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info size={12} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{tip}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Summary Table */}
      <div className="card-modern overflow-hidden dark:bg-[#1A1A2E] dark:border-white/5">
        <div className="p-6 border-b border-slate-50 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Weekly Log</h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-white/5">
          {weeklyCalorieData.map((day, idx) => (
            <button key={idx} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-[0.98] text-left">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${day.calories > day.target ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{day.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{day.calories} / {day.target} kcal</span>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
