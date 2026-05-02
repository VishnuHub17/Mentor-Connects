import React from 'react';

export default function AdminApiKeys() {
  return (
    <>
      <div className="mb-8">
         <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Platform Integrations</h2>
         <p className="text-sm font-body text-on-surface-variant">Manage secure connections with external LMS platforms like Pathwisse.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm p-8 max-w-3xl">
        <div className="flex justify-between items-start mb-6 border-b pb-6 border-outline-variant/20">
           <div>
             <h3 className="text-xl font-bold font-headline text-on-surface mb-1">Pathwisse Connection</h3>
             <p className="text-sm font-body text-on-surface-variant">Synchronizing Student Webhooks</p>
           </div>
           <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Active</span>
        </div>
        
        <div className="space-y-6">
           <div>
             <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">Register Endpoint (POST)</label>
             <div className="flex gap-2">
               <input readOnly value="https://usespgmwnqqbvttgvyay.supabase.co/functions/v1/external-register" className="w-full bg-surface-container font-mono text-xs p-3 rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none" />
             </div>
           </div>
           <div>
             <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">Feed Endpoint (GET)</label>
             <div className="flex gap-2">
               <input readOnly value="https://usespgmwnqqbvttgvyay.supabase.co/functions/v1/external-webinars" className="w-full bg-surface-container font-mono text-xs p-3 rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none" />
             </div>
           </div>
           <div>
             <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">Integration Secret (Service Role JWT)</label>
             <div className="flex gap-2">
               <input type="password" readOnly value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full bg-surface-container font-mono text-xs p-3 rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none" />
               <button onClick={() => alert("Secret Key copied to clipboard!")} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold flex gap-2 items-center hover:bg-primary-dim transition-colors">
                 <span className="material-symbols-outlined text-[16px]">content_copy</span> Copy
               </button>
             </div>
             <p className="text-xs text-error mt-2 font-medium">Never expose this key publicly. It carries full server-to-server rewrite access.</p>
           </div>
        </div>
      </div>
    </>
  );
}
