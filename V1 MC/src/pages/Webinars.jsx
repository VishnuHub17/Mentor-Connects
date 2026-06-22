import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { supabase } from '../lib/supabase';
import AddWebinarModal from '../components/AddWebinarModal';
import { Link, useNavigate } from 'react-router-dom';

function getStatusLabel(status) {
  if (!status || status === 'published' || status === 'upcoming') return 'Upcoming';
  if (status === 'held' || status === 'completed') return 'Held';
  if (status === 'not_held') return 'Not Held';
  return status;
}

export default function Webinars({ session }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(() => {
    return sessionStorage.getItem('webinarModalOpen') === 'true';
  });

  useEffect(() => {
    if (isModalOpen) {
      sessionStorage.setItem('webinarModalOpen', 'true');
    } else {
      sessionStorage.removeItem('webinarModalOpen');
    }
  }, [isModalOpen]);

  useEffect(() => {
    async function fetchWebinars() {
      if (!session) return;
      const { data } = await supabase
        .from('webinars')
        .select('*')
        .eq('mentor_id', session.user.id)
        .order('scheduled_start', { ascending: true });
      
      if (data) setWebinars(data);
      setLoading(false);
    }
    fetchWebinars();
  }, [session]);

  const handleWebinarAdded = (newWebinar) => {
    // sort correctly
    const updated = [...webinars, newWebinar].sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
    setWebinars(updated);
  };

  const events = webinars.map(w => ({
    id: w.id,
    title: w.title,
    start: w.scheduled_start,
    end: w.scheduled_end || new Date(new Date(w.scheduled_start).getTime() + 60 * 60 * 1000).toISOString(),
    backgroundColor: '#c9e7f7', // secondary-container
    borderColor: '#466370', // secondary
    textColor: '#000000', // black text for high visibility
    display: 'block', // forces full block render
    extendedProps: { url: `/webinars/${w.id}` }
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 w-full">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute w-full h-full border-4 border-dashed border-primary-container rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute w-10 h-10 border-4 border-solid border-transparent border-t-primary border-b-primary rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-4 text-sm text-on-surface-variant font-medium animate-pulse">Loading webinars...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">Webinar Management</h2>
          <p className="text-on-surface-variant font-body">Schedule and manage your interactive knowledge sessions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-surface-container-highest p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
              List
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Calendar
            </button>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary-dim transition-all shadow-md active:scale-95 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Webinar
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="space-y-4">
          {webinars.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">video_library</span>
              <h3 className="text-xl font-bold font-headline mb-2 text-on-surface">No Webinars Found</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto mb-6">You haven't scheduled any webinars yet. Click 'New Webinar' to create your first session.</p>
            </div>
          ) : (
            webinars.map(webinar => (
              <div key={webinar.id} className="group bg-surface-container-lowest hover:bg-surface-bright transition-all duration-300 p-6 rounded-xl border border-outline-variant/10 hover:border-primary/20 hover:shadow-[0_10px_40px_rgba(49,51,44,0.06)] flex flex-col lg:flex-row gap-6 items-center">
                <div className="w-full lg:w-48 h-24 rounded-lg bg-secondary-container flex flex-col items-center justify-center overflow-hidden flex-shrink-0 text-on-secondary-container">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">{new Date(webinar.scheduled_start).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-3xl font-black font-headline leading-none my-1">{new Date(webinar.scheduled_start).getDate()}</span>
                  <span className="text-xs font-medium opacity-80">{new Date(webinar.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                </div>
                
                <div className="flex-1 min-w-0 w-full space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-tertiary-container/50 text-tertiary-dim text-[10px] font-bold uppercase tracking-widest rounded-full">
                      <span className="material-symbols-outlined text-[12px]">groups</span>
                      {webinar.target_audience || 'All Audience'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {getStatusLabel(webinar.status)}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-on-surface leading-tight font-headline"><Link to={`/webinars/${webinar.id}`} className="hover:text-primary transition-colors">{webinar.title}</Link></h4>
                  <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed max-w-3xl">{webinar.description}</p>
                </div>
                
                <div className="flex-shrink-0 w-full lg:w-auto flex lg:flex-col gap-3">
                  <Link to={`/webinars/${webinar.id}`} className="flex-1 lg:flex-none text-center bg-surface-container align-middle text-on-surface px-6 py-2.5 rounded-md font-bold text-sm hover:bg-surface-dim transition-all shadow-sm active:scale-[0.98]">
                    Manage
                  </Link>
                  <a href={webinar.meet_link} target="_blank" rel="noopener noreferrer" className="flex-1 lg:flex-none text-center bg-primary text-on-primary px-6 py-2.5 rounded-md font-bold text-sm hover:bg-primary-dim transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">videocam</span> Join
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <FullCalendar
            plugins={[ dayGridPlugin, timeGridPlugin ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            height="auto"
            contentHeight={700}
            eventClick={(info) => {
              info.jsEvent.preventDefault(); 
              if (info.event.extendedProps.url) {
                navigate(info.event.extendedProps.url);
              }
            }}
            eventClassNames="cursor-pointer tracking-tight font-bold rounded shadow-sm text-xs p-1"
          />
        </div>
      )}

      <AddWebinarModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdded={handleWebinarAdded} 
        mentorId={session?.user?.id}
      />
    </>
  );
}
