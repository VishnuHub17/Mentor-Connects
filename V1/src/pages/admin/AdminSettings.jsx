import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminSettings({ session, profile: initialProfile }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [company, setCompany] = useState(initialProfile?.company || '');
  const [designation, setDesignation] = useState(initialProfile?.designation || '');
  const [expertiseTags, setExpertiseTags] = useState(initialProfile?.expertise_tags || []);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (initialProfile) {
      setFullName(initialProfile.full_name || '');
      setBio(initialProfile.bio || '');
      setCompany(initialProfile.company || '');
      setDesignation(initialProfile.designation || '');
      setExpertiseTags(initialProfile.expertise_tags || []);
    }
  }, [initialProfile]);

  const resetForm = () => {
    setFullName(initialProfile?.full_name || '');
    setBio(initialProfile?.bio || '');
    setCompany(initialProfile?.company || '');
    setDesignation(initialProfile?.designation || '');
    setExpertiseTags(initialProfile?.expertise_tags || []);
    setSkillInput('');
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const tag = skillInput.trim();
      if (tag && !expertiseTags.includes(tag)) {
        setExpertiseTags((prev) => [...prev, tag]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (tagToRemove) => {
    setExpertiseTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio,
          company,
          designation,
          expertise_tags: expertiseTags
        })
        .eq('id', session.user.id);

      if (error) throw error;
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating admin settings:', error);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex-1 p-8 lg:p-12 max-w-5xl mx-auto w-full font-body selection:bg-primary-container selection:text-on-primary-container">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Profile Settings</h1>
        <p className="text-on-surface-variant font-medium">Manage your administrator identity and account details.</p>
      </div>

      <div className="space-y-20">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <h2 className="text-xl font-bold font-headline text-on-surface mb-2">Personal Information</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">Basic account information used across the admin workspace.</p>
          </div>

          <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-[0_10px_40px_rgba(49,51,44,0.06)] space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-body uppercase tracking-wider text-on-surface-variant/80">Full Name</label>
                <input
                  type="text"
                  className={`w-full bg-surface-container-highest border-0 rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-body uppercase tracking-wider text-on-surface-variant/80">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-surface-container-highest border-0 rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none opacity-60 cursor-not-allowed"
                  value={email}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-body uppercase tracking-wider text-on-surface-variant/80">About Me</label>
              <textarea
                className={`w-full bg-surface-container-highest border-0 rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                rows="4"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
              />
              {isEditing && <p className="text-[11px] text-on-surface-variant">Add a short summary for your admin profile.</p>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <h2 className="text-xl font-bold font-headline text-on-surface mb-2">Work Details</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">Keep your role and expertise updated for internal visibility.</p>
          </div>

          <div className="md:col-span-8 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_10px_40px_rgba(49,51,44,0.06)]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold font-body uppercase tracking-widest text-on-surface-variant">Current Role</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-body uppercase tracking-wider text-on-surface-variant/80">Organization</label>
                  <input
                    type="text"
                    className={`w-full bg-surface-container-highest border-0 rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-body uppercase tracking-wider text-on-surface-variant/80">Role / Designation</label>
                  <input
                    type="text"
                    className={`w-full bg-surface-container-highest border-0 rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container p-8 rounded-xl border border-surface-container-highest">
              <h3 className="text-sm font-bold font-body uppercase tracking-widest text-on-surface-variant mb-6">Expertise & Skills</h3>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {expertiseTags.map((tag) => (
                  <div key={tag} className="inline-flex items-center gap-2 bg-surface-container-lowest text-primary px-4 py-1.5 rounded-full border border-outline-variant/20 text-sm font-semibold">
                    {tag}
                    {isEditing && (
                      <button type="button" onClick={() => handleRemoveSkill(tag)} className="hover:text-error">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-32 bg-transparent border-0 border-b border-primary/30 px-2 py-1 text-on-surface font-medium focus:ring-0 focus:border-primary outline-none placeholder:text-primary/50 text-sm"
                      placeholder="Add Skill..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="inline-flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-full border border-dashed border-primary/30 text-sm font-bold hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-20 pt-8 border-t border-outline-variant/10 flex justify-between gap-4">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="px-8 py-3 rounded-lg text-error hover:bg-error/10 font-bold transition-colors flex items-center gap-2 focus:outline-none"
          disabled={loading}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </button>
        <div className="flex gap-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-10 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-all focus:outline-none"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  resetForm();
                  setIsEditing(false);
                }}
                className="px-8 py-3 rounded-lg text-primary font-bold hover:bg-surface-container-high transition-colors focus:outline-none"
                disabled={loading}
              >
                Cancel Changes
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-10 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/10 hover:opacity-90 active:scale-95 transition-all focus:outline-none"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </div>
            <h2 className="text-xl font-bold font-headline text-on-surface mb-2">Sign Out</h2>
            <p className="text-on-surface-variant font-medium text-sm mb-8">Are you sure you want to sign out of your administrator account?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 rounded-lg text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors focus:outline-none text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-error text-white rounded-lg font-bold shadow shadow-error/20 hover:opacity-90 active:scale-95 transition-all focus:outline-none text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
