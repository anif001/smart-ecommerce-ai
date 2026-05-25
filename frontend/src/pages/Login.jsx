import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Mail, AlertCircle, ShoppingBag } from 'lucide-react';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const sessionExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12">
      <div className="glass-panel rounded-2xl shadow-xl p-8 border border-slate-200/50 dark:border-slate-800/30">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="bg-primary-600 dark:bg-primary-500 p-3 rounded-2xl text-white mb-3 shadow-lg shadow-primary-500/20">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Sign in to access your personalized recommendations
          </p>
        </div>

        {sessionExpired && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-amber-800 dark:text-amber-300 text-sm flex items-start space-x-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-800 dark:text-red-300 text-sm flex items-start space-x-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                <Key size={18} />
              </span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
