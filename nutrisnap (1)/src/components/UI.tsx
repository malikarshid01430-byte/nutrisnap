import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function Skeleton({ className, ...props }: { className?: string, [key: string]: any }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} {...props} />;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  illustration
}: { 
  icon?: any, 
  title: string, 
  description: string, 
  actionLabel?: string, 
  onAction?: () => void,
  illustration?: string
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center p-8 space-y-6"
    >
      {illustration ? (
        <div className="w-48 h-48 animate-float">
          <img src={illustration} alt="Empty state" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
      ) : Icon && (
        <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center text-brand-500 dark:text-brand-400 animate-float">
          <Icon size={40} />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-brand-600 text-white px-8 py-4 min-h-[52px] rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

export function useLoading(duration = 1000) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);
  return isLoading;
}
