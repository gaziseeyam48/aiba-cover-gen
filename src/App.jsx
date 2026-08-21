import { Routes, Route, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { WizardProvider } from './context/WizardContext';
import { supabase } from './supabaseClient';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const SemesterSetup = lazy(() => import('./pages/SemesterSetup'));
const Generator = lazy(() => import('./pages/Generator'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GuestCourseSetup = lazy(() => import('./pages/GuestCourseSetup'));
const SelectionHub = lazy(() => import('./pages/SelectionHub'));

// --- COVER-GENERATOR AUTH GUARD ---
const CoverGeneratorGuard = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/cover-generator/dashboard', { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return null;
  return <SelectionHub />;
};

function App() {
  return (
    <WizardProvider>
      <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-emerald-700 font-medium">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cover-generator" element={<CoverGeneratorGuard />} />
          <Route path="/cover-generator/instant" element={<Generator />} />
          <Route path="/cover-generator/setup-courses" element={<GuestCourseSetup />} />
          <Route path="/cover-generator/app" element={<Generator />} />
          <Route path="/cover-generator/login" element={<Login />} />
          <Route path="/cover-generator/sign-up" element={<SignUp />} />
          <Route path="/cover-generator/dashboard" element={<Dashboard />} />
          <Route path="/cover-generator/setup-profile" element={<ProfileSetup />} />
          <Route path="/cover-generator/setup-semester" element={<SemesterSetup />} />
          <Route path="/cover-generator/semester/new" element={<SemesterSetup />} />
          <Route path="/cover-generator/semester/manage/:semesterId" element={<SemesterSetup />} />
        </Routes>
      </Suspense>
    </WizardProvider>
  );
}

export default App;
