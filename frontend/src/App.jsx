import React, { useState, useEffect, useRef } from 'react';

// --- 1. MOVED OUTSIDE: The Particle class now lives globally ---
class Particle {
  constructor(x, y, directionX, directionY, size, color) {
    this.x = x; this.y = y;
    this.directionX = directionX; this.directionY = directionY;
    this.size = size; this.color = color;
  }
  
  // We pass 'ctx' in as an argument since it's no longer in scope
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  
  // We pass 'canvas', 'mouse', and 'ctx' in as arguments
  update(canvas, mouse, ctx) {
    if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
    if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mouse.radius + this.size) {
      if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 1.5;
      if (mouse.x > this.x && this.x > this.size * 10) this.x -= 1.5;
      if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 1.5;
      if (mouse.y > this.y && this.y > this.size * 10) this.y -= 1.5;
    }
    this.x += this.directionX;
    this.y += this.directionY;
    
    this.draw(ctx);
  }
}

// --- CANVAS BACKGROUND COMPONENT ---
const CanvasBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    const mouse = { x: null, y: null, radius: 120 };

    const handleMouseMove = (event) => {
      mouse.x = event.x;
      mouse.y = event.y;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseOut = () => {
      mouse.x = undefined;
      mouse.y = undefined;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mouseout', handleMouseOut);

    function init() {
      particlesArray = [];
      let numberOfParticles = (canvas.height * canvas.width) / 12000;
      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 0.5) - 0.25;
        let directionY = (Math.random() * 0.5) - 0.25;
        let color = 'rgba(129, 140, 248, 0.4)';
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
            ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

          if (distance < (canvas.width / 10) * (canvas.height / 10)) {
            let opacityValue = 1 - (distance / 20000);
            ctx.strokeStyle = `rgba(129, 140, 248, ${opacityValue * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = 0; i < particlesArray.length; i++) {
        // --- 2. Pass the required variables into the update function ---
        particlesArray[i].update(canvas, mouse, ctx);
      }
      connect();
    }

    init();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} id="chem-bg" className="fixed inset-0 pointer-events-none -z-20 opacity-60"></canvas>;
};

// ... keep LandingPage, AnalysisWorkspace, and App exactly as they are below this line

// --- LANDING PAGE COMPONENT ---
function LandingPage({ onLaunch }) {
  return (
    <div className="w-full max-w-4xl min-h-[80vh] flex flex-col items-center justify-center animate-fade-in px-4">
      <div className="text-center max-w-3xl mb-16">
        <div className="inline-block mb-4 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-widest uppercase">
          Phase Zero Drug Discovery
        </div>
        <h1 className="text-5xl md:text-7xl font-light text-white tracking-tight mb-6">
          CodeCure <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">AI</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed mb-10">
          Stop poisoning patients in Phase III. Predict SR-p53 cellular toxicity and human absorption viability <i className="text-zinc-300">in silico</i> before synthesizing a single molecule.
        </p>
        <button
          onClick={onLaunch}
          className="px-8 py-4 bg-white text-black rounded-full font-semibold tracking-wide hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          LAUNCH WORKSPACE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
          <h3 className="text-white font-medium mb-2">Deep Graph Topology</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">Utilizing PyTorch Geometric to map 3D atomic bonds and predict DNA damage beyond standard 2D molecular fingerprints.</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors">
          <h3 className="text-white font-medium mb-2">Advanced Pharmacokinetics</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">Instant RDKit calculation of Rule of 5, QED Drug-likeness, and Polar Surface Area for BBB permeability.</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
          <h3 className="text-white font-medium mb-2">Real-World Clinical Data</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">Self-healing ChEMBL API integration fetches historical Phase data, FDA Black Box warnings, and indication classes.</p>
        </div>
      </div>
    </div>
  );
}

// --- ANALYSIS WORKSPACE COMPONENT ---
function AnalysisWorkspace({ onBack }) {
  const [smiles, setSmiles] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeCompound = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles: smiles })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && result.cid && window.$3Dmol) {
      setTimeout(() => {
        const viewerElement = document.getElementById('molecule-viewer');
        if (viewerElement) {
          viewerElement.innerHTML = '';
          const viewer = window.$3Dmol.createViewer(viewerElement, { backgroundColor: 'transparent' });

          window.$3Dmol.download(`cid:${result.cid}`, viewer, {}, function () {
            viewer.setStyle({}, {
              stick: { radius: 0.15, colorscheme: 'Jmol' },
              sphere: { scale: 0.3, colorscheme: 'Jmol' }
            });
            viewer.spin("y", 0.5);
            viewer.zoomTo();
            viewer.render();
          });

          viewerElement.addEventListener('wheel', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            viewer.zoom(zoomFactor);
          }, { passive: false, capture: true });
        }
      }, 150);
    }
  }, [result]);

  const getRiskIndicator = (level) => {
    if (level === "High Risk") return <span className="flex items-center gap-2 text-red-400 font-medium"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Critical Risk</span>;
    if (level === "Medium Risk") return <span className="flex items-center gap-2 text-amber-400 font-medium"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Elevated Risk</span>;
    return <span className="flex items-center gap-2 text-emerald-400 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> Low Risk</span>;
  };

  return (
    <div className="w-full max-w-4xl animate-fade-in mx-auto relative px-4">
      <button onClick={onBack} className="absolute -top-12 left-4 text-zinc-500 hover:text-white text-sm flex items-center gap-2 transition-colors">
        &larr; Back to Home
      </button>

      <div className="mb-12 text-center mt-8">
        <h1 className="text-3xl font-light text-white tracking-widest uppercase mb-2">CodeCure <span className="font-semibold text-indigo-400">AI</span></h1>
        <p className="text-sm text-zinc-500 tracking-wide">DEEP GRAPH NEURAL NETWORK • TOX21 PATHWAY ANALYSIS</p>
      </div>

      <form onSubmit={analyzeCompound} className="mb-8 relative group max-w-2xl mx-auto">
        <input
          type="text"
          value={smiles}
          onChange={(e) => setSmiles(e.target.value)}
          className="w-full bg-transparent border-b border-zinc-700 py-4 pr-32 text-white mono text-lg focus:border-indigo-400 outline-none transition-colors"
          placeholder="Enter SMILES string..."
          spellCheck="false"
        />
        <button
          type="submit"
          disabled={loading || !smiles}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-6 py-2 bg-white text-black text-sm font-semibold tracking-wide rounded-full hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          {loading ? "RUNNING" : "ANALYZE"}
        </button>
      </form>

      {error && (
        <div className="text-red-400 text-sm py-3 border-l-2 border-red-500 pl-4 mb-8 max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {loading && (
        <div className="glass-panel rounded-2xl p-10 text-center max-w-2xl mx-auto">
          <p className="text-zinc-400 text-sm tracking-widest uppercase mb-2 animate-pulse">Constructing Graph Topology & Querying ChEMBL</p>
          <div className="h-px w-24 bg-indigo-500/50 mx-auto"></div>
        </div>
      )}

      {result && !loading && (
        <div className="glass-panel rounded-2xl p-8 shadow-2xl transition-all duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-6 border-b border-zinc-800/50 gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Identified Compound</p>
              <h2 className="text-4xl font-semibold text-white tracking-tight">{result.compound_name}</h2>
            </div>
            <div className="text-right">
              {getRiskIndicator(result.risk_level)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 flex flex-col gap-4 pr-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">SR-p53 Toxicity Probability</p>
                <p className="text-5xl font-light text-white mb-2">
                  {(result.toxicity_risk_score * 100).toFixed(2)}<span className="text-2xl text-zinc-600">%</span>
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-5 border border-white/5 shadow-inner mt-2">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                  <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">Pharmacokinetics (Rule of 5)</p>
                  {result.pharmacokinetics.lipinski_pass ?
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-wider">Viable Absorption</span> :
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 uppercase tracking-wider">Absorption Risk</span>
                  }
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Weight</p>
                    <p className={`text-lg font-medium ${result.pharmacokinetics.weight > 500 ? 'text-red-400' : 'text-zinc-200'}`}>{result.pharmacokinetics.weight} <span className="text-xs text-zinc-600">Da</span></p>
                    <p className="text-[9px] text-zinc-600 mt-1">&le; 500</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Lipophilicity</p>
                    <p className={`text-lg font-medium ${result.pharmacokinetics.logp > 5 ? 'text-red-400' : 'text-zinc-200'}`}>{result.pharmacokinetics.logp}</p>
                    <p className="text-[9px] text-zinc-600 mt-1">LogP &le; 5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">H-Donors</p>
                    <p className={`text-lg font-medium ${result.pharmacokinetics.h_donors > 5 ? 'text-red-400' : 'text-zinc-200'}`}>{result.pharmacokinetics.h_donors}</p>
                    <p className="text-[9px] text-zinc-600 mt-1">&le; 5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">H-Acceptors</p>
                    <p className={`text-lg font-medium ${result.pharmacokinetics.h_acceptors > 10 ? 'text-red-400' : 'text-zinc-200'}`}>{result.pharmacokinetics.h_acceptors}</p>
                    <p className="text-[9px] text-zinc-600 mt-1">&le; 10</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 shadow-inner flex flex-col justify-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Polar Surface Area (PSA)</p>
                  <p className="text-lg font-medium text-zinc-200">{result.chembl.psa !== 'N/A' ? result.chembl.psa : '--'} <span className="text-xs text-zinc-600">Å²</span></p>
                  <p className={`text-[9px] mt-1 uppercase tracking-wider font-semibold ${result.chembl.psa !== 'N/A' && result.chembl.psa <= 90 ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    {result.chembl.psa !== 'N/A' ? (result.chembl.psa <= 90 ? 'High BBB Permeability' : 'Low BBB Permeability') : 'Unknown Permeability'}
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 shadow-inner flex flex-col justify-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">QED Drug-Likeness</p>
                  <p className={`text-lg font-medium ${result.chembl.qed_score !== 'N/A' && result.chembl.qed_score > 0.6 ? 'text-emerald-400' : (result.chembl.qed_score !== 'N/A' && result.chembl.qed_score < 0.3 ? 'text-amber-400' : 'text-zinc-200')}`}>
                    {result.chembl.qed_score !== 'N/A' ? Number(result.chembl.qed_score).toFixed(3) : '--'}
                  </p>
                  <p className="text-[9px] text-zinc-600 mt-1">Scale: 0.0 - 1.0</p>
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-5 border border-white/5 shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/5 pb-3 gap-3">
                  <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                    Clinical Profile
                    <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded">ChEMBL DB</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.chembl.withdrawn && (
                      <span className="text-[10px] bg-red-900/50 text-red-200 px-2 py-1 rounded border border-red-500 uppercase tracking-wider font-bold">Withdrawn</span>
                    )}
                    {result.chembl.black_box_warning && (
                      <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/30 uppercase tracking-wider font-bold shadow-[0_0_8px_rgba(239,68,68,0.4)]">FDA Black Box</span>
                    )}
                    {result.chembl.max_phase > 0 ?
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 uppercase tracking-wider">Phase {result.chembl.max_phase}</span> :
                      <span className="text-[10px] bg-zinc-500/10 text-zinc-400 px-2 py-1 rounded border border-zinc-500/20 uppercase tracking-wider">Novel / Pre-Clinical</span>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2">
                  <div className="col-span-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Database ID</p>
                    <p className="text-sm font-medium text-zinc-200 mono">{result.chembl.id}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Molecule Category</p>
                    <p className="text-sm font-medium text-zinc-200 truncate pr-2" title={result.chembl.type}>
                      {result.chembl.type !== 'Unknown' ? result.chembl.type : 'Unclassified'}
                    </p>
                  </div>
                  <div className="col-span-1 text-left sm:text-right">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Approval</p>
                    <p className="text-sm font-medium text-zinc-200">{result.chembl.approval_year !== 'N/A' ? result.chembl.approval_year : '--'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="h-64 lg:h-96 w-full bg-black/40 rounded-xl border border-white/10 relative overflow-hidden group shadow-inner">
                <div className="absolute top-3 left-3 z-10">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold drop-shadow-md">Interactive 3D Model</p>
                </div>

                {result.compound_name === "Unknown / Novel Compound" ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <p className="text-zinc-600 text-xs">3D rendering unavailable for uncatalogued novel SMILES strings.</p>
                  </div>
                ) : (
                  <div id="molecule-viewer" className="absolute inset-0 cursor-move"></div>
                )}

                <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <p className="text-[9px] text-zinc-300 uppercase tracking-widest bg-black/60 px-2 py-1 rounded backdrop-blur-md border border-white/10">
                    Drag to Rotate • Scroll to Zoom
                  </p>
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/5 shadow-inner">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Input Geometry</p>
                <p className="text-xs text-zinc-400 mono break-all leading-relaxed">
                  {result.smiles_analyzed}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-6 border-t border-zinc-800/50">
            <p className="text-[10px] leading-relaxed text-zinc-600 uppercase tracking-wide">
              * Prediction represents the probability of cellular stress and DNA damage strictly along the SR-p53 bioassay pathway. This model utilizes a multi-target Graph Neural Network.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MASTER CONTROLLER ---
export default function App() {
  const [currentView, setCurrentView] = useState('landing');

  return (
    <>
      <CanvasBackground />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {currentView === 'landing' ? (
        <LandingPage onLaunch={() => setCurrentView('workspace')} />
      ) : (
        <AnalysisWorkspace onBack={() => setCurrentView('landing')} />
      )}
    </>
  );
}