import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


// --- GUEST COURSE SETUP ---
// Unauthenticated users pick their courses/faculty before creating an account.
const GuestCourseSetup = () => {
  const navigate = useNavigate();
  const { setSelectedCourses, setSemesterTitle } = useContext(WizardContext);

  const [dbCourses, setDbCourses] = useState([]);
  const [dbFaculty, setDbFaculty] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [localCourses, setLocalCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState('');
  const [activeFacultyId, setActiveFacultyId] = useState('');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseName, setCustomCourseName] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('courses').select('*').order('course_code'),
      supabase.from('faculty').select('*').order('name'),
    ]).then(([{ data: courses }, { data: faculty }]) => {
      if (courses) setDbCourses(courses);
      if (faculty) setDbFaculty(faculty);
      setLoadingData(false);
    });
  }, []);

  const isCourseAssigned = (courseId) =>
    localCourses.some((item) => String(item.course?.id) === String(courseId));
  const isFacultyAssigned = (facultyId) =>
    localCourses.some((item) => String(item.faculty?.id) === String(facultyId));

  const handleAdd = () => {
    if (isFacultyAssigned(activeFacultyId)) return;
    const facultyObj = dbFaculty.find((f) => f.id === activeFacultyId);
    if (isCustomCourse) {
      if (!customCourseCode || !customCourseName || !activeFacultyId) return;
      setLocalCourses((prev) => [
        ...prev,
        { course: { id: null, course_code: customCourseCode.toUpperCase(), course_name: customCourseName, isCustom: true }, faculty: facultyObj },
      ]);
      setIsCustomCourse(false);
      setCustomCourseCode('');
      setCustomCourseName('');
    } else {
      if (!activeCourseId || !activeFacultyId || isCourseAssigned(activeCourseId)) return;
      const courseObj = dbCourses.find((c) => c.id === activeCourseId);
      setLocalCourses((prev) => [...prev, { course: courseObj, faculty: facultyObj }]);
      setActiveCourseId('');
    }
    setActiveFacultyId('');
  };

  const handleRemove = (idx) => setLocalCourses((prev) => prev.filter((_, i) => i !== idx));

  const handleContinue = () => {
    setSemesterTitle('Current Semester');
    setSelectedCourses(localCourses);
    navigate('/cover-generator/sign-up');
  };

  const canAdd =
    activeFacultyId &&
    !isFacultyAssigned(activeFacultyId) &&
    (isCustomCourse
      ? customCourseCode && customCourseName
      : activeCourseId && !isCourseAssigned(activeCourseId));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <AppHeader
        maxWidth="max-w-3xl"
        rightContent={
          <button
            onClick={() => navigate('/cover-generator')}
            className="flex items-center justify-center min-h-[42px] gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        }
      />

      <main className="mx-auto max-w-3xl px-3 sm:px-6 py-6 sm:py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Step 1 of 2 — Your Courses
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Add your active courses</h1>
          <p className="mt-2 text-slate-400">Select the courses you're taking this semester and assign their faculty. You can add as many as you need.</p>
        </div>

        {/* Course picker card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          <div className="px-5 py-6 sm:px-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-slate-200">Course &amp; Faculty</h2>
              {localCourses.length > 0 && (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  {localCourses.length} added
                </span>
              )}
            </div>

            {loadingData ? (
              <div className="space-y-3">
                <div className="h-11 w-full animate-pulse rounded-lg bg-slate-800" />
                <div className="h-11 w-full animate-pulse rounded-lg bg-slate-800" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Course selector */}
                <div className="w-full flex-1">
                  {isCustomCourse ? (
                    <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-4 relative">
                      <button
                        onClick={() => { setIsCustomCourse(false); setCustomCourseCode(''); setCustomCourseName(''); }}
                        className="absolute top-2 right-2 sm:top-3 sm:right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-emerald-400 hover:text-emerald-200"
                      >✕ Cancel</button>
                      <p className="text-xs font-bold uppercase text-emerald-400 mb-3">Manual Course Entry</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <InputField
                          label="" name="customCode" className="w-full sm:w-[140px] mb-0"
                          value={customCourseCode}
                          onChange={(e) => setCustomCourseCode(e.target.value.toUpperCase())}
                          placeholder="Code (e.g. FIN101)"
                        />
                        <InputField
                          label="" name="customName" className="flex-1 mb-0"
                          value={customCourseName}
                          onChange={(e) => setCustomCourseName(e.target.value)}
                          placeholder="Title (e.g. Principles of Finance)"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <SearchableSelect
                        value={activeCourseId}
                        onChange={(val) => { setActiveCourseId(val); setActiveFacultyId(''); }}
                        placeholder="Select Course…"
                        options={dbCourses.map((c) => ({
                          value: c.id,
                          label: `${c.course_code} — ${c.course_name}${isCourseAssigned(c.id) ? ' (added)' : ''}`,
                          disabled: isCourseAssigned(c.id),
                        }))}
                      />
                      <button
                        onClick={() => setIsCustomCourse(true)}
                        className="mt-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                      >
                        Can't find your course? Add manually
                      </button>
                    </div>
                  )}
                </div>

                {/* Faculty selector + Add button */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <div className="flex-1 w-full">
                    <SearchableSelect
                      value={activeFacultyId}
                      onChange={(val) => setActiveFacultyId(val)}
                      placeholder="Select Faculty…"
                      options={dbFaculty.map((f) => ({
                        value: f.id,
                        label: `${f.name}${isFacultyAssigned(f.id) ? ' (already assigned)' : ''}`,
                        disabled: isFacultyAssigned(f.id),
                      }))}
                    />
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!canAdd}
                    className="min-h-[44px] w-full sm:w-auto px-6 rounded-lg bg-emerald-700 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Added courses list */}
          {localCourses.length > 0 && (
            <div className="border-t border-slate-800 rounded-b-2xl overflow-hidden">
              <ul className="divide-y divide-slate-800/60">
                {localCourses.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 bg-slate-900/40">
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        {item.course?.course_code}
                        <span className="font-normal text-slate-400 ml-2">— {item.course?.course_name}</span>
                        {item.course?.isCustom && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-900/50 border border-emerald-700/40 px-1.5 py-0.5 rounded">Custom</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.faculty?.name}</p>
                    </div>
                    <button onClick={() => handleRemove(idx)} className="text-xs font-semibold text-slate-600 hover:text-red-400 transition-colors shrink-0">Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate('/cover-generator/instant')}
            className="text-sm min-h-[44px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip — just generate without saving
          </button>
          <button
            onClick={handleContinue}
            disabled={localCourses.length === 0}
            className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Continue to Save Workspace
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
};



export default GuestCourseSetup;
