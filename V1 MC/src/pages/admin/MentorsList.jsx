import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export default function MentorsList() {
  const [mentors, setMentors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMentors() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setMentors(data);
      }
      setLoading(false);
    }
    
    fetchMentors();
  }, []);

  const filteredMentors = mentors.filter(m => {
    if (!searchQuery) return true;
    return (
      (m.full_name && m.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.university && m.university.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.company && m.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Mentor Management</h2>
          <p className="text-sm font-body text-on-surface-variant">Manage and supervise all authorized platform mentors.</p>
        </div>
        <div className="relative w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">search</span>
          <input 
            type="text" 
            placeholder="Search by name, university, or company..." 
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading mentors...</div>
        ) : filteredMentors.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No mentors found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20 uppercase text-[10px] tracking-widest text-on-surface-variant">
                <th className="px-6 py-4 font-bold">Mentor Info</th>
                <th className="px-6 py-4 font-bold">University</th>
                <th className="px-6 py-4 font-bold">Company / Status</th>
                <th className="px-6 py-4 font-bold">Onboarded</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredMentors.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex w-10 h-10 bg-primary/10 text-primary items-center justify-center rounded-full font-bold overflow-hidden flex-shrink-0">
                        {mentor.avatar_url ? (
                          <img src={mentor.avatar_url} alt={mentor.full_name || 'Mentor'} className="w-full h-full object-cover" />
                        ) : (
                          (mentor.full_name || 'U')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{mentor.full_name || 'Unknown Mentor'}</p>
                        <p className="text-[10px] text-on-surface-variant">{mentor.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {mentor.university || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-on-surface">{mentor.company || 'N/A'}</p>
                    {mentor.setup_completed ? (
                       <span className="text-[10px] bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full inline-block mt-1 uppercase">Active</span>
                    ) : (
                       <span className="text-[10px] bg-outline/10 text-outline font-bold px-2 py-0.5 rounded-full inline-block mt-1 uppercase">Pending Setup</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {new Date(mentor.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/admin/mentors/${mentor.id}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-on-surface transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                    >
                      View Profile
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
