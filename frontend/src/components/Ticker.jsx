import React from 'react';

const tickerItems = [
  'Aspirin · C₉H₈O₄', 'Caffeine · C₈H₁₀N₄O₂', 'Ibuprofen · C₁₃H₁₈O₂',
  'Paracetamol · C₈H₉NO₂', 'Metformin · C₄H₁₁N₅', 'Atorvastatin · C₃₃H₃₅FN₂O₅',
  'Cisplatin · Pt(NH₃)₂Cl₂', 'Doxorubicin · C₂₇H₂₉NO₁₁', 'Warfarin · C₁₉H₁₆O₄',
  'Sildenafil · C₂₂H₃₀N₆O₄S', 'Morphine · C₁₇H₁₉NO₃', 'Tamoxifen · C₂₆H₂₉NO',
];

const Ticker = () => {
  const doubled = [...tickerItems, ...tickerItems];
  
  return (
    <div className="w-full overflow-hidden py-3 border-y border-zinc-800/60 relative my-2">
      {/* Fading gradients on the edges */}
      <div className="absolute left-0 top-0 h-full w-16 z-10 pointer-events-none" 
           style={{ background: 'linear-gradient(to right, #09090b, transparent)' }} />
      <div className="absolute right-0 top-0 h-full w-16 z-10 pointer-events-none" 
           style={{ background: 'linear-gradient(to left, #09090b, transparent)' }} />
      
      {/* Scrolling Container */}
      <div className="flex gap-10 animate-ticker whitespace-nowrap">
        {doubled.map((c, i) => (
          <span key={i} className="text-[11px] font-mono text-zinc-500 tracking-wider shrink-0">
            <span className="text-indigo-500/50 mr-2">◆</span>{c}
          </span>
        ))}
      </div>

      {/* Global CSS for the animation if not in your tailwind.config */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 28s linear infinite;
        }
      `}} />
    </div>
  );
};

export default Ticker;