import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';

const ProfileSetup = ({ session, profile }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [designation, setDesignation] = useState('');
    const [bio, setBio] = useState('');
    const [company, setCompany] = useState('');
    const [yearsExperience, setYearsExperience] = useState(''); // Note: not in db but UI
    const [expertiseTags, setExpertiseTags] = useState([]);
    
    const [skillInput, setSkillInput] = useState('');

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            const tag = skillInput.trim();
            if (tag && !expertiseTags.includes(tag)) {
                setExpertiseTags([...expertiseTags, tag]);
            }
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (tagToRemove) => {
        setExpertiseTags(expertiseTags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    designation,
                    bio,
                    company,
                    expertise_tags: expertiseTags,
                    setup_completed: true
                })
                .eq('id', session.user.id);

            if (error) throw error;
            
            // Force reload to update profile state in App.jsx
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background min-h-screen flex flex-col items-center justify-center py-20 px-6 font-body">
            {/* Progress Indicator */}
            <div className="mb-12 flex items-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                <div className="w-12 h-1 rounded-full bg-primary"></div>
                <div className="w-2 h-2 rounded-full bg-primary/20"></div>
            </div>

            {/* Main Content Shell */}
            <main className="w-full max-w-2xl bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-[0_40px_100px_rgba(49,51,44,0.04)] relative">
                {/* Header Section */}
                <header className="mb-10 text-center md:text-left">
                    <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-3">
                        Build Your Career Profile
                    </h1>
                    <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
                        Help mentors and students understand your journey and areas of expertise.
                    </p>
                </header>

                {/* Form Section */}
                <form className="space-y-10" onSubmit={handleSubmit}>
                    {/* Current Status */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-on-surface uppercase tracking-wider">Current Role</label>
                            <input 
                                type="text"
                                className="w-full h-14 px-4 bg-surface-container-highest border-0 focus:ring-2 focus:ring-primary/20 rounded-lg text-on-surface placeholder:text-outline-variant transition-all outline-none" 
                                placeholder="e.g. Senior Product Designer"
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-on-surface uppercase tracking-wider">Skills & Expertise</label>
                            {expertiseTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {expertiseTags.map(tag => (
                                        <span key={tag} className="inline-flex items-center px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                                            {tag}
                                            <button 
                                                type="button" 
                                                className="ml-2 hover:text-error transition-colors flex items-center"
                                                onClick={() => handleRemoveSkill(tag)}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="relative">
                                <input 
                                    type="text"
                                    className="w-full h-14 px-4 bg-surface-container-highest border-0 focus:ring-2 focus:ring-primary/20 rounded-lg text-on-surface placeholder:text-outline-variant transition-all outline-none" 
                                    placeholder="Add a skill (Press Enter)"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={handleAddSkill}
                                />
                                <div 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant cursor-pointer hover:text-primary transition-colors flex items-center"
                                    onClick={handleAddSkill}
                                >
                                    <PlusCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-on-surface uppercase tracking-wider">About Me</label>
                            <textarea 
                                className="w-full min-h-[120px] p-4 bg-surface-container-highest border-0 focus:ring-2 focus:ring-primary/20 rounded-lg text-on-surface placeholder:text-outline-variant transition-all resize-none outline-none" 
                                placeholder="Briefly describe your background and unique perspective..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Professional History Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold font-headline text-on-surface">Professional History</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="group relative bg-surface-container-low p-6 rounded-lg transition-all hover:bg-surface-container-high border-l-4 border-primary/20 hover:border-primary">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Company Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface font-medium px-0 pb-1 outline-none" 
                                            placeholder="Company Name"
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Role</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-on-surface font-medium px-0 pb-1 outline-none" 
                                            placeholder="Role"
                                            value={designation}
                                            onChange={(e) => setDesignation(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Final Actions */}
                    <footer className="pt-8 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-surface-container-high">
                        <p className="text-xs text-on-surface-variant max-w-[240px] text-center md:text-left leading-relaxed">
                            By continuing, you agree to our terms regarding profile visibility in the gallery.
                        </p>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto px-10 py-4 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary-dim hover:translate-y-[-2px] active:translate-y-0 transition-all focus:outline-none"
                        >
                            {loading ? 'Saving...' : 'Save & Continue'}
                        </button>
                    </footer>
                </form>
            </main>

            {/* Visual Accents */}
            <aside className="fixed bottom-10 right-10 hidden xl:block opacity-40">
                <div className="flex flex-col space-y-4">
                    <div className="w-32 h-1 bg-primary/20 rounded-full"></div>
                    <div className="w-24 h-1 bg-primary/10 rounded-full ml-auto"></div>
                </div>
            </aside>

            <aside className="fixed top-10 left-10 hidden xl:block">
                <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold font-body text-on-surface uppercase tracking-widest">Verification Status</div>
                            <div className="text-sm font-body text-on-surface-variant">Profile Setup In Progress</div>
                        </div>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-2/3"></div>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default ProfileSetup;
