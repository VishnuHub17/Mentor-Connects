import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OnboardingStep, clearComposioImportStatus, setOnboardingStep } from '../lib/onboarding';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      setLoading(false);
      return;
    }

    try {
      clearComposioImportStatus();
      setOnboardingStep(OnboardingStep.RESUME);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });
      if (authError) throw authError;

      // The database automatically generates the profile via `on_auth_user_created` trigger.
      // We do not manually insert into `profiles` here to avoid Unique Constraint variations.

      // App.jsx handles automatic redirection if auto-signin succeeds.
      if (!authData.session) {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Signup Auth Exception:", err);
      setError(err.message);
      alert(`Signup Error: ${err.message}\n\nTip: You might need to use a properly formatted email. If you disabled Confirm Email in Supabase, you should log in immediately. Otherwise, you must check your inbox.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background font-body text-on-surface selection:bg-primary/20">
      {/* Left Side: High-impact brand section */}
      <section className="relative w-full md:w-1/2 min-h-[409px] md:min-h-screen overflow-hidden flex flex-col justify-between p-8 md:p-16 lg:p-24 bg-surface-container-low">
        <div className="absolute inset-0 z-0 opacity-10">
          <img className="w-full h-full object-cover" alt="Interior of a modern, minimalist library with floor-to-ceiling windows, warm sunlight, and sleek white furniture in soft ivory tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXM-5SqnzohX6dpXKrWekANO_3Xy3wXz4ur7ZrSW4aNiuRx9uc9WXac3b-xgKXgV4cyhm2x7tUWRNLNHUqTg-saoxGoi6dGaJ61rZ5x9srtHadBcqA6oM9toe8CtM49oqoMOrTevkbPd02f9mHsC8pb4X9tt9tsd4zCjGYNiT-kGFe5ihMx8cMRgA0v7393eMQ7Po9CehKB9U2-7xE80LyZXANGPf5BqSeAi9Iiwe5E_lf8ZDfTgTr29r4VD7bu1lU6kCbnOw1Iwld"/>
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-12">
            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-primary text-2xl text-[1.5rem]">architecture</span>
            </div>
            <span className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">Atheneum Ivory</span>
          </div>
          <div className="max-w-md">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface mb-8 leading-tight">
              Empowering the Next Generation of Leaders
            </h1>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">workspace_premium</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-surface">Expert-led sessions</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Direct access to industry veterans</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">public</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-surface">Global knowledge exchange</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Connect with a diverse network</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-surface">Professional growth</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Structured pathways for career success</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 pt-12 border-t border-outline-variant/15">
          <p className="text-xs font-medium tracking-widest uppercase text-on-surface-variant">The Ivory Archive © 2024</p>
        </div>
      </section>

      {/* Right Side: Create your account form */}
      <section className="w-full md:w-1/2 bg-surface min-h-screen flex items-center justify-center p-6 md:p-12 lg:p-24">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-[0_10px_40px_rgba(49,31,44,0.06)] border border-outline-variant/5">
            <header className="mb-10">
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-2">Create your account</h2>
              <p className="text-on-surface-variant font-body">Join the sanctuary of scholarly excellence</p>
            </header>
            
            {success ? (
              <div className="bg-primary/10 text-primary p-6 rounded-xl text-center shadow-inner border border-primary/20 animate-in fade-in zoom-in duration-500">
                <span className="material-symbols-outlined text-[3rem] mb-4 text-primary block">mark_email_read</span>
                <h3 className="font-headline font-bold text-2xl mb-2 text-on-surface">Check your email</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  We've sent a verification link to <strong className="text-on-surface">{email}</strong>. Please click the link to activate your mentor account!
                </p>
                <div className="mt-8 pt-6 border-t border-primary/10">
                  <Link to="/login" className="font-semibold text-primary hover:text-primary-dim hover:underline flex justify-center items-center gap-1">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Return to sign in
                  </Link>
                </div>
              </div>
            ) : (
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
                  className="w-full bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-semibold py-3.5 rounded-xl shadow-sm border border-outline-variant/20 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>
                
                <button
                  type="button"
                  onClick={() => handleOAuth('linkedin_oidc')}
                  disabled={loading}
                  className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold py-3.5 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
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

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="name">Full Name</label>
                <input 
                  className="w-full px-4 py-3.5 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 transition-all" 
                  id="name" 
                  name="name" 
                  placeholder="Enter your full name" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                <input 
                  className="w-full px-4 py-3.5 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 transition-all" 
                  id="email" 
                  name="email" 
                  placeholder="name@atheneum.edu" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="password">Password</label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3.5 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 transition-all pr-12" 
                    id="password" 
                    name="password" 
                    placeholder="Choose a strong password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3.5 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 transition-all pr-12" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="Repeat your password" 
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2">
                <input className="w-5 h-5 rounded-md border-outline-variant bg-surface-container-highest text-primary focus:ring-primary/20" id="terms" type="checkbox" required />
                <label className="text-xs text-on-surface-variant leading-relaxed" htmlFor="terms">
                  I agree to the <a className="text-primary font-semibold hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-semibold hover:underline" href="#">Privacy Policy</a>.
                </label>
              </div>
              <button 
                className="w-full bg-primary hover:bg-primary-dim text-on-primary py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 transition-all transform active:scale-[0.98] disabled:opacity-50" 
                type="button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Processing..." : "Sign Up"}
                <span className="material-symbols-outlined text-[1.2rem]">arrow_forward</span>
              </button>
            </form>
            )}
            {!success && (
            <footer className="mt-10 pt-8 border-t border-outline-variant/15 text-center">
              <p className="text-on-surface-variant text-sm">
                Already have an account? 
                <Link className="text-primary font-bold ml-1 hover:underline" to="/login">Sign in</Link>
              </p>
            </footer>
            )}
          </div>
          <div className="mt-8 flex justify-center space-x-6 text-on-surface-variant/40">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">policy</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">help</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">language</span>
          </div>
        </div>
      </section>
    </main>
  );
}
