import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AddWebinarModal({ isOpen, onClose, onAdded, mentorId }) {
  const [title, setTitle] = useState(() => sessionStorage.getItem('wm_title') || '');
  const [description, setDescription] = useState(() => sessionStorage.getItem('wm_desc') || '');
  const [scheduledStart, setScheduledStart] = useState(() => sessionStorage.getItem('wm_start') || '');
  const [targetAudience, setTargetAudience] = useState(() => sessionStorage.getItem('wm_aud') || '');
  const [meetLink, setMeetLink] = useState(() => sessionStorage.getItem('wm_meet') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem('wm_title', title);
      sessionStorage.setItem('wm_desc', description);
      sessionStorage.setItem('wm_start', scheduledStart);
      sessionStorage.setItem('wm_aud', targetAudience);
      sessionStorage.setItem('wm_meet', meetLink);
    }
  }, [isOpen, title, description, scheduledStart, targetAudience, meetLink]);

  const clearDraft = () => {
    setTitle('');
    setDescription('');
    setScheduledStart('');
    setTargetAudience('');
    setMeetLink('');
    sessionStorage.removeItem('wm_title');
    sessionStorage.removeItem('wm_desc');
    sessionStorage.removeItem('wm_start');
    sessionStorage.removeItem('wm_aud');
    sessionStorage.removeItem('wm_meet');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Default to 1 hour duration
    const startDate = new Date(scheduledStart);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const { data, error } = await supabase.from('webinars').insert([
      {
        title,
        description,
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        target_audience: targetAudience,
        meet_link: meetLink,
        mentor_id: mentorId,
        status: 'published'
      }
    ]).select();

    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      clearDraft();
      if (onAdded && data?.length > 0) onAdded(data[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden font-body flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container-lowest sticky top-0 z-10">
          <h2 className="text-2xl font-bold font-headline text-on-surface">Schedule New Webinar</h2>
          <button onClick={() => { clearDraft(); onClose(); }} className="rounded-full p-2 hover:bg-surface-container transition-colors text-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 overflow-y-auto w-full">
          {error && (
            <div className="bg-error-container/20 text-error p-4 rounded-lg mb-6 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
          )}

          <form id="webinar-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface">Webinar Title</label>
              <input 
                required 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-body text-base" 
                placeholder="e.g. Advanced Spatial Semantics"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface">Description <span className="text-outline-variant font-normal text-xs">(Markdown supported)</span></label>
              <textarea 
                required 
                rows="4" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-body text-base resize-none" 
                placeholder="Detail what attendees will learn..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface">Date & Time</label>
                <div relative="true" className="flex items-center">
                  <span className="material-symbols-outlined absolute ml-4 text-outline-variant pointer-events-none">event</span>
                  <input 
                    required 
                    type="datetime-local" 
                    value={scheduledStart} 
                    onChange={e => setScheduledStart(e.target.value)} 
                    className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-body text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface">Target Audience</label>
                <div relative="true" className="flex items-center">
                  <span className="material-symbols-outlined absolute ml-4 text-outline-variant pointer-events-none">groups</span>
                  <input 
                    required 
                    type="text" 
                    value={targetAudience} 
                    onChange={e => setTargetAudience(e.target.value)} 
                    className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-body text-base" 
                    placeholder="e.g. Senior Developers"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface">Google Meet / Zoom Link</label>
              <div relative="true" className="flex items-center">
                <span className="material-symbols-outlined absolute ml-4 text-outline-variant pointer-events-none">link</span>
                <input 
                  required 
                  type="url" 
                  value={meetLink} 
                  onChange={e => setMeetLink(e.target.value)} 
                  className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-body text-base" 
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-outline-variant/20 bg-surface-container/50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0 z-10">
          <button 
            type="button" 
            onClick={() => { clearDraft(); onClose(); }} 
            className="px-6 py-2.5 rounded-lg text-on-surface font-semibold hover:bg-surface-container-highest transition-colors uppercase tracking-wider text-xs"
          >
            Cancel
          </button>
          <button 
            form="webinar-form" 
            type="submit" 
            disabled={loading} 
            className="px-8 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-dim transition-all shadow hover:shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                Publish Webinar
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
