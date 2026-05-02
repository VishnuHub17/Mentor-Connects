import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useSearchParams } from 'react-router-dom';

export default function AdminWebinars() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [webinars, setWebinars] = useState([]);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'All'); // 'All', 'Today', 'Weekly', 'Monthly'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextFilter = searchParams.get('filter') || 'All';
    setFilter(nextFilter);
  }, [searchParams]);

  useEffect(() => {
    async function fetchWebinars() {
      // Due to the admin RLS bypass, this pulls ALL platform webinars.
      // Eager load the creator's profile using the built in foreign key.
      const { data, error } = await supabase
        .from('webinars')
        .select(`
          *,
          mentor:mentor_id (
            id,
            full_name
          )
        `)
        .order('scheduled_start', { ascending: false });

      if (data && !error) setWebinars(data);
      setLoading(false);
    }
    fetchWebinars();
  }, []);

  const deleteWebinar = async (id) => {
    if(!window.confirm("Are you sure you want to delete this webinar? This will also remove all student registrations attached to it.")) return;
    
    // Admins have full CRUD bypass
    const { error } = await supabase.from('webinars').delete().eq('id', id);
    if (!error) {
      setWebinars(prev => prev.filter(w => w.id !== id));
    } else {
      alert("Error deleting webinar: " + error.message);
    }
  };

  const getFilteredWebinars = () => {
    const now = new Date();
    return webinars.filter(web => {
      if (filter === 'All') return true;
      const scheduledDate = new Date(web.scheduled_start);
      if (filter === 'Today') {
        return scheduledDate.toDateString() === now.toDateString();
      }
      if (filter === 'Weekly') {
        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return scheduledDate >= now && scheduledDate <= weekFromNow;
      }
      if (filter === 'Monthly') {
        return scheduledDate.getMonth() === now.getMonth() && scheduledDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filtered = getFilteredWebinars();

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    if (nextFilter === 'All') {
      setSearchParams({});
      return;
    }
    setSearchParams({ filter: nextFilter });
  };

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Global Webinars</h2>
          <p className="text-sm font-body text-on-surface-variant">Oversee and manage all active sessions on the platform.</p>
        </div>
        <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl">
          {['All', 'Today', 'Weekly', 'Monthly'].map(f => (
            <button 
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === f ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading platform webinars...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No webinars match the selected filter.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20 uppercase text-[10px] tracking-widest text-on-surface-variant">
                <th className="px-6 py-4 font-bold">Session & Host</th>
                <th className="px-6 py-4 font-bold">Audience</th>
                <th className="px-6 py-4 font-bold">Scheduled Timeline</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.map((web) => (
                <tr key={web.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-on-surface mb-1">{web.title}</p>
                    <Link to={`/admin/mentors/${web.mentor?.id}`} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">person</span>
                      Hosted by {web.mentor?.full_name || 'Unknown Mentor'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {web.target_audience || 'General'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-on-surface">{new Date(web.scheduled_start).toLocaleDateString()}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{new Date(web.scheduled_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => deleteWebinar(web.id)}
                      className="inline-flex items-center gap-1 text-sm font-bold text-error hover:text-error/80 transition-colors bg-error/5 hover:bg-error/10 px-3 py-1.5 rounded-lg"
                      title="Force Delete Webinar"
                    >
                      Delete
                      <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    </button>
                    <Link 
                      to={`/admin/webinars/${web.id}`} 
                      className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-on-surface transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                      title="View Active Session"
                    >
                      Preview
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
