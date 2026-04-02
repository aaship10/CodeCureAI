// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { apiCall } from '../utils/api';
// import { setToken } from '../utils/auth';

// export default function AuthView({ setAuth }) {
//   const [isLogin, setIsLogin] = useState(true);
//   const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     try {
//       if (isLogin) {
//         // Login requires form-urlencoded format for OAuth2PasswordBearer in FastAPI
//         const response = await fetch('http://localhost:8000/api/login', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//           body: new URLSearchParams({ username: formData.email, password: formData.password })
//         });
//         const data = await response.json();
//         if (!response.ok) throw new Error(data.detail);
        
//         setToken(data.access_token);
//         setAuth(true);
//         navigate('/dashboard');
//       } else {
//         await apiCall('/signup', 'POST', formData);
//         setIsLogin(true); // Switch to login after successful signup
//         setError('Signup successful! Please log in.');
//       }
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="h-full flex items-center justify-center bg-transparent text-white">
//       {/* teammate's glass-panel style */}
//       <div className="bg-white/3 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-96 border border-white/10">
//         <h2 className="text-2xl font-light mb-6 text-center tracking-tight">
//           {isLogin ? 'Welcome ' : 'Create '}
//           <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
//             Account
//           </span>
//         </h2>
        
//         {error && <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-2 rounded mb-4 text-center text-[11px] uppercase tracking-wider">{error}</div>}
        
//         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//           {/* Use transparent inputs with bottom borders to match teammate's style */}
//           {!isLogin && (
//             <input type="text" placeholder="Full Name" required className="bg-transparent border-b border-zinc-800 py-2 outline-none focus:border-indigo-500 transition-colors"
//               onChange={e => setFormData({...formData, full_name: e.target.value})} />
//           )}
//           <input type="email" placeholder="Email" required className="bg-transparent border-b border-zinc-800 py-2 outline-none focus:border-indigo-500 transition-colors"
//             onChange={e => setFormData({...formData, email: e.target.value})} />
//           <input type="password" placeholder="Password" required className="bg-transparent border-b border-zinc-800 py-2 outline-none focus:border-indigo-500 transition-colors"
//             onChange={e => setFormData({...formData, password: e.target.value})} />
          
//           <button type="submit" className="mt-4 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 p-2 rounded-full font-semibold uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20">
//             {isLogin ? 'Login' : 'Sign Up'}
//           </button>
//         </form>
//         {/* ... keep the rest of your toggle logic ... */}
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { setToken } from '../utils/auth';

export default function AuthView({ setAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN: FastAPI OAuth2 standard (Form Data)
        const response = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ 
            username: formData.email, 
            password: formData.password 
          })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Login failed');
        
        setToken(data.access_token);
        setAuth(true);
        navigate('/dashboard');
      } else {
        // SIGNUP: JSON Data
        const signupResponse = await apiCall('/signup', 'POST', formData);
        
        // Auto-login after signup to "Enter Website" immediately
        if (signupResponse.access_token) {
          setToken(signupResponse.access_token);
          setAuth(true);
          navigate('/dashboard');
        } else {
          // Fallback if your backend doesn't return a token on signup
          setIsLogin(true);
          setError('Signup successful! Please log in.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-transparent text-white">
      <div className="bg-white/3 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-96 border border-white/10">
        <h2 className="text-2xl font-light mb-6 text-center tracking-tight">
          {isLogin ? 'Welcome ' : 'Create '}
          <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
            Account
          </span>
        </h2>
        
        {error && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-2 rounded mb-4 text-center text-[11px] uppercase tracking-wider">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input 
              name="full_name"
              type="text" 
              placeholder="Full Name" 
              required 
              className="bg-transparent border-b border-zinc-800 py-2 outline-none focus:border-indigo-500 transition-colors"
              onChange={handleInputChange} 
            />
          )}
          
          <input 
            name="email"
            type="email" 
            placeholder="Email" 
            required 
            className="bg-transparent border-b border-zinc-800 py-2 outline-none focus:border-indigo-500 transition-colors"
            onChange={handleInputChange} 
          />
          
          <input 
            name="password"
            type="password" 
            placeholder="Password" 
            required 
            className="bg-transparent border-b border-zinc-800 py-2 outline-none focus:border-indigo-500 transition-colors"
            onChange={handleInputChange} 
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 p-2 rounded-full font-semibold uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-zinc-500">
            {isLogin ? "Don't have an account?" : "Already a member?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors underline decoration-indigo-500/30 underline-offset-4"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}