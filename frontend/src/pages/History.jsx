import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. IMPORT THIS
import { apiCall } from '../utils/api';
import Loader from '../components/Loader';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 2. INITIALIZE HOOK

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiCall('/history');
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setHistory(sortedData);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // 3. ADD THE CLICK HANDLER
  const handleCardClick = (smilesString) => {
    // This sends the user to the dashboard and passes the SMILES string in the background
    navigate('/dashboard', { state: { initialSmiles: smilesString } });
  };

  if (loading) return <div className="mt-20"><Loader /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto text-white animate-fade-in relative z-10">
      
      <div className="mb-8 text-center mt-4">
        <h1 className="text-3xl font-light text-white tracking-widest uppercase mb-2">
          Prediction <span className="font-semibold text-indigo-400">Log</span>
        </h1>
        <p className="text-zinc-500 text-sm tracking-wide">Enterprise and Single Molecule Analysis History</p>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-600 mb-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <p className="text-zinc-400 tracking-widest uppercase text-sm">No predictions saved yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 custom-scrollbar">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleCardClick(item.smiles_string)} // 4. TRIGGER CLICK HERE
              className="glass-panel p-5 rounded-xl flex justify-between items-center group hover:border-indigo-500 hover:bg-white/5 transition-all shadow-lg cursor-pointer" // Added cursor-pointer and hover:bg
            >
              <div className="flex flex-col gap-1 overflow-hidden pr-4">
                <p className="font-mono text-indigo-300/80 text-xs sm:text-sm truncate group-hover:text-indigo-400 transition-colors">
                  {item.smiles_string}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {/* Fixed the UTC timezone issue here too! */}
                  {new Date(item.timestamp + 'Z').toLocaleString()} 
                </p>
              </div>
              
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span className={`text-[11px] px-2.5 py-1 rounded border uppercase font-bold tracking-wider ${
                  item.prediction_result === 'High Risk' 
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                    : item.prediction_result === 'Medium Risk'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                }`}>
                  {item.prediction_result}
                </span>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  Conf: {(item.confidence_score * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}