import React from 'react';
import { motion } from 'motion/react';

interface WaterBottleProps {
  progress: number; // 0 to 100
}

export const WaterBottle: React.FC<WaterBottleProps> = ({ progress }) => {
  const fillHeight = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="relative w-24 h-40 mx-auto">
      {/* Bottle Outline */}
      <svg
        viewBox="0 0 100 200"
        className="w-full h-full drop-shadow-lg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id="bottleClip">
            <path
              d="M30,10 L70,10 L70,30 L85,50 L85,180 Q85,195 70,195 L30,195 Q15,195 15,180 L15,50 L30,30 Z"
            />
          </clipPath>
          <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* Bottle Body */}
        <path
          d="M30,10 L70,10 L70,30 L85,50 L85,180 Q85,195 70,195 L30,195 Q15,195 15,180 L15,50 L30,30 Z"
          className="fill-white dark:fill-[#1A1A2E] stroke-slate-200 dark:stroke-white/10"
          strokeWidth="4"
        />

        {/* Water Fill */}
        <g clipPath="url(#bottleClip)">
          <motion.rect
            initial={{ height: 0 }}
            animate={{ height: `${fillHeight}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            x="0"
            y={200 - (fillHeight * 2)}
            width="100"
            height="200"
            fill="url(#waterGradient)"
          />
          
          {/* Animated Waves */}
          <motion.path
            d="M 0 10 Q 25 0 50 10 T 100 10 V 20 H 0 Z"
            fill="#93c5fd"
            opacity="0.5"
            animate={{
              x: [-100, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
            style={{
              y: 200 - (fillHeight * 2) - 10,
            }}
          />
        </g>

        {/* Measurement Lines */}
        <line x1="20" y1="50" x2="30" y2="50" className="stroke-slate-300 dark:stroke-white/20" strokeWidth="2" />
        <line x1="20" y1="100" x2="30" y2="100" className="stroke-slate-300 dark:stroke-white/20" strokeWidth="2" />
        <line x1="20" y1="150" x2="30" y2="150" className="stroke-slate-300 dark:stroke-white/20" strokeWidth="2" />
      </svg>
      
      {/* Percentage Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-black/20 px-1 rounded backdrop-blur-sm">
          {Math.round(fillHeight)}%
        </span>
      </div>
    </div>
  );
};
