import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Ticker from '../components/Ticker';

// ── Sample compounds for the showcase cards ───────────────────────────────
const sampleCompounds = [
  { name: 'Aspirin', formula: 'C₉H₈O₄', phase: 4, risk: 'Low', qed: '0.55', mw: '180.2', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { name: 'Ibuprofen', formula: 'C₁₃H₁₈O₂', phase: 4, risk: 'Low', qed: '0.49', mw: '206.3', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O' },
  { name: 'Cisplatin', formula: 'PtCl₂(NH₃)₂', phase: 4, risk: 'High', qed: '0.21', mw: '300.1', smiles: 'N.N.Cl[Pt]Cl' },
];

// Helper component for Risk Badges
function RiskBadge({ risk }) {
  const isHigh = risk === 'High';
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isHigh ? 'text-red-400' : 'text-emerald-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'}`} />
      {risk} Risk
    </span>
  );
}

const pipelineSteps = [
  { num: '01', title: 'Input SMILES', desc: 'Paste any valid SMILES string — from known drugs to novel candidates.', color: '#818cf8' },
  { num: '02', title: 'Graph Construction', desc: 'Atoms become nodes, bonds become edges. PyTorch Geometric builds a 3D graph.', color: '#a78bfa' },
  { num: '03', title: 'GNN Inference', desc: 'A multi-target GNN trained on Tox21 predicts SR-p53 pathway activation.', color: '#22d3ee' },
  { num: '04', title: 'ADMET Report', desc: 'RDKit computes Lipinski Rules and QED while ChEMBL returns clinical history.', color: '#34d399' },
];

export default function Home() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  // The function that connects the Landing Page to the Dashboard
  const handleLaunch = (smiles = '') => {
    navigate('/dashboard', { state: { initialSmiles: smiles } });
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      
      {/* ── HERO SECTION ── */}
      <div className="flex flex-col items-center text-center pt-16 pb-8 px-6">

        {/* Main Title */}
        <h1 className="font-extralight leading-[0.9] tracking-tight text-white mb-5"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}>
          CodeCure
          <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-cyan-400">
          AI
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-zinc-400 font-light leading-relaxed max-w-xl mb-3 text-lg">
          Predict <span className="text-zinc-200 font-medium">SR-p53 cellular toxicity</span> and <span className="text-zinc-200 font-medium">human absorption viability</span> <em className="not-italic text-zinc-300">in silico</em>.
        </p>

        <p className="text-zinc-700 font-mono text-[11px] tracking-[0.28em] uppercase mb-10">
          Tox21 · Graph Neural Network · RDKit · ChEMBL
        </p>

        {/* CTA Button */}
        <button
          onClick={() => handleLaunch()} // FIXED: Now uses the function
          className="group relative rounded-full font-semibold uppercase overflow-hidden transition-all duration-300 hover:scale-105 px-10 py-4 text-[13px] tracking-[0.15em] bg-indigo-500/10 border border-indigo-500/35 text-indigo-100 shadow-[0_0_40px_rgba(99,102,241,0.1)] hover:bg-indigo-500/20"
        >
          <span className="flex items-center gap-3">
            Launch Workspace
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </button>
      </div>
      
      {/* ── TICKER ── */}
      <Ticker />

      {/* ── PIPELINE STEPS ── */}
      <div className="w-full px-6 pt-12 pb-10">
        <p className="text-zinc-600 uppercase text-center mb-9 text-[10px] tracking-[0.3em]">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {pipelineSteps.map((step, i) => (
            <div key={i} className="flex flex-col gap-3 p-6 transition-colors duration-200 hover:bg-white/2 border-l border-zinc-800/50 first:border-l-0">
              <span className="font-mono font-semibold text-[10px] tracking-[0.2em]" style={{ color: step.color }}>{step.num}</span>
              <h3 className="text-white font-medium text-sm">{step.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SAMPLE COMPOUND CARDS ── */}
      <div className="w-full px-6 pb-12">
        <p className="text-zinc-600 uppercase text-center mb-8 text-[10px] tracking-[0.3em]">Try an example — click to run</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleCompounds.map((c, i) => (
            <div
              key={c.name}
              onClick={() => handleLaunch(c.smiles)} // FIXED: Now uses the function
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`glass-panel rounded-xl p-5 cursor-pointer transition-all duration-200 border border-zinc-800/60 ${hoveredCard === i ? 'border-indigo-500/40 bg-indigo-500/3' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-medium text-sm">{c.name}</p>
                  <p className="text-zinc-500 font-mono text-[11px] mt-0.5">{c.formula}</p>
                </div>
                <RiskBadge risk={c.risk} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[{ label: 'MW', val: c.mw }, { label: 'QED', val: c.qed }, { label: 'Phase', val: c.phase }].map(({ label, val }) => (
                  <div key={label} className="rounded-lg p-2 text-center bg-black/20 border border-white/5">
                    <p className="text-zinc-600 uppercase text-[9px] tracking-wider mb-1">{label}</p>
                    <p className="text-zinc-300 font-medium text-xs">{val}</p>
                  </div>
                ))}
              </div>

              <p className="text-zinc-600 font-mono text-[10px] truncate mb-3">{c.smiles}</p>

              <div className={`flex items-center gap-1.5 text-indigo-400 text-[10px] transition-opacity duration-200 ${hoveredCard === i ? 'opacity-100' : 'opacity-0'}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Run this analysis
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}