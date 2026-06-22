import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Welcome() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="bg-background font-body text-on-surface antialiased min-h-screen">
      {/* TopNavBar */}
      <header className="w-full top-0 left-0 sticky z-50 bg-background/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-6 max-w-screen-2xl mx-auto">
          <div className="text-lg font-bold tracking-tighter text-[#31332c] font-headline">The Ivory Gallery</div>
          <div className="flex items-center gap-6">
            <button onClick={handleLogout} className="text-xs uppercase tracking-widest text-primary font-medium cursor-pointer">Log Out</button>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden">
              <img alt="Support avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu4BTJ2L38KBzVG6av237veHHNIJWyaQY-WYKevbjH64NCB7EGWUzN2BTMV9EVsJ4FjY77dSHmPpO779fS-cUSoLWIm6I7UaQ_DBJOatJTOwQW1qykkeorjhxV3KYSB8kKmKKoQi-QChmpyCZTF2aMxDzUipLfppogLerHvpFhi17Qv3lsFvR5tmBOci30kJAPsdykfX3p3OAgoYStQZHwiCDDaXOyFPE7QE-dv9iJ07BsWMvvZGPkUeczhfVIIZQ6HfQfvj8GIo5M"/>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-140px)] flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-screen-2xl mx-auto px-8 py-12 md:py-20 flex flex-col items-center text-center">
          <div className="relative w-full max-w-5xl mb-16 group">
            <div className="aspect-[21/9] w-full overflow-hidden rounded-xl bg-surface-container shadow-2xl">
              <img alt="Collaborative Studio" className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIErb52n5cAB0eSDrQ9BUs3Uyu7E9sU_bcXNeZ0HLk7vGnH6blyeuOg0d-85d0fE4dzVfEwLvMUtc1GlXJWA1XDQJzJzx9ixrzKyDniLQQb8VIkRY_QDQiDL2CrDnWpISuG5UPh27aGtHTfudwvwnvgIOBmFDQAPXMpnsKXPrWfJyUqolecrwB35DzLDULGsL0JnhWGdLwApdJPFERfSKpvQ35Y3PwFpeprASjEQtlSJV_yxeHppi5e6mJXB_YCH5UqOd37ePlHTk_"/>
            </div>
            <div className="absolute -bottom-8 -right-8 hidden md:block w-48 h-48 bg-surface-container-low border-[12px] border-background rounded-xl shadow-lg flex items-center justify-center p-6">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
            </div>
          </div>

          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-[1.1]">
              Welcome to Atheneum: <span className="text-primary italic font-medium">Elevate the Next Generation</span> of Talent
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl mx-auto">
              Your expertise is the bridge between aspiration and achievement. Start your journey as a mentor and impact careers globally.
            </p>
            <div className="pt-6">
              <button 
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  await supabase.from('profiles').update({ setup_completed: true }).eq('id', user.id);
                  window.location.reload(); // Force app to remount and handle routing to /dashboard
                }} 
                className="bg-gradient-to-br from-[#525f74] to-[#465367] text-on-primary px-10 py-4 rounded-md font-semibold text-lg shadow-xl hover:shadow-2xl hover:translate-y-[2px] transition-all duration-300 active:opacity-70"
              >
                Complete Onboarding
              </button>
            </div>
          </div>
        </section>

        {/* Platform Introduction Grid */}
        <section className="w-full max-w-screen-2xl mx-auto px-8 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7 bg-surface-container-lowest p-10 rounded-xl flex flex-col justify-between min-h-[320px]">
              <div className="space-y-4">
                <span className="material-symbols-outlined text-primary text-3xl">school</span>
                <h3 className="text-2xl font-bold font-headline">The Mentorship Philosophy</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  At Atheneum, we believe knowledge is a shared legacy. Our platform is designed to facilitate high-impact, one-on-one sessions that move beyond theory into professional mastery.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-grow bg-outline-variant/20"></div>
                <span className="text-xs uppercase tracking-widest text-outline">Shared Excellence</span>
              </div>
            </div>

            <div className="md:col-span-5 bg-surface-container-low p-10 rounded-xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="material-symbols-outlined text-primary text-3xl">public</span>
                <h3 className="text-2xl font-bold font-headline">Global Impact</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Connect with emerging talent from 45+ countries, bringing your industry insights to a diverse, global workforce.
                </p>
              </div>
            </div>

            <div className="md:col-span-5 bg-surface-container p-10 rounded-xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="material-symbols-outlined text-primary text-3xl">auto_graph</span>
                <h3 className="text-2xl font-bold font-headline">Structured Growth</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Access curated tools and session frameworks designed to maximize the value of every minute you invest.
                </p>
              </div>
            </div>

            <div className="md:col-span-7 bg-surface-container-lowest p-10 rounded-xl flex flex-col justify-between min-h-[320px]">
              <div className="space-y-4">
                <span className="material-symbols-outlined text-primary text-3xl">history_edu</span>
                <h3 className="text-2xl font-bold font-headline">Legacy Building</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Your career has been a series of milestones. Use this space to archive your experiences and distill them into actionable wisdom for others.
                </p>
              </div>
              <div className="mt-8">
                <div className="flex -space-x-4">
                  <div className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
                    <img alt="Mentor A" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkUFNnKomhYFafX0CVD1TQeU6jMx965SL8hD9zwqhntOPvevH8ibQ1UgnrrVhVJEaLUxLGVQuJG7PGvqsWhsyksDBnSgJ6Ya7_eIAQu86q2e8xzpdBpcoXGlYjvbzBB9AXMzOhlYJjLMTej-ZbZAjmWlunPCsAiSI9OARma5jrF99b-yy7vaEGpiCq7ahzQw1UjNtn90297KkNBRvg9tATuNkWVLbJjDrcc6jvAJJtKTdGB_MWB5KS6200qR0e8mcklytNZvJ2nFg5"/>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                    +2k
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 bg-background border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-20 max-w-screen-2xl mx-auto gap-8">
          <p className="font-body text-xs uppercase tracking-widest text-on-surface/60">
            © 2024 The Ivory Gallery. Professional Mentorship Excellence.
          </p>
        </div>
      </footer>
    </div>
  );
}
