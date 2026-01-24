import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { Cpu, Mail, Lock, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/apiService';
import axios from 'axios';
import { apis, AppRoute } from '../types';
import { setUserData, userData as userDataAtom } from '../userStore/userData';
import { logo } from '../constants';
import { useSetRecoilState } from 'recoil';
import toast from 'react-hot-toast';


const Login = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const setUserRecoil = useSetRecoilState(userDataAtom);

  const payload = { email, password }
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("")
    setLoading(true)
    axios.post(apis.logIn, payload).then((res) => {
      setError(false)
      setMessage(res.data.message)
      toast.success('Successfully Logged in AISA');
      const from = location.state?.from || AppRoute.DASHBOARD;
      navigate(from, { replace: true });
      setUserData(res.data)
      setUserRecoil({ user: res.data })
      localStorage.setItem("userId", res.data.id)
      localStorage.setItem("token", res.data.token)

    }).catch((err) => {
      console.error("Login error:", err);
      setError(true);
      const errorMessage = err.response?.data?.error || err.message || "Unable to connect to the server. Please check your internet connection and try again.";
      setMessage(errorMessage);
    }).finally(() => {
      setLoading(false)

    })

  };


  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-surface">
      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className=" text-center">
          <div className="inline-block rounded-full w-25">
            <img src="/logo/Logo.svg" alt="AISA Logo" className="w-36 h-36 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-maintext mb-2 -mt-8">Welcome Back</h2>
          <p className="text-subtext">Sign in to continue to AISA<sup>TM</sup></p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border p-8 rounded-3xl shadow-xl">

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-maintext ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-subtext" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-maintext placeholder-subtext focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-maintext ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-subtext" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-12 text-maintext placeholder-subtext focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-subtext hover:text-maintext transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary rounded-xl font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Signup Redirect */}
          <div className="mt-8 text-center text-sm text-subtext space-y-3">
            <div>
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create Account
              </Link>
            </div>

            {/* Vendor Registration Link */}

          </div>
        </div>

        {/* Back to Home */}
        <Link
          to="/"
          className="mt-8 flex items-center justify-center gap-2 text-subtext hover:text-maintext transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

      </div>
    </div>
  );
};

export default Login;