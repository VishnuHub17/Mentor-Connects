import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DateTimePicker from '../components/DateTimePicker';

const STATUS_OPTIONS = [
  { value: 'published', label: 'Upcoming' },
  { value: 'held', label: 'Held' },
  { value: 'not_held', label: 'Not Held' }
];

function normalizeStatus(status) {
  if (!status || status === 'upcoming') return 'published';
  if (status === 'completed') return 'held';
  return status;
}

function formatStatusLabel(status) {
  const normalized = normalizeStatus(status);
  return STATUS_OPTIONS.find((option) => option.value === normalized)?.label || 'Upcoming';
}

function toLocalDate(value) {
  if (!value) return null;
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000);
}

function toDateInputValue(value) {
  const localDate = toLocalDate(value);
  return localDate ? localDate.toISOString().slice(0, 10) : '';
}

function toTimeInputValue(value) {
  const localDate = toLocalDate(value);
  return localDate ? localDate.toISOString().slice(11, 16) : '';
}

function buildFormState(webinar) {
  const scheduledStart = webinar?.scheduled_start ? new Date(webinar.scheduled_start) : null;
  const scheduledEnd = webinar?.scheduled_end ? new Date(webinar.scheduled_end) : null;
  const durationMinutes = scheduledStart && scheduledEnd
    ? Math.max(60, Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000))
    : 60;

  return {
    title: webinar?.title || '',
    description: webinar?.description || '',
    scheduledDate: toDateInputValue(webinar?.scheduled_start),
    scheduledTime: toTimeInputValue(webinar?.scheduled_start),
    targetAudience: webinar?.target_audience || '',
    meetLink: webinar?.meet_link || '',
    status: normalizeStatus(webinar?.status),
    durationMinutes
  };
}

