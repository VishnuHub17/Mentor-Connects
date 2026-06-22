import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OnboardingStep, setOnboardingStep } from '../lib/onboarding';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOAuth = async (provider) => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/setup/resume'
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("OAuth Exception:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setOnboardingStep(OnboardingStep.RESUME);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // App.jsx routing logic automatically handles redirect based on profile
    } catch (err) {
      console.error("Auth Exception:", err);
      setError(err.message);
      alert(`Authentication Error: ${err.message}\n\nTip: If you are signing up a new fake user, Supabase defaults to requiring Email Confirmation. You may need to disable 'Confirm email' in the Supabase Auth Provider settings to bypass this locally!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col lg:flex-row min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* LEFT SIDE: Platform Information */}
      <section className="lg:w-1/2 bg-surface-container-low flex flex-col justify-center px-8 py-16 lg:px-24">
        <div className="max-w-xl">
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md transform rotate-3">
              <span className="material-symbols-outlined text-surface-container-lowest text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tighter text-on-surface">Atheneum Ivory</span>
          </div>
          
          <h2 className="font-headline font-bold text-4xl lg:text-5xl text-on-surface tracking-tight mb-8">
            Elevating Minds Through Mentorship
          </h2>
          <p className="text-on-surface-variant text-lg mb-12 max-w-md leading-relaxed">
            Join a sanctuary of scholarly excellence where knowledge flows seamlessly between generations of experts and aspirants.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-lg text-on-surface">Expert-led sessions</h3>
                <p className="text-on-surface-variant/80 text-sm">Direct access to industry luminaries and seasoned academics.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">public</span>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-lg text-on-surface">Global knowledge exchange</h3>
                <p className="text-on-surface-variant/80 text-sm">Connect with a diverse network spanning continents and disciplines.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-lg text-on-surface">Professional growth</h3>
                <p className="text-on-surface-variant/80 text-sm">Structured pathways designed to accelerate your career trajectory.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex items-center gap-6 opacity-20">
            <span className="material-symbols-outlined text-4xl">school</span>
            <span className="material-symbols-outlined text-4xl">diversity_3</span>
            <span className="material-symbols-outlined text-4xl">history_edu</span>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE: Sign-in Form */}
      <section className="lg:w-1/2 flex flex-col items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-[440px] bg-surface-container-lowest p-8 md:p-10 rounded-xl shadow-[0_10px_40px_rgba(49,51,44,0.06)] border border-outline-variant/10">
          <div className="text-center mb-10">
            <h1 className="font-headline font-bold text-3xl text-on-surface tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-on-surface-variant/80 font-body text-sm">
              Sign in to your account
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="bg-error-container/20 text-error p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}
            
            {/* Social Logins */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-semibold py-3.5 rounded-lg shadow-sm border border-outline-variant/20 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
              
              <button
                type="button"
                onClick={() => handleOAuth('linkedin_oidc')}
                disabled={loading}
                className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold py-3.5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                Continue with LinkedIn
              </button>
            </div>

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-outline-variant/20"></div>
              <span className="flex-shrink-0 mx-4 text-outline-variant text-xs uppercase tracking-widest font-semibold">Or with Email</span>
              <div className="flex-grow border-t border-outline-variant/20"></div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">Email address</label>
              <div className="relative">
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3.5 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 transition-all duration-200" 
                  id="email" 
                  name="email" 
                  placeholder="name@atheneum.edu" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="password">Password</label>
                <button type="button" className="text-xs font-medium text-primary hover:text-primary-dim transition-colors">Forgot password?</button>
              </div>
              <div className="relative">
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3.5 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-12" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors flex items-center justify-center p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[1.2rem]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <button 
              className="w-full bg-primary hover:bg-primary-dim text-on-primary font-semibold py-4 rounded-lg shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-50" 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              <span>{loading ? "Processing..." : "Sign In"}</span>
              <span className="material-symbols-outlined text-[1.2rem]">arrow_forward</span>
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
            <p className="text-sm text-on-surface-variant">
              Don't have an account?
              <Link className="font-semibold text-primary hover:text-primary-dim ml-1" to="/signup">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
