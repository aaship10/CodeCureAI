import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { removeToken } from '../utils/auth';

export default function Navbar({ setAuth, isAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleAuthAction = () => {
    if (isAuth) {
      removeToken();
      setAuth(false);
    }
    navigate('/auth');
  };

  // Helper to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      // CHANGED: Solid background, perfectly static, no glassmorphism
      className={`relative h-full bg-[#090b14] border-r border-white/5 flex flex-col py-5 px-3 z-20 text-white transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* --- TOGGLE BUTTON --- */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-8 bg-zinc-800 border border-zinc-600 rounded-full p-1 hover:bg-zinc-600 transition-colors z-30 shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      {/* --- LOGO SECTION --- */}
      <div className="pb-6 pt-2 mb-2 flex justify-center overflow-hidden shrink-0">
        {collapsed ? (
          <span className="text-2xl font-bold text-indigo-500">AI</span>
        ) : (
          <h1 className="font-bold tracking-wider text-center flex flex-col items-center">
            <span className="text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-0.5">CodeCure</span>
            <span className="text-2xl font-bold text-indigo-400">AI</span>
          </h1>
        )}
      </div>

      {/* --- MAIN LINKS SECTION --- */}
      <div className="flex flex-col gap-2 grow overflow-hidden">
        
        <Link 
          to="/" 
          className={`transition-colors p-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 overflow-hidden group
            ${isActive('/') ? 'bg-white/10' : 'hover:bg-white/5'}
          `}
          title="Home"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <div className={`w-2 h-2 rounded-full transition-colors ${isActive('/') ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-zinc-600 group-hover:bg-blue-400'}`}></div>
          </div>
          {!collapsed && <span className={`text-sm tracking-widest uppercase whitespace-nowrap transition-colors ${isActive('/') ? 'text-blue-300 font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'}`}>Home</span>}
        </Link>

        <Link 
          to="/dashboard" 
          className={`transition-colors p-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 overflow-hidden group
            ${isActive('/dashboard') ? 'bg-white/10' : 'hover:bg-white/5'}
          `}
          title="Dashboard"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <div className={`w-2 h-2 rounded-full transition-colors ${isActive('/dashboard') ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-600 group-hover:bg-indigo-400'}`}></div>
          </div>
          {!collapsed && <span className={`text-sm tracking-widest uppercase whitespace-nowrap transition-colors ${isActive('/dashboard') ? 'text-indigo-300 font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'}`}>Dashboard</span>}
        </Link>
        
        {isAuth && (
          <Link 
            to="/history" 
            className={`transition-colors p-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 overflow-hidden group
              ${isActive('/history') ? 'bg-white/10' : 'hover:bg-white/5'}
            `}
            title="History"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <div className={`w-2 h-2 rounded-full transition-colors ${isActive('/history') ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600 group-hover:bg-emerald-400'}`}></div>
            </div>
            {!collapsed && <span className={`text-sm tracking-widest uppercase whitespace-nowrap transition-colors ${isActive('/history') ? 'text-emerald-300 font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'}`}>History</span>}
          </Link>
        )}
      </div>

      {/* --- BOTTOM ACTION SECTION --- */}
      <div className="mt-auto pt-4 shrink-0">
        <button 
          onClick={handleAuthAction} 
          className={`font-semibold tracking-wide rounded-lg transition-all duration-300 flex items-center justify-center w-full
            ${isAuth 
              ? 'bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/30' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }
            ${collapsed ? 'p-3' : 'py-3 px-4'}
          `}
          title={isAuth ? "Logout" : "Login"}
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isAuth ? (
                <>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </>
              ) : (
                <>
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </>
              )}
            </svg>
          ) : (
            <span className="text-xs uppercase tracking-widest">{isAuth ? 'Logout' : 'Login'}</span>
          )}
        </button>
      </div>
    </nav>
  );
}