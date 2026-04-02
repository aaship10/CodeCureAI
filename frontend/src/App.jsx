import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { isAuthenticated } from './utils/auth';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import CanvasBackground from './components/CanvasBackground'; // Teammate's new version
import Home from './pages/Home'; // We will put the LandingPage logic here
import Dashboard from './pages/Dashboard';
import History from './pages/History';

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/auth" />;
};

export default function App() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const location = useLocation(); 
  const isLanding = location.pathname === '/';

return (
    <div className="h-screen w-full overflow-hidden font-sans selection:bg-indigo-500/30 text-white relative flex flex-row bg-transparent">
      
      {/* 1. Base Layer: The Moving Particles */}
      <CanvasBackground />
      
      {/* 2. Ambient Glow Layer (Behind the glass panels) */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* 3. Top Layer: Sidebar Navigation */}
      {!isLanding && (
        <aside className="h-full shrink-0 relative z-50 bg-transparent">
          <Navbar setAuth={setIsAuth} isAuth={isAuth} />
        </aside>
      )}
      
      {/* 4. Middle Layer: Main Content Area */}
      <main className="flex-1 h-full relative z-10 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar bg-transparent">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={
            !isAuth ? <AuthView setAuth={setIsAuth} /> : <Navigate to="/dashboard" />
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      
    </div>
  );
}