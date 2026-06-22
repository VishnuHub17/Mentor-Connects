import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OnboardingStep, setOnboardingStep } from '../lib/onboarding';

export default function SSO() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function processSilentAuth() {
      // Support tokens in the URL Hash (standard OAuth approach) OR query string
      const searchParams = new URLSearchParams(
        location.hash ? location.hash.substring(1) : location.search.substring(1)
      );

      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');

      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (!error && data.session) {
          // Successfully logged in silently cross-platform
          // You could optionally parse a 'next' param to deep link them
          setOnboardingStep(OnboardingStep.RESUME);
          navigate('/setup/resume', { replace: true });
          return;
        } else {
          console.error("SSO Error:", error);
        }
      }

      // If no token or token invalid, flush back to hard login
      navigate('/login', { replace: true });
    }

    processSilentAuth();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest font-body">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">sync</span>
        <div>
          <p className="text-on-surface font-headline font-bold text-lg">Authenticating Session</p>
          <p className="text-sm text-on-surface-variant">Securely connecting to Pathwisse Network...</p>
        </div>
      </div>
    </div>
  );
}
