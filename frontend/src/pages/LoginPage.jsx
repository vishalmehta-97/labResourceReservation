import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/catalog';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SmartLab</h1>
          <p className="text-gray-500 mt-1">Resource Reservation System</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Create account
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">Demo Credentials (from seed.sql):</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-700"><span className="font-semibold text-purple-700">Admin:</span> admin@labreserve.edu / <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono">Admin@1234</code></p>
              <p className="text-xs text-gray-700"><span className="font-semibold text-green-700">Student:</span> alice@student.edu / <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono">User@1234</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
