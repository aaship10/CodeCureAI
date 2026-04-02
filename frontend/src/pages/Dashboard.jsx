import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function Dashboard() {
  const location = useLocation();
  const hasInitialized = useRef(false); // Prevents the "Initial Molecule" loop

  // 1. STATE INITIALIZATION
  const [activeTab, setActiveTab] = useState(() => 
    sessionStorage.getItem('codecure_active_tab') || 'single'
  );

  const [smiles, setSmiles] = useState(() => 
    sessionStorage.getItem('codecure_smiles') || location.state?.initialSmiles || ""
  );

  const [result, setResult] = useState(() => {
    const saved = sessionStorage.getItem('codecure_single_result');
    return saved ? JSON.parse(saved) : null;
  });

  const [batchResults, setBatchResults] = useState(() => {
    const saved = sessionStorage.getItem('codecure_batch_results');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batchFile, setBatchFile] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const isAuth = isAuthenticated();

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('codecure_active_tab', activeTab);
    sessionStorage.setItem('codecure_smiles', smiles);
    if (result) sessionStorage.setItem('codecure_single_result', JSON.stringify(result));
    if (batchResults) sessionStorage.setItem('codecure_batch_results', JSON.stringify(batchResults));
  }, [activeTab, smiles, result, batchResults]);

  // 2. RISK INDICATOR UTILITY
  const getRiskIndicator = (level) => {
    const baseClass = "px-3 py-1.5 rounded-full border uppercase font-bold text-[10px] sm:text-xs tracking-wider flex items-center gap-2";
    if (level === "High Risk") return (
      <span className={`${baseClass} bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]`}>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Critical Risk
      </span>
    );
    if (level === "Medium Risk") return (
      <span className={`${baseClass} bg-amber-500/10 text-amber-400 border-amber-500/30`}>
        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Elevated Risk
      </span>
    );
    return (
      <span className={`${baseClass} bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Low Risk
      </span>
    );
  };

  // 3. 3D RENDER EFFECTS
  useEffect(() => {
    if (activeTab === 'single' && result && result.cid && window.$3Dmol) {
      setTimeout(() => {
        const viewerElement = document.getElementById('molecule-viewer');
        if (viewerElement) {
          viewerElement.innerHTML = '';
          const viewer = window.$3Dmol.createViewer(viewerElement, { backgroundColor: 'transparent' });
          window.$3Dmol.download(`cid:${result.cid}`, viewer, {}, function () {
            viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' }, sphere: { scale: 0.3, colorscheme: 'Jmol' } });
            viewer.spin("y", 0.5); viewer.zoomTo(); viewer.render();
          });
        }
      }, 150);
    }
  }, [result, activeTab]);

  useEffect(() => {
    if (activeTab === 'batch' && expandedRow !== null && batchResults?.[expandedRow]?.cid && window.$3Dmol) {
      const item = batchResults[expandedRow];
      setTimeout(() => {
        const viewerElement = document.getElementById(`batch-viewer-${expandedRow}`);
        if (viewerElement) {
          viewerElement.innerHTML = '';
          const viewer = window.$3Dmol.createViewer(viewerElement, { backgroundColor: 'transparent' });
          window.$3Dmol.download(`cid:${item.cid}`, viewer, {}, function () {
            viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' } });
            viewer.zoomTo(); viewer.render();
          });
        }
      }, 100);
    }
  }, [expandedRow, batchResults, activeTab]);

  // 4. CORE ANALYSIS LOGIC
  const analyzeCompound = useCallback(async (e, smilesOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const targetSmiles = smilesOverride || smiles;
    if (!targetSmiles) return;

    setLoading(true);
    setError(null);
    // Note: We don't setResult(null) here to avoid flickering if switching examples quickly
    try {
      const data = await apiCall('/predict', 'POST', { smiles: targetSmiles });
      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [smiles]);

  const handleExampleClick = (exampleSmiles) => {
    setSmiles(exampleSmiles); 
    analyzeCompound(null, exampleSmiles); 
  };

  // FIXED: Run initial analysis ONLY ONCE when the page loads
  useEffect(() => {
    if (location.state?.initialSmiles && !hasInitialized.current) {
      analyzeCompound(null, location.state.initialSmiles);
      hasInitialized.current = true; // Lock it so it never runs again
    }
  }, [location.state, analyzeCompound]);

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (!batchFile) return;
    setBatchLoading(true);
    setBatchResults(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', batchFile);

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('http://127.0.0.1:8000/api/predict-batch', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) throw new Error("Batch processing failed");
      const data = await response.json();
      setBatchResults(data.batch_results);
    } catch (err) {
      setError(err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  // 5. EXPORT UTILITIES (Unchanged)
  const downloadSinglePDF = async () => {
    const element = document.getElementById('medical-report');
    try {
      const dataUrl = await toPng(element, { quality: 0.95, backgroundColor: '#090b14', pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CodeCure_Report_${result.compound_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      setError(`Failed to generate PDF: ${err.message}`);
    }
  };

  const downloadBatchPDF = async () => {
    const element = document.getElementById('batch-report-table');
    const scrollContainer = element.querySelector('.overflow-y-auto');
    if (!element || !scrollContainer) return;
    const originalMaxHeight = scrollContainer.style.maxHeight;
    const originalOverflow = scrollContainer.style.overflow;
    try {
      scrollContainer.style.maxHeight = 'none';
      scrollContainer.style.overflow = 'visible';
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(element, { quality: 0.95, backgroundColor: '#090b14', pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CodeCure_Batch_Analysis.pdf`);
    } catch (err) {
      console.error("Batch PDF Export Error:", err);
      setError("Failed to generate Batch PDF.");
    } finally {
      scrollContainer.style.maxHeight = originalMaxHeight;
      scrollContainer.style.overflow = originalOverflow;
    }
  };   

  const downloadBatchCSV = () => {
    if (!batchResults) return;
    const headers = ["Compound Name,SMILES String,SR-p53 Risk (%),Classification"];
    const rows = batchResults.map(r => `"${r.compound_name}","${r.smiles}",${(r.risk_score * 100).toFixed(2)},"${r.risk_level}"`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "CodeCure_Batch_Results.csv");
    link.click();
  };

  // 6. RENDER UI
  return (
    <div className="w-full max-w-5xl animate-fade-in mx-auto relative px-4 py-12">
      
      {!isAuth && (
        <div className="bg-yellow-600/10 border border-yellow-500/50 text-yellow-200 p-4 rounded-xl mb-8 flex justify-between items-center backdrop-blur-md">
          <span className="text-sm tracking-tight font-light">Guest Mode: Predictions will not be saved to history.</span>
          <Link to="/auth" className="bg-yellow-500 text-gray-900 px-4 py-1.5 rounded-full font-bold text-xs hover:bg-yellow-400 transition">Login</Link>
        </div>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-light text-white tracking-widest uppercase mb-6">CodeCure <span className="font-semibold text-indigo-400">AI</span></h1>
        <div className="flex justify-center gap-4 bg-white/5 p-1.5 rounded-full w-fit mx-auto border border-white/10">
          <button onClick={() => {setActiveTab('single'); setExpandedRow(null);}} className={`px-6 py-2 rounded-full text-xs tracking-wide font-semibold transition-all ${activeTab === 'single' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white'}`}>Single Molecule</button>
          <button onClick={() => {setActiveTab('batch'); setExpandedRow(null);}} className={`px-6 py-2 rounded-full text-xs tracking-wide font-semibold transition-all ${activeTab === 'batch' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'}`}>Enterprise Batch</button>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm py-3 border-l-2 border-red-500 pl-4 mb-8 max-w-2xl mx-auto bg-red-900/20">{error}</div>}

      {activeTab === 'single' && (
        <>
          {/* EXAMPLE CARDS SECTION */}
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">
              Try an Example — Click to Run
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O', color: 'emerald' },
                { name: 'Ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', color: 'emerald' },
                { name: 'Cisplatin', smiles: 'N.N.Cl[Pt]Cl', color: 'red' }
              ].map((ex) => (
                <div 
                  key={ex.name}
                  onClick={() => handleExampleClick(ex.smiles)} 
                  className="bg-white/3 p-4 rounded-xl border border-white/5 hover:border-indigo-500/50 cursor-pointer transition-all group backdrop-blur-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {ex.name}
                    </h4>
                    <span className={`w-1.5 h-1.5 rounded-full ${ex.color === 'red' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}></span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500 truncate">{ex.smiles}</p>
                </div>
              ))}
            </div>
          </div>
          
          <form onSubmit={analyzeCompound} className="mb-8 relative max-w-2xl mx-auto">
            <input type="text" value={smiles} onChange={(e) => setSmiles(e.target.value)} className="w-full bg-transparent border-b border-zinc-700 py-4 pr-32 text-white font-mono text-lg focus:border-indigo-400 outline-none transition-colors" placeholder="Enter SMILES string..." />
            <button type="submit" disabled={loading || !smiles} className="absolute right-0 top-1/2 -translate-y-1/2 px-6 py-2 bg-white text-black text-xs font-semibold rounded-full hover:bg-zinc-200 transition-all">{loading ? "RUNNING" : "ANALYZE"}</button>
          </form>

          {loading && (
            <div className="glass-panel rounded-2xl p-10 text-center max-w-2xl mx-auto">
              <p className="text-zinc-400 text-sm tracking-widest uppercase mb-2 animate-pulse">Analyzing Graph Neural Network Pathway...</p>
              <div className="h-px w-24 bg-indigo-500/50 mx-auto"></div>
            </div>
          )}

          {result && !loading && (
            <div className="relative animate-fade-in">
              <div className="absolute -top-12 right-0 z-10">
                <button onClick={downloadSinglePDF} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/50 px-3 py-1.5 rounded-lg transition-all">
                    Export PDF
                </button>
              </div>

              <div id="medical-report" className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-6 border-b border-zinc-800/50 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Identified Compound</p>
                    <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">{result.compound_name}</h2>
                  </div>
                  <div className="text-right">{getRiskIndicator(result.risk_level)}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">SR-p53 Toxicity Probability</p>
                      <p className="text-4xl sm:text-5xl font-light text-white">{(result.toxicity_risk_score * 100).toFixed(2)}%</p>
                    </div>

                    <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                        <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">Pharmacokinetics (Rule of 5)</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${result.pharmacokinetics?.lipinski_pass ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          {result.pharmacokinetics?.lipinski_pass ? 'Viable' : 'Risk'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><p className="text-[9px] text-zinc-500 uppercase">Weight</p><p className="text-sm text-zinc-200">{result.pharmacokinetics?.weight} Da</p></div>
                        <div><p className="text-[9px] text-zinc-500 uppercase">LogP</p><p className="text-sm text-zinc-200">{result.pharmacokinetics?.logp}</p></div>
                        <div><p className="text-[9px] text-zinc-500 uppercase">H-Donors</p><p className="text-sm text-zinc-200">{result.pharmacokinetics?.h_donors}</p></div>
                        <div><p className="text-[9px] text-zinc-500 uppercase">H-Acceptors</p><p className="text-sm text-zinc-200">{result.pharmacokinetics?.h_acceptors}</p></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <p className="text-[9px] text-zinc-500 uppercase mb-1">Polar Surface Area</p>
                        <p className="text-lg text-zinc-200">{result.chembl?.psa} Å²</p>
                      </div>
                      <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <p className="text-[9px] text-zinc-500 uppercase mb-1">QED Drug-Likeness</p>
                        <p className="text-lg text-zinc-200">{result.chembl?.qed_score !== 'N/A' ? Number(result.chembl?.qed_score).toFixed(3) : '--'}</p>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                      <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold mb-4 border-b border-white/5 pb-3">Clinical Profile</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div><p className="text-zinc-500 text-[9px] uppercase">ChEMBL ID</p><p className="font-mono text-indigo-300">{result.chembl?.id || 'N/A'}</p></div>
                        <div><p className="text-zinc-500 text-[9px] uppercase">Max Clinical Phase</p><p className="text-white">Phase {result.chembl?.max_phase || '0'}</p></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="h-64 lg:h-104 w-full bg-black/40 rounded-xl border border-white/10 relative overflow-hidden group">
                      <div id="molecule-viewer" className="absolute inset-0 cursor-move"></div>
                      <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-zinc-400 bg-black/50 px-2 py-1 rounded">Interactive 3D View</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Input SMILES</p>
                      <p className="text-[10px] text-zinc-400 font-mono break-all leading-relaxed">{result.smiles_analyzed}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enterprise Batch Section (Unchanged logic, kept for complete file) */}
      {activeTab === 'batch' && (
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="glass-panel border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-2xl p-10 text-center transition-colors">
            <h3 className="text-lg font-medium text-white mb-2">Enterprise Batch Processor</h3>
            <form onSubmit={handleBatchUpload} className="flex flex-col items-center gap-4">
              <input type="file" accept=".csv" onChange={(e) => setBatchFile(e.target.files[0])} className="block w-full max-w-sm text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-500/10 file:text-emerald-400 cursor-pointer" />
              <button type="submit" disabled={batchLoading || !batchFile} className="mt-4 px-8 py-2.5 bg-emerald-500 text-white text-xs font-semibold rounded-full hover:bg-emerald-400 transition-all">{batchLoading ? "PROCESSING..." : "RUN BATCH ANALYSIS"}</button>
            </form>
          </div>

          {batchResults && !batchLoading && (
            <div className="mt-8 glass-panel rounded-2xl overflow-hidden shadow-2xl" id="batch-report-table">
              <div className="bg-black/40 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Multi-Compound Results</h3>
                <div className="flex gap-2">
                  <button onClick={downloadBatchCSV} className="text-[9px] font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all">Download CSV</button>
                  <button onClick={downloadBatchPDF} className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all">Download PDF</button>
                </div>
              </div>
              <div className="max-h-125 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#090b14] sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase text-zinc-500">Compound</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase text-zinc-500">SR-p53 Risk</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase text-zinc-500">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-[#090b14]/50">
                    {batchResults.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr onClick={() => setExpandedRow(expandedRow === index ? null : index)} className="hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5">
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-white flex items-center gap-2">{item.compound_name} {expandedRow === index ? '▼' : '▶'}</p>
                            <p className="text-[10px] font-mono text-zinc-500 truncate max-w-xs">{item.smiles}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-zinc-200">{(item.risk_score * 100).toFixed(2)}%</td>
                          <td className="px-6 py-4">
                             <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${item.risk_level === 'High Risk' ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'}`}>{item.risk_level}</span>
                          </td>
                        </tr>
                        {expandedRow === index && (
                          <tr className="bg-indigo-500/5 animate-fade-in">
                            <td colSpan="3" className="px-6 py-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="h-64 bg-black/40 rounded-xl border border-white/10 relative overflow-hidden">
                                  <div id={`batch-viewer-${index}`} className="absolute inset-0"></div>
                                </div>
                                <div className="flex flex-col gap-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-panel p-3 rounded-lg border border-white/5">
                                      <p className="text-[9px] text-zinc-500 uppercase mb-1">ChEMBL ID</p>
                                      <p className="text-xs text-indigo-300 font-mono">{item.chembl?.id || 'N/A'}</p>
                                    </div>
                                    <div className="glass-panel p-3 rounded-lg border border-white/5">
                                      <p className="text-[9px] text-zinc-500 uppercase mb-1">Max Phase</p>
                                      <p className="text-xs text-white">Phase {item.chembl?.max_phase || 0}</p>
                                    </div>
                                  </div>
                                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-3">Pharmacokinetics</p>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <p className="text-zinc-500">Weight: <span className="text-white">{item.pharmacokinetics?.weight} Da</span></p>
                                      <p className="text-zinc-500">LogP: <span className="text-white">{item.pharmacokinetics?.logp}</span></p>
                                      <p className="text-zinc-500">H-Donors: <span className="text-white">{item.pharmacokinetics?.h_donors}</span></p>
                                      <p className="text-zinc-500">Lipinski: <span className={item.pharmacokinetics?.lipinski_pass ? "text-emerald-400" : "text-red-400"}>{item.pharmacokinetics?.lipinski_pass ? "PASS" : "FAIL"}</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}