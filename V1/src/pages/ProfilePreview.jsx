import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import { CheckCircle2, User, Briefcase, FileText, Award, Calendar, Edit2, Plus, X, Save, Trash2 } from 'lucide-react';
import {
  ComposioImportStatus,
  OnboardingStep,
  clearComposioImportStatus,
  clearOnboardingStep,
  setComposioImportStatus,
  setOnboardingStep
} from '../lib/onboarding';

export default function ProfilePreview({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [importFallback, setImportFallback] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: '', headline: '', bio: '', experience: [], skills: []
  });
  
  const [searchParams] = useSearchParams();
  const isManual = searchParams.get('manual') === 'true';
  const isEditableManualMode = isManual || importFallback;

  const getManualProfileData = () => ({
    full_name: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '',
    headline: '',
    bio: '',
    experience: [],
    skills: []
  });

  const normalizeImportedSkills = (input) => {
    if (!Array.isArray(input)) return [];

    return input
      .map((skill) => {
        if (typeof skill === 'string') return skill.trim();
        if (skill && typeof skill === 'object') {
          return (skill.name || skill.title || skill.skill || '').trim();
        }
        return '';
      })
      .filter(Boolean);
  };

  const normalizeImportedExperience = (input) => {
    if (!Array.isArray(input)) return [];

    return input
      .map((item) => {
        const companyName = item?.companyName || item?.company || '';
        const title = item?.title || item?.position || item?.role || '';
        const startDate = item?.startDate || item?.start_date || '';
        const endDate = item?.endDate || item?.end_date || '';
        const description = item?.description || '';

        return {
          companyName,
          company: companyName,
          title,
          position: title,
          startDate,
          endDate,
          description
        };
      })
      .filter((item) => item.companyName || item.title);
  };

  const parseGatewayError = (rawText) => {
    const fallbackMessage = rawText?.substring(0, 200) || 'Unable to import your LinkedIn profile right now.';

    try {
      const parsed = JSON.parse(rawText);
      const nested = parsed?.error || parsed?.message;

      if (typeof nested === 'string') {
        try {
          const nestedParsed = JSON.parse(nested);
          return nestedParsed?.error || nestedParsed?.message || nested;
        } catch {
          return nested;
        }
      }

      return parsed?.error || parsed?.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  // Edit States
  const [editingHeadline, setEditingHeadline] = useState(false);
  const [tempHeadline, setTempHeadline] = useState('');
  
  const [editingBio, setEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState('');

  const [editingIndex, setEditingIndex] = useState(null);
  const [expFormData, setExpFormData] = useState(null);

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    async function loadData() {
      if (isManual) {
         setOnboardingStep(OnboardingStep.MANUAL);
         setProfileData(getManualProfileData());
         setLoading(false);
         return;
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) throw new Error("No active session");

        const response = await fetch(`${supabaseUrl}/functions/v1/composio-linkedin-v3?action=fetch-profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`
          }
        });

        if (!response.ok) {
           const errorText = await response.text();
           console.error("Gateway error text:", errorText);
           throw new Error(parseGatewayError(errorText));
        }

        const resData = JSON.parse(await response.text());
        const extraction = resData.data || {};
        const normalizedExperience = normalizeImportedExperience(
          extraction.positions || extraction.experience || []
        );
        const normalizedSkills = normalizeImportedSkills(extraction.skills || []);

        setProfileData({
          full_name: extraction.full_name || (extraction.first_name && extraction.last_name ? `${extraction.first_name} ${extraction.last_name}` : (session.user.user_metadata.full_name || session.user.user_metadata.name || '')),
          headline: extraction.headline || extraction.occupation || '',
          bio: extraction.summary || extraction.about || '',
          experience: normalizedExperience,
          skills: normalizedSkills
        });
        setComposioImportStatus(ComposioImportStatus.SUCCEEDED);
        setOnboardingStep(OnboardingStep.PREVIEW);

      } catch (err) {
        console.error(err);
        setImportFallback(true);
        setProfileData(getManualProfileData());
        setComposioImportStatus(ComposioImportStatus.FAILED);
        setOnboardingStep(OnboardingStep.MANUAL);

        const friendlyMessage = err.message?.includes('Please upgrade to v3 APIs')
          ? 'LinkedIn import is temporarily unavailable because the Composio integration is still using a deprecated API. You can continue by entering your profile details manually below.'
          : `LinkedIn import failed. You can continue by entering your profile details manually below.${err.message ? ` (${err.message})` : ''}`;

        setError(friendlyMessage);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session, isManual]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const tagsArray = (profileData.skills || []).map(s => typeof s === 'string' ? s : (s.name || s.title || '')).filter(Boolean);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          headline: profileData.headline,
          bio: profileData.bio,
          skills: tagsArray,
          expertise_tags: tagsArray,
          experience_raw: profileData.experience, 
          setup_completed: true
        })
        .eq('id', session.user.id);

      if (error) throw error;
      clearComposioImportStatus();
      clearOnboardingStep();
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. ' + err.message);
      setSaving(false);
    }
  };

  // --- CRUD Handlers ---

  const handleSaveHeadline = () => {
      setProfileData(prev => ({ ...prev, headline: tempHeadline }));
      setEditingHeadline(false);
  };
  
  const handleSaveBio = () => {
      setProfileData(prev => ({ ...prev, bio: tempBio }));
      setEditingBio(false);
  };

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
      return dateStr; // assuming YYYY-MM
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

  const handleCreateExp = () => {
      const newExp = { title: '', companyName: '', startDate: '', endDate: '', description: '' };
      setProfileData(prev => ({ ...prev, experience: [newExp, ...prev.experience] }));
      setEditingIndex(0);
      setExpFormData(newExp);
  };

  const handleSaveExp = () => {
      setProfileData(prev => {
          const newExp = [...prev.experience];
          newExp[editingIndex] = { ...expFormData };
          return { ...prev, experience: newExp };
      });
      setEditingIndex(null);
  };

  const handleDeleteExp = (idx) => {
      setProfileData(prev => ({
          ...prev, 
          experience: prev.experience.filter((_, i) => i !== idx)
      }));
      if (editingIndex === idx) setEditingIndex(null);
  };

  const handleAddSkill = (e) => {
      if (e.key === 'Enter' || e.type === 'click') {
          e.preventDefault();
          const tag = skillInput.trim();
          if (tag) {
              setProfileData(prev => {
                  const existingSkills = prev.skills.map(s => typeof s === 'string' ? s : (s.name || s.title || ''));
                  if (!existingSkills.includes(tag)) {
                      return { ...prev, skills: [...existingSkills, tag] };
                  }
                  return prev;
              });
          }
          setSkillInput('');
      }
  };

  const handleRemoveSkill = (tagToRemove) => {
      setProfileData(prev => ({
          ...prev,
          skills: prev.skills.filter(s => {
              const strVal = typeof s === 'string' ? s : (s.name || s.title || '');
              return strVal !== tagToRemove;
          })
      }));
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center font-body text-on-surface">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6 shadow-lg shadow-primary/20"></div>
        <h2 className="text-2xl font-headline font-extrabold tracking-tight mb-2">Analyzing LinkedIn Profile</h2>
        <p className="text-on-surface-variant font-medium">Extracting your professional journey via Composio...</p>
      </div>
    );
  }

  const { full_name, headline, bio, experience, skills } = profileData;
  const skillsList = skills?.map(s => typeof s === 'string' ? s : (s.name || s.title || '')).filter(Boolean) || [];

  return (
    <div className="bg-background min-h-screen py-16 px-6 font-body">
      <main className="max-w-4xl mx-auto space-y-8">
        
        <header className="text-center md:text-left mb-12">
            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4">
               {isEditableManualMode ? 'Manual Editor' : 'Ready For Review'}
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-3">
               Build Your Profile
            </h1>
            <p className="text-on-surface-variant text-lg">
              {isEditableManualMode ? 'Please enter your professional background details to proceed.' : 'We parsed your LinkedIn data. Please verify and refine your profile before joining the network.'}
            </p>
        </header>

        {error && (
          <section className="bg-error-container/20 border border-error/20 text-on-surface p-5 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-error-container/40 text-error rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">error</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg mb-1">LinkedIn Import Unavailable</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">{error}</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                
                {/* Basic Info */}
                <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-6 h-6" />
                        </div>
                        <div className="w-full pr-4">
                            <h2 className="text-xl font-headline font-bold text-on-surface mb-1">{full_name || 'Your Name'}</h2>
                            
                            {editingHeadline ? (
                                <div className="mt-2 flex gap-2">
                                     <input 
                                       type="text" 
                                       value={tempHeadline} 
                                       onChange={(e) => setTempHeadline(e.target.value)} 
                                       className="flex-grow bg-surface-container text-on-surface p-2 rounded-md text-sm border focus:border-primary focus:outline-none"
                                       placeholder="e.g. Senior Software Engineer at XYZ"
                                     />
                                     <button onClick={handleSaveHeadline} className="p-2 bg-primary text-white rounded-md hover:bg-primary/90"><Save className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group">
                                     <p className="text-primary font-medium">{headline || 'Enter your headline'}</p>
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
                                    <button onClick={handleSaveBio} className="px-3 py-1.5 bg-primary text-white rounded-md font-bold shadow-sm">Save</button>
                                </div>
                            </div>
                       ) : (
                           <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                               {bio || 'No summary provided.'}
                           </p>
                       )}
                    </div>
                </section>

                {/* Experience */}
                <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
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
                                                <button onClick={handleSaveExp} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm">Save Role</button>
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

                <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
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
                            className="w-full max-w-[200px] bg-transparent border-0 border-b border-outline-variant/50 px-2 py-1.5 text-on-surface font-medium focus:ring-0 focus:border-primary outline-none placeholder:text-on-surface-variant/50 text-sm" 
                            placeholder="Add Skill..."
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleAddSkill}
                        />
                        <button 
                            onClick={handleAddSkill}
                            className="inline-flex items-center justify-center bg-primary/5 text-primary w-8 h-8 rounded-full hover:bg-primary/10 transition-colors focus:outline-none"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </section>

            </div>

            <div className="space-y-8">
                {/* Final Action */}
                <section className="bg-primary p-8 rounded-2xl shadow-xl shadow-primary/20 text-on-primary sticky top-8">
                     <h3 className="font-headline font-bold text-xl mb-2">Final Step</h3>
                     <p className="text-sm mb-6 text-on-primary/80 leading-relaxed">
                         If this information correctly reflects your professional background, finalize to complete your setup and join the network.
                     </p>
                     <button
                        onClick={handleConfirm}
                        disabled={saving || editingHeadline || editingBio || editingIndex !== null}
                        className="w-full py-4 bg-surface-container-lowest text-primary hover:bg-surface disabled:opacity-50 text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2"
                     >
                         {saving ? 'Saving Profile...' : 'Finalize Profile'}
                         {!saving && <CheckCircle2 className="w-5 h-5"/>}
                     </button>
                </section>
            </div>
        </div>
      </main>
    </div>
  );
}