export default function WebinarDetails({ session, profile }) {
  const { id } = useParams();
  const [webinar, setWebinar] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(buildFormState(null));
  const backTo = profile?.role === 'admin' ? '/admin/webinars' : '/webinars';

  useEffect(() => {
    async function fetchDetails() {
      const { data } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        const normalizedWebinar = { ...data, status: normalizeStatus(data.status) };
        setWebinar(normalizedWebinar);
        setFormData(buildFormState(normalizedWebinar));
      }

      const { data: regData } = await supabase
        .from('registrations')
        .select('*, profile:profile_id (*)')
        .eq('webinar_id', id);

      if (regData) setRegistrations(regData);

      setLoading(false);
    }
    fetchDetails();

    const subscription = supabase
      .channel('public:registrations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations', filter: `webinar_id=eq.${id}` }, async (payload) => {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', payload.new.profile_id).single();
        const newRecord = { ...payload.new, profile };
        setRegistrations((prev) => [...prev, newRecord]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const canEdit = !!session?.user?.id && webinar?.mentor_id === session.user.id;

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleStartEditing = () => {
    setFormData(buildFormState(webinar));
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setFormData(buildFormState(webinar));
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!webinar) return;

    setSaving(true);

    try {
      const startDate = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const endDate = new Date(startDate.getTime() + Number(formData.durationMinutes || 60) * 60 * 1000);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        target_audience: formData.targetAudience.trim(),
        meet_link: formData.meetLink.trim(),
        status: normalizeStatus(formData.status)
      };

      const { data, error } = await supabase
        .from('webinars')
        .update(payload)
        .eq('id', webinar.id)
        .select()
        .single();

      if (error) throw error;

      const updatedWebinar = { ...data, status: normalizeStatus(data.status) };
      setWebinar(updatedWebinar);
      setFormData(buildFormState(updatedWebinar));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save webinar:', err);
      alert(`Failed to save webinar changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading details...</div>;
  if (!webinar) return <div>Webinar not found.</div>;

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link to={backTo} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-dim transition-colors group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-1">Session Details</p>
            <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">{isEditing ? 'Edit Webinar' : webinar.title}</h2>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-semibold hover:bg-surface-dim transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="webinar-edit-form"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-dim transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-dim transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <form id="webinar-edit-form" onSubmit={handleSave}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h3 className="text-lg font-bold font-headline mb-4 text-on-surface">{isEditing ? 'Webinar Details' : 'Description'}</h3>

              {isEditing ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface">Webinar Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={handleFieldChange('title')}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface">Description</label>
                    <textarea
                      required
                      rows="6"
                      value={formData.description}
                      onChange={handleFieldChange('description')}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Date & Time</label>
                      <DateTimePicker
                        required
                        dateValue={formData.scheduledDate}
                        timeValue={formData.scheduledTime}
                        onDateChange={(val) => setFormData((prev) => ({ ...prev, scheduledDate: val }))}
                        onTimeChange={(val) => setFormData((prev) => ({ ...prev, scheduledTime: val }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface">Target Audience</label>
                      <input
                        required
                        type="text"
                        value={formData.targetAudience}
                        onChange={handleFieldChange('targetAudience')}
                        className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface">Meeting Link</label>
                    <input
                      required
                      type="url"
                      value={formData.meetLink}
                      onChange={handleFieldChange('meetLink')}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{webinar.description}</p>
              )}
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-lg font-bold font-headline text-on-surface">Registered Students</h3>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{registrations.length} Total</span>
              </div>

              {registrations.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-surface-container flex items-center justify-center rounded-full text-outline-variant mb-4">
                    <span className="material-symbols-outlined text-3xl">school</span>
                  </div>
                  <p className="text-on-surface font-semibold mb-1">No students enrolled yet.</p>
                  <p className="text-sm text-on-surface-variant max-w-xs">Share the Pathwisse network link to start gathering attendees.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50 border-b border-outline-variant/20 uppercase text-[10px] tracking-widest text-on-surface-variant">
                        <th className="px-4 py-3 font-bold">Student Name</th>
                        <th className="px-4 py-3 font-bold">Registration Date</th>
                        <th className="px-4 py-3 font-bold text-right">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {registrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-sm text-on-surface">{reg.profile?.full_name}</p>
                            <p className="text-[10px] text-on-surface-variant">{reg.profile?.id?.substring(0, 8)}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant font-medium">
                            {new Date(reg.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {reg.platform_source === 'pathwisse' ? (
                              <span className="inline-flex items-center gap-1 bg-[#4b3aff]/10 text-[#4b3aff] px-2 py-1 rounded-lg text-xs font-bold border border-[#4b3aff]/20" title="Connected via LMS integration">
                                <span className="material-symbols-outlined text-[14px]">extension</span> Pathwisse
                              </span>
                            ) : (
                              <span className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Internal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
              <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6 pb-4 border-b border-outline-variant/20">Logistics</h4>

              <div className="space-y-6">
                {isEditing ? (
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary mt-1 text-[20px]">calendar_today</span>
                    <div className="flex-1">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Date & Time</p>
                      <DateTimePicker
                        required
                        dateValue={formData.scheduledDate}
                        timeValue={formData.scheduledTime}
                        onDateChange={(val) => setFormData((prev) => ({ ...prev, scheduledDate: val }))}
                        onTimeChange={(val) => setFormData((prev) => ({ ...prev, scheduledTime: val }))}
                      />
                      <p className="text-xs text-on-surface-variant mt-1">End time will be saved 1 hour after the selected start time.</p>
                    </div>
                  </div>
                ) : (
                <>
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-primary mt-1 text-[20px]">calendar_today</span>
                  <div className="flex-1">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Date</p>
                    <p className="font-semibold text-on-surface">{new Date(webinar.scheduled_start).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-primary mt-1 text-[20px]">schedule</span>
                  <div className="flex-1">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Time</p>
                      <p className="font-semibold text-on-surface">
                        {new Date(webinar.scheduled_start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {new Date(webinar.scheduled_end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                  </div>
                </div>
                </>
                )}

                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-primary mt-1 text-[20px]">groups</span>
                  <div className="flex-1">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Target Audience</p>
                    {isEditing ? (
                      <input
                        required
                        type="text"
                        value={formData.targetAudience}
                        onChange={handleFieldChange('targetAudience')}
                        className="w-full bg-surface-container border-0 rounded-md px-3 py-2 text-on-surface font-semibold text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    ) : (
                      <p className="font-semibold text-on-surface">{webinar.target_audience || 'All Audiences'}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-primary mt-1 text-[20px]">info</span>
                  <div className="flex-1">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">Status</p>
                    {isEditing ? (
                      <select
                        value={formData.status}
                        onChange={handleFieldChange('status')}
                        className="w-full bg-surface-container border-0 rounded-md px-3 py-2 text-on-surface font-semibold text-sm focus:ring-1 focus:ring-primary outline-none"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-semibold text-on-surface">{formatStatusLabel(webinar.status)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary hover:bg-primary-dim transition-colors p-6 rounded-2xl shadow-md cursor-pointer group">
              <a href={isEditing ? formData.meetLink : webinar.meet_link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-on-primary h-full w-full">
                <span className="material-symbols-outlined text-4xl mb-3 group-hover:scale-110 transition-transform">videocam</span>
                <p className="font-bold tracking-wide">Join Virtual Room</p>
                <p className="text-xs mt-1 opacity-80 underline truncate max-w-[200px]">{isEditing ? formData.meetLink : webinar.meet_link}</p>
              </a>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
