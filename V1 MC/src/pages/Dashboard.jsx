import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Dashboard({ profile, session }) {
  const [stats, setStats] = useState({ webinars: 0, students: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session) return;
      
      const mentorId = session.user.id;
      
      // 1. Total Webinars Count
      const { count: webinarCount } = await supabase
        .from('webinars')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', mentorId);
        
      // 2. Audience Enrollments (Total Students)
      // Because of RLS, mentor only sees registrations for their own webinars
      const { count: studentCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });
        
      setStats({ webinars: webinarCount || 0, students: studentCount || 0 });

      // 3. Upcoming Webinars list
      const { data: upcomingWebinars } = await supabase
        .from('webinars')
        .select('*')
        .eq('mentor_id', mentorId)
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(3);

      if (upcomingWebinars) setUpcoming(upcomingWebinars);

      setLoading(false);
    }
    
    fetchDashboardData();
  }, [session]);

  const fallbackName = session?.user?.email?.split('@')[0] || "Mentor";
  const capitalizedName = profile?.full_name || (fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 w-full">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute w-full h-full border-4 border-dashed border-primary-container rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute w-10 h-10 border-4 border-solid border-transparent border-t-primary border-b-primary rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-4 text-sm text-on-surface-variant font-medium animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Header */}
      <div className="mb-16">
        <h2 className="font-headline text-[3.5rem] font-extrabold text-on-surface leading-[1.1] tracking-tight max-w-2xl">
          Good morning, {capitalizedName}. <span className="text-primary-dim/60">Your gallery awaits.</span>
        </h2>
        <p className="mt-6 text-on-surface-variant font-body text-lg max-w-xl">
          Review your intellectual impact and prepare for today's curated academic exchanges.
        </p>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 gap-8 mb-20 md:grid-cols-2">
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_10px_40px_rgba(49,51,44,0.04)] border border-outline-variant/5 hover:border-primary/20 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-secondary-container/30 rounded-full">
              <span className="material-symbols-outlined text-secondary">video_library</span>
            </div>
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">+12%</span>
          </div>
          <p className="text-4xl font-headline font-black text-on-surface mb-1">{stats.webinars.toString().padStart(2, '0')}</p>
          <p className="text-sm font-medium text-on-surface-variant font-label">Total Webinars</p>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_10px_40px_rgba(49,51,44,0.04)] border border-outline-variant/5 hover:border-primary/20 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-tertiary-container/30 rounded-full">
              <span className="material-symbols-outlined text-tertiary">calendar_month</span>
            </div>
            <span className="text-xs font-bold text-tertiary uppercase tracking-widest">Active</span>
          </div>
          <p className="text-4xl font-headline font-black text-on-surface mb-1">{stats.students.toString().padStart(2, '0')}</p>
          <p className="text-sm font-medium text-on-surface-variant font-label">Total Enrollments</p>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-2xl font-bold">Upcoming Webinars</h3>
            <Link to="/webinars" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
              View Schedule
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          
          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">calendar_today</span>
                <p className="text-on-surface-variant">No upcoming webinars scheduled yet.</p>
              </div>
            ) : (
              upcoming.map(webinar => (
                <div key={webinar.id} className="group bg-surface-container-low hover:bg-surface-bright transition-all duration-300 p-6 rounded-xl border border-transparent hover:shadow-[0_10px_40px_rgba(49,51,44,0.06)] flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-32 h-20 rounded-lg bg-tertiary-container flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-3xl">play_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">
                      {webinar.target_audience || 'All Audience'}
                    </span>
                    <h4 className="text-lg font-bold text-on-surface truncate mb-1">{webinar.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        {new Date(webinar.scheduled_start).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        {new Date(webinar.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Link to={`/webinars/${webinar.id}`} className="inline-block bg-primary text-on-primary px-8 py-3 rounded-md font-bold text-sm hover:bg-primary-dim transition-all shadow-md group-active:scale-[0.98]">
                      Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column Context */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface-container-low/50 p-8 rounded-xl">
            <h4 className="font-headline text-lg font-bold mb-6">Recent Activity</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-primary font-bold">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                  <p className="text-sm font-bold">New Registrations Tracked</p>
                  <p className="text-xs text-on-surface-variant">System Status OK</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-tertiary-container flex items-center justify-center text-tertiary font-bold">
                  <span className="material-symbols-outlined">star</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Feedback enabled</p>
                  <p className="text-xs text-on-surface-variant">Data collection running</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-highest/30 p-6 rounded-xl border-l-4 border-primary">
            <h5 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Curator's Tip</h5>
            <p className="text-sm text-on-surface italic leading-relaxed">
              "Engagement peaks between the 15th and 25th minute. Plan your core interactive poll for that window to maximize retention."
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
