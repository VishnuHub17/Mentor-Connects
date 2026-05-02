import React, { useEffect } from 'react';

export default function ComposioSuccess() {
  useEffect(() => {
    // Notify the parent window that authentication was successful!
    // 1. Primary method: postMessage (fails if cross-origin opener policy severs the link)
    if (window.opener) {
      window.opener.postMessage('composio_success', window.location.origin);
    }
    
    // 2. Fallback method: LocalStorage broadcasting (immune to opener severance)
    localStorage.setItem('composio_auth_status', 'success_' + Date.now());

    // Clean up the broadcast trigger so it doesn't pollute storage
    setTimeout(() => {
      localStorage.removeItem('composio_auth_status');
    }, 1000);

    // Attempt to close this popup window automatically
    setTimeout(() => {
        window.close();
    }, 1500);
  }, []);

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center font-body text-on-surface">
      <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[2rem]">check_circle</span>
      </div>
      <h2 className="text-2xl font-headline font-extrabold tracking-tight mb-2">Authentication Successful!</h2>
      <p className="text-on-surface-variant font-medium">You can close this tab and return to the application.</p>
    </div>
  );
}
