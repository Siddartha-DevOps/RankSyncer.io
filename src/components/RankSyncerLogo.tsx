import React from 'react';

interface RankSyncerLogoProps {
  theme?: 'light' | 'dark';
  className?: string; // custom outer wrapper class
  hideText?: boolean;
}

export function RankSyncerIcon({ className = "h-9 w-9" }) {
  return (
    <svg 
      id="ranksyncer-mark-svg"
      viewBox="0 0 64 64" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Premium rounded squircle block background exactly like the logo reference */}
      <rect width="64" height="64" rx="16" fill="#22c55e" />
      
      {/* 3 Ascending ranking bars (increasing keyword heights) with elegant rounded tops */}
      <rect x="20" y="38" width="5" height="10" rx="1.5" fill="#ffffff" />
      <rect x="29" y="28" width="5" height="20" rx="1.5" fill="#ffffff" />
      <rect x="38" y="18" width="5" height="30" rx="1.5" fill="#ffffff" />
      
      {/* Overlapping sync arc arrow: elegant clean curve starting from left, arching over bars, pointing down-right */}
      <path 
        d="M16 28 C20 17, 34 14, 42 22" 
        stroke="#ffffff" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Arrow tipped downwards right exactly like the image system */}
      <path 
        d="M36 22 H42 V16" 
        stroke="#ffffff" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />
    </svg>
  );
}

export default function RankSyncerLogo({ theme = 'dark', className = "flex items-center space-x-3", hideText = false }: RankSyncerLogoProps) {
  return (
    <div id="ranksyncer-logo-block" className={className}>
      <RankSyncerIcon className="h-9 w-9 shrink-0 shadow-xs" />
      
      {!hideText && (
        <div className="flex flex-col text-left">
          <div className="flex items-baseline space-x-0.5 font-sans">
            <span 
              className={`text-lg font-black tracking-tight leading-none ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Rank
            </span>
            <span 
              className="text-lg font-black tracking-tight leading-none text-[#22c55e]"
            >
              Syncer
            </span>
            <span 
              className={`text-xs font-black tracking-tighter ml-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              .co
            </span>
          </div>
          
          <p 
            className={`text-[9px] font-bold tracking-tight uppercase leading-none mt-0.5 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            SEO Autopilot Engine
          </p>
        </div>
      )}
    </div>
  );
}
