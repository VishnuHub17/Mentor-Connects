import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import { Briefcase, ArrowRight } from 'lucide-react';
import {
  ComposioImportStatus,
  OnboardingStep,
  setComposioImportStatus,
  setOnboardingStep
} from '../lib/onboarding';

export default function CompleteProfile({ session, profile }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const verificationPollRef = useRef(null);
  const pollStartedAtRef = useRef(null);

  const clearVerificationPoll = () => {
    if (verificationPollRef.current) {
      clearInterval(verificationPollRef.current);
      verificationPollRef.current = null;
    }
  };

  const readErrorPayload = async (response) => {
    const fallback = `Request failed with status ${response.status}`;

    try {
      const text = await response.text();
      if (!text) return fallback;

      try {
        const parsed = JSON.parse(text);
        return parsed.error || parsed.message || fallback;
      } catch {
        return text.substring(0, 300);
      }
    } catch {
      return fallback;
    }
  };

  const handleConnectLinkedIn = async () => {
    // 1. Immediately open a blank popup securely. This prevents modern browsers from blocking the popup 
    // since it happens exactly synchronously with the user click action!
    const width = 600;
    const height = 750;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open('', 'composio_auth', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`);
    
    setLoading(true);
    setError(null);
    clearVerificationPoll();
    pollStartedAtRef.current = Date.now();
    setOnboardingStep(OnboardingStep.LINKEDIN);
    setComposioImportStatus(ComposioImportStatus.STARTED);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) throw new Error("No active session");

      const callbackUri = window.location.origin + '/setup/composio-success';
      const response = await fetch(`${supabaseUrl}/functions/v1/composio-linkedin-v3?action=get-link&redirectUri=${encodeURIComponent(callbackUri)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gateway error text:", errorText);
        try {
           const errData = JSON.parse(errorText);
           throw new Error(errData.error || errData.message || errorText.substring(0, 1000));
        } catch {
           throw new Error(errorText.substring(0, 1000));
        }
      }

      const { redirectUrl } = JSON.parse(await response.text());
      if (redirectUrl) {
         if (popup) {
            popup.location.href = redirectUrl;
         } else {
            window.location.href = redirectUrl;
         }
      } else {
         if (popup) popup.close();
         throw new Error('No redirect URL returned by edge function.');
      }
      
      // 4. Robust Fallback: Short-polling to verify if Composio linked successfully without relying on UI popups
      verificationPollRef.current = setInterval(async () => {
         try {
            // Securely check if the user physically completed the integration on Composio's side
            const verifyRes = await fetch(`${supabaseUrl}/functions/v1/composio-linkedin-v3?action=verify-connection`, {
               headers: { Authorization: `Bearer ${currentSession.access_token}` }
            });
            
            if (verifyRes.ok) {
               // Success! Composio connected the account!
               clearVerificationPoll();
               if (popup) popup.close();
               setLoading(false);
               setComposioImportStatus(ComposioImportStatus.SUCCEEDED);
               setOnboardingStep(OnboardingStep.PREVIEW);
               navigate('/setup/preview');
             } else {
               const errorMessage = await readErrorPayload(verifyRes);
               console.log("[Verification Poll] Waiting or Failed:", { status: verifyRes.status, error: errorMessage });

               if (verifyRes.status === 404) {
                  clearVerificationPoll();
                  setLoading(false);
                  setComposioImportStatus(ComposioImportStatus.FAILED);
                  setError('LinkedIn verification is unavailable right now because the Supabase edge function route `composio-linkedin-v3?action=verify-connection` returned 404. Deploy or update that edge function, or continue with manual profile entry.');
                  return;
               }
            }

            if (pollStartedAtRef.current && Date.now() - pollStartedAtRef.current > 120000) {
               clearVerificationPoll();
               setLoading(false);
               setComposioImportStatus(ComposioImportStatus.FAILED);
               setError('LinkedIn verification is taking longer than expected. Please try again, or continue with manual profile entry.');
               return;
            }
            
            // If user manually closes popup and we still haven't succeeded, kill the poll
            if (popup && popup.closed) {
               clearVerificationPoll();
               setLoading(false); // Only kill loading if it truly failed
            }
         } catch(e) { }
      }, 3000); // Check every 3 seconds
      
    } catch (err) {
      if (popup) popup.close();
      console.error(err);
      setComposioImportStatus(ComposioImportStatus.FAILED);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Primary Monitor: Listen for the completed message broadcasted exclusively by our ComposioSuccess popup route
    const handleMessage = (event) => {
      // Security: verify origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data === 'composio_success') {
         clearVerificationPoll();
         setComposioImportStatus(ComposioImportStatus.SUCCEEDED);
         setOnboardingStep(OnboardingStep.PREVIEW);
         setLoading(false);
         navigate('/setup/preview');
      }
    };

    // 2. Fallback Monitor: Listen for local storage broadcasts just in case the OAuth redirect stripped the popup's window.opener context!
    const handleStorage = (event) => {
      if (event.key === 'composio_auth_status' && event.newValue && event.newValue.startsWith('success_')) {
         clearVerificationPoll();
         setComposioImportStatus(ComposioImportStatus.SUCCEEDED);
         setOnboardingStep(OnboardingStep.PREVIEW);
         setLoading(false);
         navigate('/setup/preview');
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
        clearVerificationPoll();
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('storage', handleStorage);
    };
  }, [navigate]);

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center py-20 px-6 font-body">
      <main className="w-full max-w-xl bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-[0_40px_100px_rgba(49,51,44,0.04)] relative text-center">
        <header className="mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-3">
            Complete Your Profile
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Almost there! To save you time, we can instantly import your professional work history, headline, and skills directly from LinkedIn.
          </p>
        </header>

        {error && (
            <div className="bg-error-container/20 text-error p-4 rounded-md text-sm mb-6 text-left">
              {error}
            </div>
        )}

        <div className="space-y-6">
          <button 
            type="button"
            onClick={handleConnectLinkedIn}
            disabled={loading}
            className="w-full h-16 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-lg font-bold shadow-lg shadow-[#0a66c2]/20 hover:translate-y-[-2px] active:translate-y-0 transition-all focus:outline-none flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <span>Connecting to LinkedIn...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                <span>Import Profile via Composio</span>
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setOnboardingStep(OnboardingStep.MANUAL);
              navigate('/setup/preview?manual=true');
            }}
            className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            I'll enter my details manually <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
