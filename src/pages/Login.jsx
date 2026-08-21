import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


// --- STEP 1: LOGIN ---
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return alert('Please enter your email and password.');
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      trackEvent('user_login', { method: 'email' });
      navigate('/cover-generator/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setIsGoogleLoading(true);
    trackEvent('user_login', { method: 'google' });
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });
      if (error) throw error;
      navigate('/cover-generator/dashboard');
    } catch (error) {
      alert('Google sign-in failed: ' + error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <AppHeader maxWidth="max-w-5xl" />
      <main className="mx-auto flex max-w-5xl justify-center px-4 pt-12 sm:pt-16 pb-20">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Log in to access your saved semesters.</p>

          {/* Google OAuth */}
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                alert('Google sign-in failed.');
                setIsGoogleLoading(false);
              }}
              useOneTap
              theme="outline"
              size="large"
              text="continue_with"
            />
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <InputField label="Email address" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" />
          <div className="mb-6 flex flex-col">
            <label className="mb-1 text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-lg border border-slate-300 px-3 py-3 min-h-[44px] text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <button onClick={handleLogin} disabled={isLoggingIn} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50">
            {isLoggingIn ? 'Logging in…' : 'Log in'}
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button onClick={() => navigate('/cover-generator/sign-up')} className="font-semibold text-emerald-700 hover:underline">Create one</button>
          </p>
        </div>
      </main>
    </div>
  );
};




export default Login;
