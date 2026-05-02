import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, FileText, Award, Calendar, Edit2, Plus, X, Save, Trash2 } from 'lucide-react';

const MentorSettings = ({ session, profile: initialProfile }) => {
    const navigate = useNavigate();
    
    // Internal state mirrored closely to ProfilePreview
    const [profileData, setProfileData] = useState({
        full_name: '', headline: '', bio: '', experience: [], skills: []
    });

    // To prevent flashing empty fields when pulling from initialProfile
    useEffect(() => {
        if (initialProfile) {
            setProfileData({
                full_name: initialProfile.full_name || '',
                headline: initialProfile.headline || '',
                bio: initialProfile.bio || '',
                experience: initialProfile.experience_raw || [],
                skills: initialProfile.expertise_tags || initialProfile.skills || []
            });
        }
    }, [initialProfile]);

    const [saving, setSaving] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Edit States for basic info
    const [editingHeadline, setEditingHeadline] = useState(false);
    const [tempHeadline, setTempHeadline] = useState('');
    
    const [editingBio, setEditingBio] = useState(false);
    const [tempBio, setTempBio] = useState('');

    // Edit States for array (Experience)
    const [editingIndex, setEditingIndex] = useState(null);
    const [expFormData, setExpFormData] = useState(null);

    // Edit States for array (Skills)
    const [skillInput, setSkillInput] = useState('');

    const _parseLinkedInDate = (dateObj) => {
        if (!dateObj) return '';
        if (typeof dateObj === 'string') return dateObj;
        if (dateObj.year) return `${dateObj.year}-${dateObj.month ? dateObj.month.toString().padStart(2, '0') : '01'}`;
        return '';
    };

    const _formatDateForInput = (dateStr) => {
        if (!dateStr || dateStr.toLowerCase() === 'present') return '';
        if (dateStr.includes('/')) {
            const [mm, yyyy] = dateStr.split('/');
            return `${yyyy}-${mm.padStart(2, '0')}`;
        }
        return dateStr;
    };

    const _formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.toLowerCase() === 'present') return 'Present';
        if (dateStr.includes('-')) {
            const [yyyy, mm] = dateStr.split('-');
            return `${mm}/${yyyy}`;
        }
        return dateStr;
    };

    const MONTHS = [
        { v: '01', l: 'Jan' }, { v: '02', l: 'Feb' }, { v: '03', l: 'Mar' }, { v: '04', l: 'Apr' },
        { v: '05', l: 'May' }, { v: '06', l: 'Jun' }, { v: '07', l: 'Jul' }, { v: '08', l: 'Aug' },
        { v: '09', l: 'Sep' }, { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' }
    ];
    
    const currentYear = new Date().getFullYear();
    const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i);

    const getMonthYear = (dateStr) => {
        if (!dateStr || dateStr.toLowerCase() === 'present') return { m: '', y: '' };
        if (dateStr.includes('/')) {
            const [m, y] = dateStr.split('/');
            return { m: m.padStart(2, '0'), y };
        }
        if (dateStr.includes('-')) {
            const [y, m] = dateStr.split('-');
            return { m: m.padStart(2, '0'), y };
        }
        return { m: '', y: '' };
    };

    const handleSaveBackend = async (dataToSave) => {
        setSaving(true);
        try {
            const tagsArray = (dataToSave.skills || []).map(s => typeof s === 'string' ? s : (s.name || s.title || '')).filter(Boolean);
            
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: dataToSave.full_name,
                    headline: dataToSave.headline,
                    bio: dataToSave.bio,
                    skills: tagsArray,
                    expertise_tags: tagsArray,
                    experience_raw: dataToSave.experience
                })
                .eq('id', session.user.id);
            
            if (error) throw error;
            // Optionally could trigger a toast here
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    // --- Basic Info Handlers ---
    const handleSaveHeadline = () => {
        const updated = { ...profileData, headline: tempHeadline };
        setProfileData(updated);
        setEditingHeadline(false);
        handleSaveBackend(updated);
    };
    
    const handleSaveBio = () => {
        const updated = { ...profileData, bio: tempBio };
        setProfileData(updated);
        setEditingBio(false);
        handleSaveBackend(updated);
    };

    // --- Experience Handlers ---
    const handleEditExp = (idx) => {
        setEditingIndex(idx);
        const exp = profileData.experience[idx];
        setExpFormData({
            title: exp.title || exp.position || '',
            companyName: exp.companyName || exp.company || '',
            startDate: _parseLinkedInDate(exp.startDate),
            endDate: _parseLinkedInDate(exp.endDate),
            description: exp.description || ''
        });
    };

    const handleCreateExp = () => {
        const newExp = { title: '', companyName: '', startDate: '', endDate: '', description: '' };
        setProfileData(prev => ({ ...prev, experience: [newExp, ...prev.experience] }));
        setEditingIndex(0);
        setExpFormData(newExp);
    };

    const handleSaveExp = () => {
        const updatedExp = [...profileData.experience];
        updatedExp[editingIndex] = { ...expFormData };
        const updated = { ...profileData, experience: updatedExp };
        setProfileData(updated);
        setEditingIndex(null);
        handleSaveBackend(updated);
    };

    const handleDeleteExp = (idx) => {
        const updatedExp = profileData.experience.filter((_, i) => i !== idx);
        const updated = { ...profileData, experience: updatedExp };
        setProfileData(updated);
        if (editingIndex === idx) setEditingIndex(null);
        handleSaveBackend(updated);
    };

    // --- Skills Handlers ---
    const handleAddSkill = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            const tag = skillInput.trim();
            if (tag) {
                const existingSkills = profileData.skills.map(s => typeof s === 'string' ? s : (s.name || s.title || ''));
                if (!existingSkills.includes(tag)) {
                    const updated = { ...profileData, skills: [...existingSkills, tag] };
                    setProfileData(updated);
                    handleSaveBackend(updated);
                }
            }
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (tagToRemove) => {
        const updatedSkills = profileData.skills.filter(s => {
            const strVal = typeof s === 'string' ? s : (s.name || s.title || '');
            return strVal !== tagToRemove;
        });
        const updated = { ...profileData, skills: updatedSkills };
        setProfileData(updated);
        handleSaveBackend(updated);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const { full_name, headline, bio, experience, skills } = profileData;
    const skillsList = skills?.map(s => typeof s === 'string' ? s : (s.name || s.title || '')).filter(Boolean) || [];

    return (
        <div className="flex-1 p-8 lg:p-12 max-w-5xl mx-auto w-full font-body selection:bg-primary-container selection:text-on-primary-container">
            {/* Header Section */}
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Profile Settings</h1>
                <p className="text-on-surface-variant font-medium">Manage your professional identity and mentorship preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    
                    {/* Basic Info */}
                    <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="w-full pr-4">
                                <h2 className="text-xl font-headline font-bold text-on-surface mb-1">{full_name || session?.user?.email}</h2>
                                
                                {editingHeadline ? (
                                    <div className="mt-2 flex gap-2">
                                         <input 
                                           type="text" 
                                           value={tempHeadline} 
                                           onChange={(e) => setTempHeadline(e.target.value)} 
                                           className="flex-grow bg-surface-container text-on-surface p-2 rounded-md text-sm border focus:border-primary focus:outline-none"
                                           placeholder="e.g. Senior Software Engineer at XYZ"
                                         />
                                         <button onClick={handleSaveHeadline} disabled={saving} className="p-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"><Save className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group">
                                         <p className="text-primary font-medium">{headline || 'Add a professional headline'}</p>
                                         <button onClick={() => { setTempHeadline(headline); setEditingHeadline(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-primary transition-opacity"><Edit2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 relative">
                           <div className="flex justify-between items-center mb-3">
                               <h3 className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant flex items-center gap-2">
                                   <FileText className="w-4 h-4" /> About You
                               </h3>
                               {!editingBio && (
                                  <button onClick={() => { setTempBio(bio); setEditingBio(true); }} className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                                      <Edit2 className="w-3.5 h-3.5" /> Edit
                                  </button>
                               )}
                           </div>
                           
                           {editingBio ? (
                                <div className="space-y-2">
                                    <textarea 
                                        rows="4" 
                                        value={tempBio} 
                                        onChange={(e) => setTempBio(e.target.value)}
                                        className="w-full bg-surface-container text-on-surface p-4 rounded-xl text-sm border focus:border-primary focus:outline-none"
                                        placeholder="Write a short summary about your background..."
                                    />
                                    <div className="flex justify-end gap-2 text-sm">
                                        <button onClick={() => setEditingBio(false)} className="px-3 py-1.5 text-on-surface-variant hover:bg-surface-container rounded-md font-medium">Cancel</button>
                                        <button onClick={handleSaveBio} disabled={saving} className="px-3 py-1.5 bg-primary text-white rounded-md font-bold shadow-sm disabled:opacity-50">Save</button>
                                    </div>
                                </div>
                           ) : (
                               <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                                   {bio || 'No summary provided. You can add one anytime.'}
                               </p>
                           )}
                        </div>
                    </section>

                    {/* Experience component directly mirroring ProfilePreview */}
                    <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Professional History
                            </h3>
                            <button 
                                onClick={handleCreateExp}
                                className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Experience
                            </button>
                        </div>
                        
                        <div className="space-y-8">
                            {experience && experience.length > 0 ? experience.map((exp, idx) => (
                                <div key={idx} className="relative pl-6 border-l-2 border-outline-variant/20 hover:border-primary/50 transition-colors group">
                                    <div className="absolute w-3 h-3 bg-surface-container-lowest border-2 border-primary rounded-full -left-[7.5px] top-1"></div>
                                    
                                    {editingIndex === idx ? (
                                        <div className="bg-surface-container-low p-4 rounded-xl space-y-4 border border-outline-variant/20 animate-in fade-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Job Title</label>
                                                    <input type="text" value={expFormData.title} onChange={e => setExpFormData({...expFormData, title: e.target.value})} className="w-full bg-surface-container p-2 rounded-md text-sm border focus:border-primary focus:outline-none"/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Company Name</label>
                                                    <input type="text" value={expFormData.companyName} onChange={e => setExpFormData({...expFormData, companyName: e.target.value})} className="w-full bg-surface-container p-2 rounded-md text-sm border focus:border-primary focus:outline-none"/>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Start Date</label>
                                                    <div className="flex gap-2">
                                                        <select 
                                                            value={getMonthYear(expFormData.startDate).m} 
                                                            onChange={(e) => {
                                                                const y = getMonthYear(expFormData.startDate).y || currentYear;
                                                                setExpFormData({...expFormData, startDate: `${e.target.value || '01'}/${y}`});
                                                            }}
                                                            className="w-1/2 bg-surface-container p-2 rounded-md text-sm border focus:border-primary focus:outline-none"
                                                        >
                                                            <option value="">Month</option>
                                                            {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                                                        </select>
                                                        <select 
                                                            value={getMonthYear(expFormData.startDate).y} 
                                                            onChange={(e) => {
                                                                const m = getMonthYear(expFormData.startDate).m || '01';
                                                                setExpFormData({...expFormData, startDate: `${m}/${e.target.value}`});
                                                            }}
                                                            className="w-1/2 bg-surface-container p-2 rounded-md text-sm border focus:border-primary focus:outline-none"
                                                        >
                                                            <option value="">Year</option>
                                                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-on-surface-variant mb-1 block">End Date</label>
                                                    {(expFormData.endDate && expFormData.endDate.toLowerCase() === 'present') ? (
                                                        <div className="w-full bg-surface-container/50 p-2 rounded-md text-sm border border-transparent text-on-surface-variant/70 italic flex items-center h-[38px]">
                                                            Present
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <select 
                                                                value={getMonthYear(expFormData.endDate).m} 
                                                                onChange={(e) => {
                                                                    const y = getMonthYear(expFormData.endDate).y || currentYear;
                                                                    setExpFormData({...expFormData, endDate: `${e.target.value || '01'}/${y}`});
                                                                }}
                                                                className="w-1/2 bg-surface-container p-2 rounded-md text-sm border focus:border-primary focus:outline-none"
                                                            >
                                                                <option value="">Month</option>
                                                                {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                                                            </select>
                                                            <select 
                                                                value={getMonthYear(expFormData.endDate).y} 
                                                                onChange={(e) => {
                                                                    const m = getMonthYear(expFormData.endDate).m || '01';
                                                                    setExpFormData({...expFormData, endDate: `${m}/${e.target.value}`});
                                                                }}
                                                                className="w-1/2 bg-surface-container p-2 rounded-md text-sm border focus:border-primary focus:outline-none"
                                                            >
                                                                <option value="">Year</option>
                                                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                    <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-medium text-on-surface-variant">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={expFormData.endDate && expFormData.endDate.toLowerCase() === 'present'} 
                                                            onChange={(e) => {
                                                                if (e.target.checked) setExpFormData({...expFormData, endDate: 'Present'});
                                                                else setExpFormData({...expFormData, endDate: ''});
                                                            }}
                                                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                                                        />
                                                        I currently work here
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Description</label>
                                                <textarea rows="3" value={expFormData.description} onChange={e => setExpFormData({...expFormData, description: e.target.value})} className="w-full bg-surface-container p-2 rounded-md text-sm border focus:border-primary focus:outline-none"></textarea>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <button onClick={() => handleDeleteExp(idx)} className="text-error hover:bg-error-container/20 p-2 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingIndex(null)} className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-md text-sm font-medium">Cancel</button>
                                                    <button onClick={handleSaveExp} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm disabled:opacity-50">Save Role</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pr-12 relative">
                                            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditExp(idx)} className="p-2 text-on-surface-variant hover:text-primary bg-surface-container rounded-md backdrop-blur-sm"><Edit2 className="w-4 h-4" /></button>
                                            </div>
                                            <h4 className="font-headline font-bold text-on-surface text-lg">{(exp.title || exp.position || 'Unknown Role')}</h4>
                                            <h5 className="text-primary font-medium text-sm mb-2">{exp.companyName || exp.company || 'Unknown Company'}</h5>
                                            <div className="flex items-center text-xs text-on-surface-variant font-medium gap-1 mb-2 bg-surface-container-high inline-flex px-3 py-1.5 rounded-md">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>
                                                    {_formatDateForDisplay(exp.startDate) || 'Past'} - {_formatDateForDisplay(exp.endDate) || 'Present'}
                                                </span>
                                            </div>
                                            {exp.description && (
                                                <p className="text-sm text-on-surface-variant mt-2 line-clamp-2 whitespace-pre-wrap">{exp.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center p-8 bg-surface-container border border-outline-variant/30 border-dashed rounded-xl">
                                    <Briefcase className="w-8 h-8 text-on-surface-variant/50 mx-auto mb-3" />
                                    <p className="text-sm text-on-surface-variant font-medium mb-4">No work history added yet.</p>
                                    <button onClick={handleCreateExp} className="px-4 py-2 bg-surface-container-highest hover:bg-surface-container-high text-on-surface rounded-lg font-bold text-sm shadow-sm transition-colors">
                                        Add your first role
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                    <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant flex items-center gap-2">
                                <Award className="w-4 h-4" /> Expertise & Skills
                            </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {skillsList.map((skill, idx) => (
                                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-container/50 text-on-secondary-container text-xs font-bold rounded-lg border border-secondary-container">
                                    {skill}
                                    <button onClick={() => handleRemoveSkill(skill)} className="hover:text-error transition-colors focus:outline-none">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                className="w-full bg-transparent border-0 border-b border-outline-variant/50 px-2 py-1.5 text-on-surface font-medium focus:ring-0 focus:border-primary outline-none placeholder:text-on-surface-variant/50 text-sm" 
                                placeholder="Add Skill..."
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleAddSkill}
                            />
                            <button 
                                onClick={handleAddSkill}
                                className="inline-flex items-center justify-center flex-shrink-0 bg-primary/5 text-primary w-8 h-8 rounded-full hover:bg-primary/10 transition-colors focus:outline-none"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    {/* Account Settings / Meta */}
                    <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
                        <h3 className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant mb-6">Account Settings</h3>
                        
                        <div className="space-y-4">
                             <div>
                                 <label className="text-xs font-semibold text-on-surface-variant block mb-1">Email Address</label>
                                 <input type="email" value={session?.user?.email || ''} readOnly className="w-full bg-surface-container-high p-2 rounded-md text-sm outline-none opacity-70 cursor-not-allowed"/>
                             </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-outline-variant/10">
                             <button 
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full bg-error/10 hover:bg-error/20 text-error font-bold text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                             >
                                 Sign Out
                             </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-outline-variant/20 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-6">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold font-headline text-on-surface mb-2">Sign Out</h2>
                        <p className="text-on-surface-variant font-medium text-sm mb-8">Are you sure you want to sign out of your account?</p>
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
};

export default MentorSettings;
