import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, PencilLine, LogOut, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  ComposioImportStatus,
  OnboardingStep,
  clearComposioImportStatus,
  clearOnboardingStep,
  getComposioImportStatus,
  setOnboardingStep
} from '../lib/onboarding';

export default function OnboardingResume({ profile }) {
  const navigate = useNavigate();
  const importStatus = getComposioImportStatus();
  const linkedInRecommended = importStatus !== ComposioImportStatus.FAILED;

  const handleContinueLinkedIn = () => {
    setOnboardingStep(OnboardingStep.LINKEDIN);
    navigate('/setup/onboard');
  };

  const handleManual = () => {
    setOnboardingStep(OnboardingStep.MANUAL);
    navigate('/setup/preview?manual=true');
  };

  const handleStartOver = async () => {
    clearOnboardingStep();
    clearComposioImportStatus();
    await supabase.auth.signOut();
    navigate('/signup', { replace: true });
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-6 py-16 font-body">
      <main className="w-full max-w-3xl bg-surface-container-lowest rounded-3xl shadow-[0_40px_100px_rgba(49,51,44,0.05)] p-8 md:p-12 border border-outline-variant/10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Briefcase className="w-4 h-4" />
            Resume Setup
          </div>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-4">
            Pick up where you left off
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
            {profile?.full_name ? `${profile.full_name}, your account is active, but setup is not finished yet.` : 'Your account is active, but setup is not finished yet.'} Choose how you want to complete your profile.
          </p>
        </div>

        {importStatus === ComposioImportStatus.FAILED && (
          <section className="mb-8 bg-error-container/20 border border-error/20 rounded-2xl p-5">
            <h2 className="font-headline font-bold text-lg text-on-surface mb-2">LinkedIn import needs backend work</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Your last Composio attempt failed, so manual entry is the safest option right now. You can still retry LinkedIn import after the Supabase edge function is updated to the current Composio v3 APIs.
            </p>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={handleManual}
            className="text-left bg-surface-container p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container-high transition-colors"
          >
            <PencilLine className="w-7 h-7 text-primary mb-4" />
            <h3 className="font-headline font-bold text-lg text-on-surface mb-2">Enter Manually</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Fill in your headline, work history, and skills directly.
            </p>
          </button>

          <button
            type="button"
            onClick={handleContinueLinkedIn}
            className={`text-left p-6 rounded-2xl border transition-colors ${
              linkedInRecommended
                ? 'bg-[#0a66c2] text-white border-[#0a66c2] hover:bg-[#004182]'
                : 'bg-surface-container border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container-high'
            }`}
          >
            <RefreshCw className={`w-7 h-7 mb-4 ${linkedInRecommended ? 'text-white' : 'text-primary'}`} />
            <h3 className={`font-headline font-bold text-lg mb-2 ${linkedInRecommended ? 'text-white' : 'text-on-surface'}`}>Retry LinkedIn Import</h3>
            <p className={`text-sm leading-relaxed ${linkedInRecommended ? 'text-white/80' : 'text-on-surface-variant'}`}>
              Re-open the Composio flow and try importing profile details from LinkedIn.
            </p>
          </button>

          <button
            type="button"
            onClick={handleStartOver}
            className="text-left bg-surface-container p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container-high transition-colors"
          >
            <LogOut className="w-7 h-7 text-primary mb-4" />
            <h3 className="font-headline font-bold text-lg text-on-surface mb-2">Start Over</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Sign out and return to signup if you want a fresh start.
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}

