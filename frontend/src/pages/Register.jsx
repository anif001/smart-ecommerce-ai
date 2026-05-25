import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User as UserIcon, Mail, Key, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      await register(name, email, password);
      setSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data || 'Registration failed. Email might already be registered.');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12">
      <div className="glass-panel rounded-2xl shadow-xl p-8 border border-slate-200/50 dark:border-slate-800/30">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="bg-primary-600 dark:bg-primary-500 p-3 rounded-2xl text-white mb-3 shadow-lg shadow-primary-500/20">
            <UserPlus size={28} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Join us to get personalized recommendation benefits
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-start space-x-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>Account registered successfully! Redirecting to login page...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-800 dark:text-red-300 text-sm flex items-start space-x-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                <UserIcon size={18} />
              </span>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all font-medium"
              />
            </div>
          </div>

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
                <UserPlus size={18} />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
