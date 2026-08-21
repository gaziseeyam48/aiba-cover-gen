import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


// --- ACCOUNT CREATION ---
const SignUp = () => {
  const navigate = useNavigate();
  const { studentProfile, selectedCourses } = useContext(WizardContext);
  const [fullName, setFullName] = useState(studentProfile.fullName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!email || !password) return alert('Please enter an email address and password.');

    setIsSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const userId = authData.user.id;
      const resolvedName = studentProfile.fullName || fullName || email.split('@')[0];

      // Always create/upsert profile before semester insert to satisfy FK constraint
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: resolvedName,
        student_id: studentProfile.studentId || '',
        batch: studentProfile.batch || '',
        section: studentProfile.section || '',
      }, { onConflict: 'id' });
      if (profileError) throw profileError;

      if (selectedCourses.length > 0) {
        const { data: semester, error: semesterError } = await supabase.from('semesters')
          .insert({ student_id: userId, title: 'Current Semester' }).select().single();
        if (semesterError) throw semesterError;

        const coursesToSave = selectedCourses.map((selection) => ({
          semester_id: semester.id,
          course_id: selection.course?.isCustom ? null : (selection.course?.id || selection.course_id),
          custom_course_code: selection.course?.isCustom ? selection.course?.course_code : null,
          custom_course_name: selection.course?.isCustom ? selection.course?.course_name : null,
          faculty_id: selection.faculty?.id || selection.faculty_id
        }));

        const { error: coursesError } = await supabase.from('semester_courses').insert(coursesToSave);
        if (coursesError) throw coursesError;
      }

      trackEvent('user_signup', { method: 'email' });
      navigate('/cover-generator/dashboard');
    } catch (error) {
      alert('Unable to create and save your account: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Persist any filled-in student details to localStorage before the OAuth
  // redirect so Dashboard can pick them up and upsert into the profiles table.
  const handleGoogleSignUp = async (credentialResponse) => {
    const hasDetails = Boolean(studentProfile.fullName || studentProfile.studentId || studentProfile.batch);
    if (hasDetails) {
      localStorage.setItem('pending_student_profile', JSON.stringify({
        fullName: studentProfile.fullName,
        studentId: studentProfile.studentId,
        batch: studentProfile.batch,
        section: studentProfile.section || '',
      }));
    }
    setIsGoogleLoading(true);
    trackEvent('user_signup', { method: 'google' });
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });
      if (error) throw error;

      const userId = data.user.id;

      // Guarantee profile row exists before semesters insert to satisfy FK constraint
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name:
          studentProfile.fullName ||
          data.user.user_metadata?.full_name ||
          data.user.email?.split('@')[0] ||
          '',
        student_id: studentProfile.studentId || '',
        batch: studentProfile.batch || '',
        section: studentProfile.section || ''
      }, { onConflict: 'id' });
      if (profileError) throw profileError;

      if (selectedCourses.length > 0) {
        const { data: semester, error: semesterError } = await supabase.from('semesters')
          .insert({ student_id: userId, title: 'Current Semester' }).select().single();
        if (semesterError) throw semesterError;

        const coursesToSave = selectedCourses.map((selection) => ({
          semester_id: semester.id,
          course_id: selection.course?.isCustom ? null : (selection.course?.id || selection.course_id),
          custom_course_code: selection.course?.isCustom ? selection.course?.course_code : null,
          custom_course_name: selection.course?.isCustom ? selection.course?.course_name : null,
          faculty_id: selection.faculty?.id || selection.faculty_id
        }));

        const { error: coursesError } = await supabase.from('semester_courses').insert(coursesToSave);
        if (coursesError) throw coursesError;
      }

      navigate('/cover-generator/dashboard');
    } catch (error) {
      localStorage.removeItem('pending_student_profile');
      alert('Google sign-up failed: ' + error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <AppHeader maxWidth="max-w-5xl" />
      <main className="mx-auto flex max-w-5xl justify-center px-4 pt-12 sm:pt-16 pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
          <h1 className="text-2xl font-black mb-1 tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-500 mb-6">Your profile and courses will be saved under "Current Semester."</p>

          {/* Google OAuth — fastest path */}
          <div className="mb-5 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSignUp}
              onError={() => {
                alert('Google sign-up failed.');
                setIsGoogleLoading(false);
              }}
              useOneTap
              theme="outline"
              size="large"
              text="signup_with"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or sign up with email</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <InputField
            label="Full Name"
            name="fullName"
            value={studentProfile.fullName || fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="e.g. Gazi Shahroar"
            readOnly={Boolean(studentProfile.fullName)}
          />
          <InputField label="Email Address" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" />
          <div className="flex flex-col mb-6">
            <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="border border-slate-300 rounded-lg p-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/cover-generator')} className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all">Back</button>
            <button onClick={handleCreateAccount} disabled={isSaving} className="flex-[2] min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
              {isSaving ? 'Creating account...' : 'Create & Save'}
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/cover-generator/login')} className="font-semibold text-emerald-700 hover:underline">Log in</button>
          </p>
        </div>
      </main>
    </div>
  );
};



export default SignUp;
