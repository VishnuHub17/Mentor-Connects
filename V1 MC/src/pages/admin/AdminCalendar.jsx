import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  // Color generator using a simple hash of the Mentor UUID so each mentor always gets the same color block
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  
  const getMentorColor = (mentorId) => {
    const colors = [
      '#525f74', // Primary
      '#466370', // Secondary
      '#5b5d78', // Tertiary
      '#9f403d', // Error
      '#3a5764', // Secondary Dim
      '#4c4e68'  // On-tertiary-container
    ];
    return colors[Math.abs(hashString(mentorId)) % colors.length];
  };

  useEffect(() => {
    async function fetchAllCalendarEvents() {
      // Admin bypass pulls all webinars
      const { data } = await supabase
        .from('webinars')
        .select(`
          *,
          mentor:mentor_id ( full_name )
        `);
      
      if (data) {
          const formattedEvents = data.map(web => ({
          id: web.id,
          title: `[${web.mentor?.full_name || 'Unknown'}] ${web.title}`,
          start: web.scheduled_start,
          end: new Date(new Date(web.scheduled_start).getTime() + 60 * 60 * 1000).toISOString(), // Roughly 1 hour default rendering block
          backgroundColor: getMentorColor(web.mentor_id),
          borderColor: 'transparent',
          textColor: '#ffffff',
          display: 'block',
          extendedProps: {
            mentor_id: web.mentor_id
          }
        }));
        setEvents(formattedEvents);
      }
    }
    fetchAllCalendarEvents();
  }, []);

  const handleEventClick = (clickInfo) => {
    navigate(`/webinars/${clickInfo.event.id}`);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Global Calendar</h2>
        <p className="text-sm font-body text-on-surface-variant">View the aggregated schedule of all mentor webinars across the platform.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm p-6 relative z-0">
         <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={handleEventClick}
            height={'75vh'}
            eventClassNames="cursor-pointer tracking-tight font-bold rounded shadow-sm text-xs p-1"
            dayHeaderClassNames="bg-surface-container-low text-on-surface-variant font-bold border-b-2 uppercase py-2 text-[10px] tracking-widest"
          />
      </div>
    </>
  );
}
