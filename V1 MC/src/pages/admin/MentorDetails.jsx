import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function MentorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [webinars, setWebinars] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profile) setMentor(profile);

      // 2. Fetch all their webinars
      const { data: mentorWebinars } = await supabase
        .from('webinars')
        .select('*')
        .eq('mentor_id', id)
        .order('scheduled_start', { ascending: false });

      if (mentorWebinars) {
        setWebinars(mentorWebinars);
        
        // 3. To find total students, we count registrations linked to these webinars
        if (mentorWebinars.length > 0) {
          const webinarIds = mentorWebinars.map(w => w.id);
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .in('webinar_id', webinarIds);
          
          setTotalStudents(count || 0);
        }
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [id]);

  const handleDeleteMentor = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this mentor? This action cannot be undone and will irreversibly delete all their webinars and associated data.')) {
      return;
    }
    
    setIsDeleting(true);
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: id });
    setIsDeleting(false);

    if (error) {
      alert(`Error deleting mentor: ${error.message}`);
    } else {
      alert('Mentor successfully deleted.');
      navigate('/admin/mentors');
    }
  };

  if (loading) return <div>Loading mentor profile...</div>;
  if (!mentor) return <div>Mentor not found.</div>;

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Go Back
          </button>
          
          <button 
            onClick={handleDeleteMentor} 
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-error text-on-error hover:bg-error/90 rounded-full font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {isDeleting ? 'Deleting...' : 'Delete Mentor'}
          </button>
        </div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 text-primary text-3xl font-extrabold flex items-center justify-center rounded-full overflow-hidden flex-shrink-0">
              {mentor.avatar_url ? (
                <img src={mentor.avatar_url} alt={mentor.full_name || 'Mentor'} className="w-full h-full object-cover" />
              ) : (
                (mentor.full_name || 'U')[0].toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-1">
                {mentor.full_name || 'Unnamed Mentor'}
              </h2>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <span>{mentor.university || 'No University'}</span>
                {mentor.company && (
                  <>
                    <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                    <span>{mentor.company}</span>
                  </>
                )}
                <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                <span>{mentor.setup_completed ? 'Fully Onboarded' : 'Pending Profile Setup'}</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low px-6 py-4 rounded-xl border border-outline-variant/20 flex gap-8 shadow-sm">
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-on-surface-variant mb-1">Host Of</p>
              <p className="text-2xl font-headline font-bold text-on-surface">{webinars.length} Webinars</p>
            </div>
            <div className="w-px bg-outline-variant/30"></div>
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-on-surface-variant mb-1">Impact</p>
              <p className="text-2xl font-headline font-bold text-on-surface">{totalStudents} Students</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-headline font-bold mb-4">Hosted Webinars</h3>
      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm overflow-hidden">
        {webinars.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">This mentor has not scheduled any webinars yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20 uppercase text-[10px] tracking-widest text-on-surface-variant">
                <th className="px-6 py-4 font-bold">Webinar Title</th>
                <th className="px-6 py-4 font-bold">Target Audience</th>
                <th className="px-6 py-4 font-bold">Scheduled For</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {webinars.map((web) => (
                <tr key={web.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-on-surface">{web.title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {web.target_audience || 'General'}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {new Date(web.scheduled_start).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {/* Admin CRUD Actions could go here, or link to webinar details */}
                    <Link 
                      to={`/webinars/${web.id}`} 
                      className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors inline-block"
                      title="View Webinar"
                    >
                      <span className="material-symbols-outlined text-[18px] align-middle">visibility</span>
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
