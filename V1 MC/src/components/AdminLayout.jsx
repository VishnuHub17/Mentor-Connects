import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
export default function AdminLayout({ children, session, profile }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen py-8 px-6 w-64 border-r border-outline-variant/10 bg-[#efeee6] dark:bg-stone-900 z-40 flex flex-col font-headline">
        <div className="mb-12">
          <h1 className="text-xl font-bold tracking-tight text-on-surface">The Ivory Gallery</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#525f74]/60 font-bold mt-1 shadow-sm">Platform Admin</p>
        </div>
        
        <ul className="flex-1 w-full flex flex-col gap-2">
          <li className="flex items-center cursor-pointer w-full whitespace-nowrap text-sm list-none">
            <NavLink 
              to="/admin/dashboard" 
              className={({ isActive }) => 
                `flex size-full items-center gap-4 px-4 py-3 group font-semibold rounded-full transition-all ease-linear ${
                  isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md" 
                  : "text-gray-700 hover:bg-purple-100 hover:shadow-inner"
                }`
              }
            >
              <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M14,10V22H4a2,2,0,0,1-2-2V10Z" />
                <path d="M22,10V20a2,2,0,0,1-2,2H16V10Z" />
                <path d="M22,4V8H2V4A2,2,0,0,1,4,2H20A2,2,0,0,1,22,4Z" />
              </svg>
              Dashboard
            </NavLink>
          </li>
          
          <li className="flex items-center cursor-pointer w-full whitespace-nowrap text-sm list-none">
            <NavLink 
              to="/admin/mentors" 
              className={({ isActive }) => 
                `flex size-full items-center gap-4 px-4 py-3 group font-semibold rounded-full transition-all ease-linear ${
                  isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md" 
                  : "text-gray-700 hover:bg-purple-100 hover:shadow-inner"
                }`
              }
            >
              <span className="material-symbols-outlined size-5 flex items-center justify-center transition-transform group-active:scale-95 text-[20px]">supervisor_account</span>
              Mentor Management
            </NavLink>
          </li>

          <li className="flex items-center cursor-pointer w-full whitespace-nowrap text-sm list-none">
            <NavLink 
              to="/admin/webinars" 
              className={({ isActive }) => 
                `flex size-full items-center gap-4 px-4 py-3 group font-semibold rounded-full transition-all ease-linear ${
                  isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md" 
                  : "text-gray-700 hover:bg-purple-100 hover:shadow-inner"
                }`
              }
            >
              <span className="material-symbols-outlined size-5 flex items-center justify-center transition-transform group-active:scale-95 text-[20px]">video_library</span>
              Webinar Management
            </NavLink>
          </li>

          <li className="flex items-center cursor-pointer w-full whitespace-nowrap text-sm list-none">
            <NavLink 
              to="/admin/calendar" 
              className={({ isActive }) => 
                `flex size-full items-center gap-4 px-4 py-3 group font-semibold rounded-full transition-all ease-linear ${
                  isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md" 
                  : "text-gray-700 hover:bg-purple-100 hover:shadow-inner"
                }`
              }
            >
              <span className="material-symbols-outlined size-5 flex items-center justify-center transition-transform group-active:scale-95 text-[20px]">event_note</span>
              Global Calendar
            </NavLink>
          </li>

          <li className="flex items-center cursor-pointer w-full whitespace-nowrap text-sm list-none">
            <NavLink 
              to="/admin/api-keys" 
              className={({ isActive }) => 
                `flex size-full items-center gap-4 px-4 py-3 group font-semibold rounded-full transition-all ease-linear ${
                  isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md" 
                  : "text-gray-700 hover:bg-purple-100 hover:shadow-inner"
                }`
              }
            >
              <span className="material-symbols-outlined size-5 flex items-center justify-center transition-transform group-active:scale-95 text-[20px]">api</span>
              Integrations
            </NavLink>
          </li>
        </ul>

        <div className="mt-auto pt-8 border-t border-outline-variant/10 flex flex-col gap-4">
          <ul className="w-full flex flex-col gap-2">
            <li className="flex items-center cursor-pointer w-full whitespace-nowrap text-sm list-none">
              <button onClick={() => navigate('/admin/settings')} className="flex size-full items-center gap-4 px-4 py-3 group font-semibold rounded-full transition-all ease-linear text-gray-700 hover:bg-purple-100 hover:shadow-inner w-full text-left">
                <span className="material-symbols-outlined size-5 flex items-center justify-center text-[20px]">settings</span>
                Settings
              </button>
            </li>
          </ul>
          
          <div onClick={() => navigate('/admin/settings')} className="flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
            <img alt="Admin" className="w-10 h-10 rounded-full object-cover grayscale" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Admin')}&background=31332C&color=fff`}/>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">{profile?.full_name || 'Administrator'}</p>
              <p className="text-[10px] text-on-surface-variant truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen relative">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-background/80 backdrop-blur-md flex justify-between items-center px-8 z-40 font-body">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-on-surface-variant/40" placeholder="Search platform analytics..." type="text"/>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-primary hover:text-on-surface transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button onClick={() => navigate('/admin/settings')} className="text-primary hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button onClick={() => navigate('/admin/settings')} className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20 hover:scale-105 transition-transform">
              <img alt="Admin profile" className="w-full h-full object-cover grayscale" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Admin')}&background=31332C&color=fff`} />
            </button>
            <div className="h-6 w-[1px] bg-outline-variant/20"></div>
            <button className="bg-primary text-on-primary px-6 py-2 rounded-md font-semibold flex items-center gap-2 hover:bg-primary-dim transition-all shadow-sm active:scale-95">
              <span className="material-symbols-outlined text-sm">person_add</span>
              Invite Mentee
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="pt-24 px-12 pb-12 w-full max-w-7xl mx-auto space-y-12">
          {children}
        </div>
      </main>
    </div>
  );
}
