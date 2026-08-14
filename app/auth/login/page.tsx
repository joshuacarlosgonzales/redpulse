// app/auth/login/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Heart, 
  Mail, 
  Lock, 
  LogIn, 
  ArrowLeft, 
  Loader2, 
  Eye, 
  EyeOff,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔍 Already logged in as:', user.email, 'Role:', user.role);
        
        // FIX: Use the correct redirect path for donors
        let redirectPath = '/';
        if (user.role === 'admin') redirectPath = '/admin/dashboard';
        else if (user.role === 'hospital') redirectPath = '/hospital/dashboard';
        else if (user.role === 'donor') redirectPath = '/donors/dashboard'; // ← FIX
        else redirectPath = '/dashboard';
        
        router.push(redirectPath);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Attempting login for:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('📦 Login response:', data);

      if (data.success) {
        console.log("✅ Login successful");
        
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Also set cookie for middleware
        document.cookie = `token=${data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
        
        const user = data.data.user;
        console.log('👤 User role:', user.role);
        
        // FIX: Use the correct redirect path for donors
        let redirectPath = '/';
        if (user.role === 'admin') redirectPath = '/admin/dashboard';
        else if (user.role === 'hospital') redirectPath = '/hospital/dashboard';
        else if (user.role === 'donor') redirectPath = '/donors/dashboard'; // ← FIX
        else redirectPath = '/dashboard';
        
        console.log('🚀 Redirecting to:', redirectPath);
        
        // Use window.location for hard redirect
        window.location.href = redirectPath;
      } else {
        setError(data.error || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-black/50">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </Link>
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30">
                  <Heart className="h-8 w-8 text-white" fill="currentColor" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Sign In</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Welcome back to RedPulse
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-12 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Login Failed</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition shadow-lg shadow-red-200 dark:shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-red-600 hover:text-red-700 font-semibold transition-colors">
                Get Started
              </Link>
            </div>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500">
                  Secure Access Only
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}