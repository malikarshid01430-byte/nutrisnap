import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Target, 
  CheckCircle2,
  User,
  TrendingUp,
  Scale,
  Ruler,
  Calendar
} from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile: UserProfile;
}

type Goal = 'lose' | 'maintain' | 'gain';

export function Onboarding({ onComplete, initialProfile }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [goal, setGoal] = useState<Goal>('maintain');

  const totalSteps = 3;

  const calculateTargets = () => {
    const { weight, height, age, gender } = profile;
    
    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // Activity factor: Lightly active (1.375)
    let tdee = bmr * 1.375;

    // Adjust based on goal
    let targetCalories = tdee;
    if (goal === 'lose') targetCalories -= 500;
    if (goal === 'gain') targetCalories += 300;

    targetCalories = Math.round(targetCalories);

    // Macros: 30% Protein, 40% Carbs, 30% Fat
    const protein = Math.round((targetCalories * 0.3) / 4);
    const carbs = Math.round((targetCalories * 0.4) / 4);
    const fat = Math.round((targetCalories * 0.3) / 9);

    return {
      calories: targetCalories,
      protein,
      carbs,
      fat,
      water: Math.round(weight * 35) // 35ml per kg
    };
  };

  useEffect(() => {
    if (step === 2) {
      const targets = calculateTargets();
      setProfile(prev => ({
        ...prev,
        dailyGoals: targets
      }));
    }
  }, [step, goal]);

  const nextStep = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'gender' ? value : (parseInt(value) || 0)
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-6 overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative flex flex-col h-full max-h-[700px]">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-brand-500' : 'bg-slate-800'
              }`} 
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8 animate-slide-up">
                  <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                    <User className="text-brand-400" size={32} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">Tell us about yourself</h2>
                  <p className="text-slate-400 text-sm">We'll use this to calculate your targets.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">What's your name?</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">Age</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="number" 
                          name="age"
                          value={profile.age}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">Gender</label>
                      <select 
                        name="gender"
                        value={profile.gender}
                        onChange={handleInputChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">Weight (kg)</label>
                      <div className="relative">
                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="number" 
                          name="weight"
                          value={profile.weight}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">Height (cm)</label>
                      <div className="relative">
                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="number" 
                          name="height"
                          value={profile.height}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8 animate-slide-up">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                    <Target className="text-emerald-400" size={32} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">What's your goal?</h2>
                  <p className="text-slate-400 text-sm">Choose the path that fits you best.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <GoalCard 
                    active={goal === 'lose'}
                    onClick={() => setGoal('lose')}
                    title="Lose Weight"
                    description="Burn fat and improve your health."
                    icon={<TrendingUp className="rotate-180" />}
                    color="rose"
                  />
                  <GoalCard 
                    active={goal === 'maintain'}
                    onClick={() => setGoal('maintain')}
                    title="Maintain"
                    description="Keep your current weight and stay healthy."
                    icon={<Scale />}
                    color="emerald"
                  />
                  <GoalCard 
                    active={goal === 'gain'}
                    onClick={() => setGoal('gain')}
                    title="Gain Muscle"
                    description="Build strength and increase muscle mass."
                    icon={<TrendingUp />}
                    color="blue"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center animate-slide-up">
                  <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                    <Sparkles className="text-brand-400" size={32} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">Your Daily Targets</h2>
                  <p className="text-slate-400 text-sm">Calculated using Mifflin-St Jeor equation.</p>
                </div>

                <div className="bg-slate-800/50 rounded-[32px] p-8 border border-slate-700 space-y-8">
                  <div className="text-center space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Daily Calories</span>
                    <div className="text-5xl font-display font-bold text-white">{profile.dailyGoals.calories}</div>
                    <span className="text-xs text-slate-400">kcal / day</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <MacroResult label="Protein" value={profile.dailyGoals.protein} color="text-blue-400" />
                    <MacroResult label="Carbs" value={profile.dailyGoals.carbs} color="text-amber-400" />
                    <MacroResult label="Fat" value={profile.dailyGoals.fat} color="text-rose-400" />
                  </div>

                  <div className="pt-6 border-t border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Water Goal</p>
                        <p className="text-[10px] text-slate-500">Stay hydrated</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-white">{profile.dailyGoals.water} ml</div>
                  </div>
                </div>

                <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl">
                  <p className="text-xs text-brand-200 leading-relaxed text-center">
                    These targets are a starting point. NutriSnap will help you track your progress and adjust as needed.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-800">
          {step > 0 && (
            <button 
              onClick={prevStep}
              className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <button 
            onClick={nextStep}
            disabled={step === 0 && !profile.name}
            className={`flex-1 h-14 bg-brand-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20 ${
              step === 0 && !profile.name ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {step === totalSteps - 1 ? 'Start Journey' : 'Continue'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ active, onClick, title, description, icon, color }: any) {
  const colorClasses: any = {
    rose: active ? 'bg-rose-500/20 border-rose-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600',
    emerald: active ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600',
    blue: active ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600',
  };

  const iconClasses: any = {
    rose: active ? 'text-rose-400' : 'text-slate-500',
    emerald: active ? 'text-emerald-400' : 'text-slate-500',
    blue: active ? 'text-blue-400' : 'text-slate-500',
  };

  return (
    <button 
      onClick={onClick}
      className={`p-5 rounded-3xl border-2 transition-all text-left flex items-center gap-5 ${colorClasses[color]}`}
    >
      <div className={`w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 ${iconClasses[color]}`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div>
        <h3 className="text-white font-bold">{title}</h3>
        <p className="text-slate-500 text-xs mt-1">{description}</p>
      </div>
      {active && (
        <div className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center ${color === 'rose' ? 'bg-rose-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
          <CheckCircle2 size={14} className="text-white" />
        </div>
      )}
    </button>
  );
}

function MacroResult({ label, value, color }: any) {
  return (
    <div className="text-center space-y-1">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className={`text-xl font-bold ${color}`}>{value}g</div>
    </div>
  );
}
