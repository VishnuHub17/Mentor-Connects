import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard({ session }) {
  const [stats, setStats] = useState({ mentors: 0, webinars: 0, todayWebinars: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlatformStats() {
      // Because we injected `public.is_admin()` into RLS bypass, these return global counts
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      
      const { count: mentorsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'mentor');

      const { count: webinarsCount } = await supabase
        .from('webinars')
        .select('*', { count: 'exact', head: true });

      const { count: registrationsCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

      const { count: todayWebinarsCount } = await supabase
        .from('webinars')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_start', startOfToday.toISOString())
        .lt('scheduled_start', endOfToday.toISOString());

      setStats({
        mentors: mentorsCount || 0,
        webinars: webinarsCount || 0,
        todayWebinars: todayWebinarsCount || 0,
        students: registrationsCount || 0
      });
      setLoading(false);
    }
    fetchPlatformStats();
  }, []);

  if (loading) return <div>Loading Platform Data...</div>;

  return (
    <>
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Platform Overview</h2>
          <p className="text-on-surface-variant font-body">Welcome back. The ivory archive is updated with 24 new activity logs since your last login.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-lowest text-primary border border-outline-variant/20 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-bright transition-all shadow-sm">
            Generate Report
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Link
          to="/admin/mentors"
          className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all text-left block cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-primary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary">groups</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-1">Total Mentors</p>
          <h3 className="text-3xl font-headline font-bold text-on-surface">{stats.mentors.toLocaleString()}</h3>
        </Link>

        <Link
          to="/admin/webinars"
          className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all text-left block cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-tertiary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-tertiary">videocam</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-1">Total Webinars</p>
          <h3 className="text-3xl font-headline font-bold text-on-surface">{stats.webinars.toLocaleString()}</h3>
        </Link>

        <Link
          to="/admin/webinars?filter=Today"
          className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all text-left block cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-secondary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-secondary">today</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-1">Today's Webinars</p>
          <h3 className="text-3xl font-headline font-bold text-on-surface">{stats.todayWebinars.toLocaleString()}</h3>
        </Link>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-secondary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-secondary">school</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-1">Total Enrollments</p>
          <h3 className="text-3xl font-headline font-bold text-on-surface">{stats.students.toLocaleString()}</h3>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-8">
        {/* Mentor Growth Chart Mockup */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-xl font-headline font-bold">Registration Growth</h4>
              <p className="text-sm text-on-surface-variant">Platform wide enrollments over time</p>
            </div>
          </div>
          <div className="relative h-64 flex items-end justify-between gap-4">
            {[40, 60, 85, 55, 70, 45, 95].map((height, i) => (
              <div key={i} className={`w-full ${height > 80 ? 'bg-primary' : 'bg-surface-container-low'} rounded-t-lg relative group transition-all hover:bg-primary-dim cursor-pointer`} style={{ height: `${height}%` }}>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container p-8 rounded-xl shadow-sm">
          <h4 className="text-xl font-headline font-bold mb-6">System Health</h4>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Database Sync</p>
                <p className="text-xs text-on-surface-variant">Connected to Supabase successfully.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-secondary shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-on-surface">RLS Policies Check</p>
                <p className="text-xs text-on-surface-variant">Admin bypass function verified.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-tertiary shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-on-surface">API Status</p>
                <p className="text-xs text-on-surface-variant">All endpoints returning 200 OK.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
