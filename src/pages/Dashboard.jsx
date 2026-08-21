import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


// --- STEP 4: RETURNING USER DASHBOARD ---
const Dashboard = () => {
  const navigate = useNavigate();
  const { setStudentProfile, setSemesterTitle, setSelectedCourses, setEditingSemesterId } = useContext(WizardContext);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', studentId: '', batch: '', section: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showNewSemesterWarning, setShowNewSemesterWarning] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Guard against React StrictMode double-invocation and concurrent mounts
  const hasInitialized = useRef(false);

  const handleOpenEditProfile = (forceNew = false) => {
    setIsNewProfile(forceNew);
    setEditForm({
      fullName: userProfile?.full_name || '',
      studentId: userProfile?.student_id || '',
      batch: userProfile?.batch || '',
      section: userProfile?.section || '',
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim() || !editForm.batch.trim()) {
      alert('Full Name and Batch are required.');
      return;
    }
    if (isNewProfile && !editForm.studentId.trim()) {
      alert('Student ID is required to complete your profile.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const updatePayload = {
        full_name: editForm.fullName.trim(),
        batch: editForm.batch.trim(),
        section: editForm.section.trim(),
      };
      // Allow writing student_id only when it was previously empty
      if (isNewProfile || !userProfile?.student_id) {
        updatePayload.student_id = editForm.studentId.trim();
      }
      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', session.user.id);
      if (error) throw error;

      const updatedProfile = { ...userProfile, ...updatePayload };
      setUserProfile(updatedProfile);
      setStudentProfile({
        fullName: updatedProfile.full_name,
        studentId: updatedProfile.student_id || '',
        batch: updatedProfile.batch,
        section: updatedProfile.section || '',
      });
      setIsNewProfile(false);
      setShowEditProfile(false);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      // Prevent React StrictMode double-invocation from issuing duplicate writes
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/cover-generator/login');

      const userId = session.user.id;

      // ── Step 1: Resolve pending OAuth profile data from localStorage ─────
      const pendingRaw = localStorage.getItem('pending_student_profile');
      let pendingProfile = null;
      if (pendingRaw) {
        try { pendingProfile = JSON.parse(pendingRaw); } catch (_) { }
        // Clean up immediately — before any async DB work — so it never leaks
        localStorage.removeItem('pending_student_profile');
      }

      // ── Step 2: Fetch existing profile (may not exist for new Google users)
      const { data: existingProfile } = await supabase
        .from('profiles').select('*').eq('id', userId).maybeSingle();

      let resolvedProfile = existingProfile;

      if (!existingProfile) {
        // ── Step 3: First-time login — upsert profile row ─────────────────
        // Using upsert (not insert) so a duplicate-key race condition between
        // StrictMode double-mounts or concurrent tab loads never throws.
        const { data: upserted, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name:
              pendingProfile?.fullName ||
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              '',
            student_id: pendingProfile?.studentId || '',
            batch: pendingProfile?.batch || '',
            section: pendingProfile?.section || '',
          }, { onConflict: 'id' })
          .select().single();
        if (upsertError) {
          alert('Failed to initialise your profile: ' + upsertError.message);
          setLoading(false);
          return;
        }
        resolvedProfile = upserted;
      } else if (pendingProfile) {
        // ── Step 4: Returning user — apply pending overrides if present ────
        const { error: updateError } = await supabase.from('profiles').update({
          full_name: pendingProfile.fullName || existingProfile.full_name,
          student_id: pendingProfile.studentId || existingProfile.student_id,
          batch: pendingProfile.batch || existingProfile.batch,
          section: pendingProfile.section || existingProfile.section,
        }).eq('id', userId);
        if (!updateError) {
          resolvedProfile = {
            ...existingProfile,
            full_name: pendingProfile.fullName || existingProfile.full_name,
            student_id: pendingProfile.studentId || existingProfile.student_id,
            batch: pendingProfile.batch || existingProfile.batch,
            section: pendingProfile.section || existingProfile.section,
          };
        }
      }

      // ── Step 5: Fetch semesters ───────────────────────────────────────────
      const { data: userSemesters } = await supabase
        .from('semesters').select('*').eq('student_id', userId)
        .order('created_at', { ascending: false });

      // ── Step 6: Auto-create default semester for new users ────────────────
      let resolvedSemesters = userSemesters || [];
      if (resolvedSemesters.length === 0) {
        const { data: defaultSemester } = await supabase
          .from('semesters')
          .insert({ student_id: userId, title: 'Current Semester' })
          .select().single();
        if (defaultSemester) resolvedSemesters = [defaultSemester];
      }

      setUserProfile(resolvedProfile);
      setSemesters(resolvedSemesters);
      setLoading(false);

      // ── Step 7: Auto-open profile modal if student details are incomplete──
      const needsOnboarding =
        !resolvedProfile?.student_id?.trim() || !resolvedProfile?.batch?.trim();
      if (needsOnboarding) {
        setIsNewProfile(true);
        setEditForm({
          fullName: resolvedProfile?.full_name || '',
          studentId: resolvedProfile?.student_id || '',
          batch: resolvedProfile?.batch || '',
          section: resolvedProfile?.section || '',
        });
        setShowEditProfile(true);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setStudentProfile({ fullName: '', studentId: '', batch: '', section: '' });
    setSemesterTitle('');
    setSelectedCourses([]);
    setEditingSemesterId(null);
    window.location.assign('/cover-generator');
  };

  const handleOpenSemester = (semester) => {
    navigate(`/cover-generator/semester/manage/${semester.id}`);
  };

  const confirmNewSemester = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Delete existing semesters and related courses
    await supabase.from('semesters').delete().eq('student_id', session.user.id);

    setShowNewSemesterWarning(false);
    setStudentProfile({ fullName: userProfile.full_name, studentId: userProfile.student_id, batch: userProfile.batch, section: userProfile.section });
    setSemesterTitle('');
    setSelectedCourses([]);
    setEditingSemesterId(null);
    navigate('/cover-generator/semester/new');
  };

  const handleNewSemester = () => {
    if (semesters.length > 0) {
      setShowNewSemesterWarning(true);
    } else {
      confirmNewSemester();
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">Loading workspace…</div>;

  return (
    <div className="flex flex-col relative min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <AppHeader
        maxWidth="max-w-6xl"
        rightContent={
          <button
            onClick={handleLogout}
            className="group flex items-center justify-center min-h-[42px] gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 active:scale-95"
          >
            <svg className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Log out</span>
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
        <div className="mb-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-700">Your workspace</p>
          <h1 className="text-3xl font-black tracking-tight">Welcome back, {userProfile?.full_name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-sm text-slate-500">Student ID {userProfile?.student_id} <span className="mx-2 text-slate-300">/</span> {userProfile?.batch} {userProfile?.section && <><span className="mx-2 text-slate-300">/</span>Section {userProfile.section}</>}</p>
            <button
              onClick={handleOpenEditProfile}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 shadow-sm"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
              Edit Profile
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Semesters</h2>
            <p className="mt-1 text-sm text-slate-500">Open a saved setup or create a new one.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={handleNewSemester} className="rounded-lg min-h-[44px] px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-200 hover:text-slate-900">New semester</button>
            <button onClick={() => navigate('/cover-generator/app')} className="rounded-lg min-h-[44px] bg-emerald-700 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-800 shadow-sm">Generate cover</button>
          </div>
        </div>

        {semesters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h3 className="font-bold text-slate-700">No semesters yet</h3>
            <p className="mt-2 text-sm text-slate-500">Create a semester to save courses and faculty for reuse.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {semesters.map(s => (
              <div key={s.id} onClick={() => handleOpenSemester(s)} className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-md">
                <div className="mb-7 flex items-center justify-between">
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">Semester</span>
                  <span className="text-slate-300 transition group-hover:text-emerald-700 group-hover:translate-x-1">→</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">Manage courses and faculty</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* EDIT PROFILE MODAL */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-start sm:items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-5 gap-2">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  {isNewProfile ? '👋 Complete Your Profile' : 'Edit Profile'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isNewProfile
                    ? 'Enter your student details to finish setting up your account.'
                    : 'Student ID cannot be changed.'}
                </p>
              </div>
              {/* Only allow closing if not in forced onboarding mode */}
              {!isNewProfile && (
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 shrink-0"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            <div className="px-6 py-6 space-y-4">
              {isNewProfile ? (
                /* Onboarding mode — Student ID is editable */
                <InputField
                  label="Student ID"
                  name="studentId"
                  value={editForm.studentId}
                  onChange={(e) => setEditForm(f => ({ ...f, studentId: e.target.value }))}
                  placeholder="e.g. 2402010"
                  className="mb-0"
                />
              ) : (
                /* Normal edit mode — Student ID is locked */
                <div className="flex flex-col">
                  <label className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Student ID</label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 select-none">{userProfile?.student_id}</div>
                </div>
              )}
              <InputField
                label="Full Name"
                name="fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="e.g. Gazi Shahroar"
                className="mb-0"
              />
              <InputField
                label="Batch"
                name="batch"
                value={editForm.batch}
                onChange={(e) => setEditForm(f => ({ ...f, batch: e.target.value }))}
                placeholder="e.g. BBA-15"
                className="mb-0"
              />
              <InputField
                label="Section (optional)"
                name="section"
                value={editForm.section}
                onChange={(e) => setEditForm(f => ({ ...f, section: e.target.value }))}
                placeholder="e.g. A"
                className="mb-0"
              />
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
              {!isNewProfile && (
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 min-h-[44px] rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-[2] min-h-[44px] rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {isSavingProfile ? 'Saving…' : isNewProfile ? 'Complete Setup' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SEMESTER WARNING MODAL */}
      {showNewSemesterWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="bg-amber-50 px-5 sm:px-6 py-6 text-center border-b border-amber-100 relative">
              <button
                onClick={() => setShowNewSemesterWarning(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-700 hover:text-amber-900 transition-colors p-1"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Replace existing semester?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Creating a new semester will <strong className="text-amber-700">delete your current semester</strong> and all its saved courses. The new one will become your current semester.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 px-5 sm:px-6 py-5 bg-slate-50">
              <button
                onClick={() => setShowNewSemesterWarning(false)}
                className="w-full sm:w-1/2 min-h-[44px] rounded-lg px-4 py-3 text-sm font-bold text-slate-600 border border-slate-200 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewSemester}
                className="w-full sm:w-1/2 min-h-[44px] rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold tracking-wide uppercase text-white shadow-md transition hover:bg-amber-700"
              >
                Yes, replace it
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};



export default Dashboard;
