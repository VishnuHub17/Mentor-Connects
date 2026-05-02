import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';

import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Webinars from './pages/Webinars';
import WebinarDetails from './pages/WebinarDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import MentorsList from './pages/admin/MentorsList';
import MentorDetails from './pages/admin/MentorDetails';
import AdminWebinars from './pages/admin/AdminWebinars';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminApiKeys from './pages/admin/AdminApiKeys';
import AdminSettings from './pages/admin/AdminSettings';
import SSO from './pages/SSO';

import ProfileSetup from './pages/ProfileSetup';
import MentorSettings from './pages/MentorSettings';
import CompleteProfile from './pages/CompleteProfile';
import ProfilePreview from './pages/ProfilePreview';
import ComposioSuccess from './pages/ComposioSuccess';
import OnboardingResume from './pages/OnboardingResume';

const ProtectedRoute = ({ session, profile, children, allowedRoles, requireSetupCompleted }) => {
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div>Loading profile...</div>;

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  if (requireSetupCompleted === true && (!profile.setup_completed || !profile.experience_raw) && profile.role !== 'admin') {
    return <Navigate to="/setup/onboard" replace />;
  }

  if (requireSetupCompleted === false && profile.setup_completed && profile.experience_raw && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const getPostAuthRedirect = (profile) => {
  if (!profile) return '/setup/resume';
  if (profile.role === 'admin') return '/admin/dashboard';
  if (profile.role === 'mentor' && (!profile.setup_completed || !profile.experience_raw)) return '/setup/resume';
  return '/dashboard';
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId, sessionObj = null) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // If the profile does not exist but a session does, the user was likely deleted by an admin.
      // We must forcefully sign them out to clear the stale local storage token.
      if (error && error.code === 'PGRST116') { // PGRST116 means zero rows returned
         console.warn("Profile not found for active session. Forcing logout of stale session.");
         await supabase.auth.signOut();
         setSession(null);
         setProfile(null);
         return;
      }

      let finalData = data;

      // DATA PIPELINE & DATABASE SYNC
      if (data && sessionObj) {
        const provider = sessionObj.user?.app_metadata?.provider;
        const isLinkedin = provider === 'linkedin' || provider === 'linkedin_oidc';
        
        let shouldUpdate = false;
        let updatePayload = {};

        if (isLinkedin && data.auth_provider !== 'linkedin') {
          updatePayload.auth_provider = 'linkedin';
          shouldUpdate = true;
        }

        // Just configure missing columns if New
        if (isLinkedin && !data.setup_completed && !data.experience_raw) {
          updatePayload.experience_raw = {}; // Ready to receive JSON data
          shouldUpdate = true;
          console.log("Configured initial placeholders for LinkedIn account");
        }

        if (shouldUpdate) {
          await supabase.from('profiles').update(updatePayload).eq('id', userId);
          finalData = { ...data, ...updatePayload };
        }
      }

      setProfile(finalData);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setSession(session);
        setLoading(true);
        fetchProfile(session?.user?.id, session).finally(() => setLoading(false));
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
      // Explicitly ignoring TOKEN_REFRESHED, USER_UPDATED, etc.
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      {loading ? (
        <div className="min-h-screen bg-background flex items-center justify-center font-headline text-on-surface">Loading The Ivory Gallery...</div>
      ) : (
      <Routes>
        <Route 
          path="/" 
          element={!session ? <Navigate to="/login" /> : <Navigate to={
            getPostAuthRedirect(profile)
          } />} 
        />
        
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to={
            getPostAuthRedirect(profile)
          } />} 
        />
        
        <Route 
          path="/signup" 
          element={!session ? <Signup /> : <Navigate to={
            getPostAuthRedirect(profile)
          } />} 
        />

        <Route 
          path="/sso" 
          element={<SSO />} 
        />
        
        {/* We keep welcome for legacy or other purposes if needed, but the main flow uses onboard */}
        <Route 
          path="/welcome" 
          element={
            <ProtectedRoute session={session} profile={profile} requireSetupCompleted={false}>
              <Welcome />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/setup/resume" 
          element={
            <ProtectedRoute session={session} profile={profile} requireSetupCompleted={false}>
               <OnboardingResume profile={profile} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/setup/onboard" 
          element={
            <ProtectedRoute session={session} profile={profile} requireSetupCompleted={false}>
               <CompleteProfile session={session} profile={profile} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/setup/preview" 
          element={
            <ProtectedRoute session={session} profile={profile} requireSetupCompleted={false}>
               <ProfilePreview session={session} profile={profile} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/setup/profile" 
          element={
            <ProtectedRoute session={session} profile={profile} requireSetupCompleted={false}>
              <ProfileSetup session={session} profile={profile} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/setup/composio-success" 
          element={<ComposioSuccess />} 
        />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['mentor', 'user']} requireSetupCompleted={true}>
              <Layout session={session} profile={profile}>
                <Dashboard session={session} profile={profile} />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/webinars" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['mentor']} requireSetupCompleted={true}>
              <Layout session={session} profile={profile}>
                <Webinars session={session} profile={profile} />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/webinars/:id" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['mentor', 'user']} requireSetupCompleted={true}>
              <Layout session={session} profile={profile}>
                <WebinarDetails session={session} profile={profile} />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute session={session} profile={profile} requireSetupCompleted={true}>
              <Layout session={session} profile={profile}>
                <MentorSettings session={session} profile={profile} />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session}>
                <AdminDashboard session={session} />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session} profile={profile}>
                <AdminSettings session={session} profile={profile} />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/mentors" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session} profile={profile}>
                <MentorsList />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/mentors/:id" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session} profile={profile}>
                <MentorDetails />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/webinars" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session} profile={profile}>
                <AdminWebinars />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/webinars/:id" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session} profile={profile}>
                <WebinarDetails session={session} profile={profile} />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/calendar" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session} profile={profile}>
                <AdminCalendar />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/api-keys" 
          element={
            <ProtectedRoute session={session} profile={profile} allowedRoles={['admin']} requireSetupCompleted={false}>
              <AdminLayout session={session} profile={profile}>
                <AdminApiKeys />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
      </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
