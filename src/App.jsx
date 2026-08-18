import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { WizardProvider, WizardContext } from './context/WizardContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import CoverPDF from './CoverPDF';
import { supabase } from './supabaseClient';

// --- REUSABLE INPUT COMPONENT ---
const InputField = ({ label, name, value, onChange, placeholder, readOnly = false, type = 'text', className = "mb-4" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`border rounded-lg p-3 text-base focus:outline-none transition-colors ${readOnly
          ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-default select-none'
          : 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600'
        }`}
    />
  </div>
);

const formatSubmissionDate = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

// --- SAFE UMAMI EVENT TRACKING HELPER ---
const trackEvent = (eventName, eventData = {}) => {
  if (typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function') {
    window.umami.track(eventName, eventData);
  }
};

// --- REUSABLE SEARCHABLE SELECT COMPONENT ---
const SearchableSelect = ({ value, onChange, options = [], placeholder, disabled = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = safeOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => { if (!disabled) setIsOpen(!isOpen); setSearchTerm(''); }}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
      >
        <span className="truncate">{displayLabel}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="1.8"><path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-xl">
          <div
            className="p-2 border-b border-slate-100 bg-slate-50"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              autoFocus
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="min-h-0 max-h-52 overflow-y-auto py-1 border-t border-slate-100">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 text-center">No results found</li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${opt.disabled ? 'text-slate-400 cursor-not-allowed bg-slate-50' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'} ${String(opt.value) === String(value) ? 'bg-emerald-100 text-emerald-900 font-semibold' : ''}`}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- REUSABLE SAAS HEADER COMPONENT (FROSTED FLOATING PILL) ---
const AppHeader = ({ maxWidth = 'max-w-6xl', rightContent, subtitle }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-4 z-40 px-4 max-w-6xl mx-auto mb-6 pointer-events-none">
      <div className="pointer-events-auto w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/80 shadow-lg shadow-slate-950/10 rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">

        {/* Brand Lockup */}
        <div
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => navigate('/cover-generator')}
        >
          {/* Emerald Brand Badge */}
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white transition-colors group-hover:text-emerald-400">
              CoverGen
            </span>
          </div>
        </div>

        {/* Center / Right Content */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {subtitle && (
            <span className="hidden sm:inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-700/60">
              {subtitle}
            </span>
          )}
          {rightContent}
        </div>

      </div>
    </header>
  );
};

// --- SHARED GOOGLE SVG ICON ---
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
  </svg>
);

// --- SHARED FOOTER ---
const Footer = ({ isDark = false }) => (
  <footer className={`mt-auto py-6 text-center ${isDark ? 'border-t border-slate-800/60' : 'border-t border-slate-200/60'}`}>
    <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
      Created by{' '}
      <a 
        href="https://gaziseeyam.info" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`font-bold transition-colors hover:underline ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
      >
        Gazi Seeyam
      </a>
    </p>
  </footer>
);

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

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    trackEvent('user_login', { method: 'google' });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/cover-generator/dashboard' },
      });
      if (error) throw error;
    } catch (error) {
      alert('Google sign-in failed: ' + error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader maxWidth="max-w-5xl" />
      <main className="mx-auto flex max-w-5xl justify-center px-4 pt-16 pb-20">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Log in to access your saved semesters.</p>

          {/* Google OAuth */}
          <div className="mt-6">
            <button
              id="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
            >
              <GoogleIcon />
              {isGoogleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>
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
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
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


// --- STEP 1: PROFILE SETUP VIEW ---
const ProfileSetup = () => {
  const navigate = useNavigate();
  const { studentProfile, setStudentProfile } = useContext(WizardContext);

  const handleChange = (e) => {
    setStudentProfile({ ...studentProfile, [e.target.name]: e.target.value });
  };

  const isFormValid = studentProfile.fullName && studentProfile.studentId && studentProfile.batch;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-black mb-2 tracking-tight">Step 1: Your Profile</h2>
        <p className="text-sm text-slate-500 mb-6">Enter your details once. We will save this for all future covers.</p>
        <InputField label="Full Name" name="fullName" value={studentProfile.fullName} onChange={handleChange} placeholder="e.g. Gazi Shahroar" />
        <InputField label="Student ID" name="studentId" value={studentProfile.studentId} onChange={handleChange} placeholder="e.g. 2402010" />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Batch" name="batch" value={studentProfile.batch} onChange={handleChange} placeholder="e.g. BBA-15" />
          <InputField label="Section (optional)" name="section" value={studentProfile.section} onChange={handleChange} placeholder="e.g. A" />
        </div>
        <button
          onClick={() => navigate('/cover-generator/setup-semester')}
          disabled={!isFormValid}
          className={`w-full mt-6 py-4 rounded-lg font-bold uppercase tracking-wider transition-all ${isFormValid ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          Continue to Courses
        </button>
      </div>
    </div>
  );
};

const mapSemesterCourseRows = (courseData = []) =>
  courseData.map((row) => {
    const isCustom = !row.course_id && row.custom_course_code;

    // DEFENSIVE: Supabase sometimes returns relations as arrays, or null if missing.
    // This safely extracts the object no matter what format it arrives in.
    const extractObj = (val) => (Array.isArray(val) ? val[0] : val) || {};

    return {
      ...row,
      course: isCustom
        ? { id: null, course_code: row.custom_course_code, course_name: row.custom_course_name, isCustom: true }
        : extractObj(row.course),
      faculty: extractObj(row.faculty),
    };
  });

// --- STEP 2: SEMESTER SETUP VIEW ---
const SemesterSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { semesterId } = useParams();
  const isManageMode = Boolean(semesterId);

  const {
    setStudentProfile,
    semesterTitle,
    setSemesterTitle,
    selectedCourses,
    setSelectedCourses,
    editingSemesterId,
    setEditingSemesterId,
  } = useContext(WizardContext);

  const [dbCourses, setDbCourses] = useState([]);
  const [dbFaculty, setDbFaculty] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(isManageMode);

  const [activeCourseId, setActiveCourseId] = useState('');
  const [activeFacultyId, setActiveFacultyId] = useState('');

  // Custom Course State
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseName, setCustomCourseName] = useState('');
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  useEffect(() => {
    if (location.pathname.endsWith('/semester/new')) {
      setEditingSemesterId(null);
      setSelectedCourses([]);
      setSemesterTitle('');
    }
  }, [location.pathname, setEditingSemesterId, setSelectedCourses, setSemesterTitle]);

  useEffect(() => {
    if (!isManageMode) {
      setIsLoadingSemester(false);
      return undefined;
    }

    let cancelled = false;

    const loadSemester = async () => {
      setIsLoadingSemester(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/cover-generator/login');
          return;
        }

        const [
          { data: semester, error: semesterError },
          { data: courseData, error: courseError },
          { data: profile, error: profileError },
        ] = await Promise.all([
          supabase.from('semesters').select('*').eq('id', semesterId).single(),
          supabase
            .from('semester_courses')
            .select('*, course:courses(*), faculty:faculty(*)')
            .eq('semester_id', semesterId),
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        ]);

        if (semesterError) throw semesterError;
        if (courseError) throw courseError;
        if (profileError) throw profileError;
        if (cancelled) return;

        if (profile) {
          setStudentProfile({
            fullName: profile.full_name,
            studentId: profile.student_id,
            batch: profile.batch,
            section: profile.section,
          });
        }

        setSemesterTitle(semester.title);
        setEditingSemesterId(semester.id);
        setSelectedCourses(mapSemesterCourseRows(courseData));
      } catch (error) {
        if (!cancelled) {
          alert('Error loading semester: ' + error.message);
          navigate('/cover-generator/dashboard');
        }
      } finally {
        if (!cancelled) setIsLoadingSemester(false);
      }
    };

    loadSemester();
    return () => {
      cancelled = true;
    };
  }, [isManageMode, semesterId, navigate, setStudentProfile, setSemesterTitle, setSelectedCourses, setEditingSemesterId]);

  useEffect(() => {
    const fetchDirectories = async () => {
      const { data: courses } = await supabase.from('courses').select('*').order('course_code');
      const { data: faculty } = await supabase.from('faculty').select('*').order('name');
      if (courses) setDbCourses(courses);
      if (faculty) setDbFaculty(faculty);
      setLoadingData(false);
    };
    fetchDirectories();
  }, []);

  const handleAddCourse = () => {
    const facultyObj = dbFaculty.find(f => f.id === activeFacultyId);

    if (isCustomCourse) {
      if (!customCourseCode || !customCourseName || !activeFacultyId) return;
      setSelectedCourses([...selectedCourses, {
        course: { id: null, course_code: customCourseCode.toUpperCase(), course_name: customCourseName, isCustom: true },
        faculty: facultyObj
      }]);
      setIsCustomCourse(false);
      setCustomCourseCode('');
      setCustomCourseName('');
    } else {
      if (!activeCourseId || !activeFacultyId) return;
      if (isCourseAssigned(activeCourseId)) return;
      const courseObj = dbCourses.find(c => c.id === activeCourseId);
      setSelectedCourses([...selectedCourses, { course: courseObj, faculty: facultyObj }]);
      setActiveCourseId('');
    }
    setActiveFacultyId('');
  };

  const handleRemoveCourse = (indexToRemove) => {
    setSelectedCourses(selectedCourses.filter((_, index) => index !== indexToRemove));
  };

  const isCourseAssigned = (courseId) => selectedCourses.some((item) => String(item.course?.id || item.course_id) === String(courseId));
  const isFormValid = selectedCourses.length > 0;

  const handleContinue = async () => {
    if (!semesterTitle) setSemesterTitle('Current Semester');

    // IF EDITING AN EXISTING SEMESTER: Save to DB and return to Dashboard
    if (editingSemesterId) {
      setIsSavingAssignments(true);
      try {
        const { error: removeError } = await supabase.from('semester_courses').delete().eq('semester_id', editingSemesterId);
        if (removeError) throw removeError;

        const assignments = selectedCourses.map((item) => ({
          semester_id: editingSemesterId,
          course_id: item.course?.isCustom ? null : (item.course?.id || item.course_id),
          custom_course_code: item.course?.isCustom ? item.course?.course_code : null,
          custom_course_name: item.course?.isCustom ? item.course?.course_name : null,
          faculty_id: item.faculty?.id || item.faculty_id
        }));

        const { error: saveError } = await supabase.from('semester_courses').insert(assignments);
        if (saveError) throw saveError;

        setIsSavingAssignments(false);
        navigate('/cover-generator/dashboard');
        return;
      } catch (error) {
        alert('Unable to save course assignments: ' + error.message);
        setIsSavingAssignments(false);
        return;
      }
    }

    // IF NEW SETUP: Proceed to Generator
    navigate('/cover-generator/app');
  };

  if (isLoadingSemester) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-emerald-700">
        Loading semester…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader
        maxWidth="max-w-6xl"
        subtitle="Semester Setup"
        rightContent={
          <button
            onClick={() => navigate('/cover-generator/dashboard')}
            className="group flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
          >
            <svg className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            <span>Dashboard</span>
            <svg className="h-3 w-3 text-slate-400 transition-all group-hover:text-white group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <p className="mb-2 text-sm font-medium text-emerald-700">Semester courses</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{editingSemesterId ? 'Assign courses and faculty' : 'Create a semester'}</h1>
          <p className="mt-2 text-slate-600">Add the courses and faculty members you want available in the generator.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Courses</h2>
                <p className="mt-1 text-sm text-slate-500">Choose a course and its assigned faculty member.</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{selectedCourses.length} added</span>
            </div>

            {loadingData ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">Loading course directory…</div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="flex-1 w-full">
                  {isCustomCourse ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 relative h-full">
                      <button onClick={() => setIsCustomCourse(false)} className="absolute top-3 right-4 text-xs font-bold text-emerald-700 hover:text-emerald-900">✕ Cancel</button>
                      <p className="text-xs font-bold uppercase text-emerald-800 mb-3">Manual Course</p>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                        <InputField
                          label=""
                          name="customCode"
                          className="w-full sm:w-[120px] mb-0"
                          value={customCourseCode}
                          onChange={(e) => setCustomCourseCode(e.target.value.toUpperCase())}
                          placeholder="Code (e.g. FIN101)"
                        />
                        <InputField
                          label=""
                          name="customName"
                          className="flex-1 mb-0"
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
                        onChange={(val) => setActiveCourseId(val)}
                        disabled={loadingData}
                        placeholder={loadingData ? 'Loading courses...' : 'Select Course...'}
                        options={dbCourses.map(c => ({
                          value: c.id,
                          label: `${c.course_code} - ${c.course_name}${isCourseAssigned(c.id) ? ' (added)' : ''}`,
                          disabled: isCourseAssigned(c.id)
                        }))}
                      />
                      <button onClick={() => setIsCustomCourse(true)} className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">Can't find your course? Add manually</button>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <SearchableSelect
                    value={activeFacultyId}
                    onChange={(val) => setActiveFacultyId(val)}
                    disabled={loadingData}
                    placeholder={loadingData ? 'Loading faculty...' : 'Select Faculty...'}
                    options={dbFaculty.map(f => ({
                      value: f.id,
                      label: f.name
                    }))}
                  />
                </div>

                <button
                  onClick={handleAddCourse}
                  disabled={(!activeCourseId && !isCustomCourse) || !activeFacultyId || (isCustomCourse && (!customCourseCode || !customCourseName))}
                  className="w-full sm:w-auto h-[42px] px-6 rounded-lg bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {selectedCourses.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-b-lg border-t border-slate-200">
              <ul className="divide-y divide-slate-100">
                {selectedCourses.map((item, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-4 px-4 py-3 sm:px-6 sm:items-center bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {item.course?.course_code || 'Unknown'} <span className="font-medium text-slate-500">— {item.course?.course_name || 'Course'}</span>
                        {item.course?.isCustom && <span className="ml-2 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Custom</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">{item.faculty?.name || 'Unknown Faculty'}</p>
                    </div>
                    <button onClick={() => handleRemoveCourse(idx)} className="text-sm font-semibold text-slate-400 hover:text-red-600 transition-colors">Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button
            onClick={handleContinue}
            disabled={!isFormValid || isSavingAssignments}
            className={`w-full sm:w-auto rounded-lg px-6 py-3 text-sm font-bold tracking-wide uppercase transition shadow-sm ${isFormValid ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}
          >
            {isSavingAssignments ? 'Saving...' : editingSemesterId ? 'Save & Return to Dashboard' : 'Continue to Generator'}
          </button>
        </div>
      </main>
    </div>
  );
};

// --- COVER GENERATOR ---
const Generator = () => {
  const navigate = useNavigate();
  const { studentProfile, setStudentProfile, setSemesterTitle, selectedCourses, setSelectedCourses, editingSemesterId } = useContext(WizardContext);

  // Auth state — null = still checking, false = guest, true = logged in
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [docInfo, setDocInfo] = useState({
    docType: 'Assignment',
    customDocType: '',
    assignmentTitle: '',
    assignmentNumber: '',
    submissionDate: ''
  });

  // Guest-only: global directory fetched from Supabase
  const [dbCourses, setDbCourses] = useState([]);
  const [dbFaculty, setDbFaculty] = useState([]);
  const [isLoadingDirectories, setIsLoadingDirectories] = useState(false);

  // Guest-only: standalone selection state
  const [guestCourseId, setGuestCourseId] = useState('');
  const [guestFacultyId, setGuestFacultyId] = useState('');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseName, setCustomCourseName] = useState('');

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  // True while profile/semester is being fetched for an authenticated user
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Step 1: resolve auth state and hydrate profile/courses if logged in
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      const userId = session.user.id;

      // Only hydrate from DB if WizardContext is empty (e.g. hard refresh bypassing Dashboard)
      const needsHydration = !studentProfile.fullName || !studentProfile.studentId;
      const needsCourses = selectedCourses.length === 0;

      if (!needsHydration && !needsCourses) return;

      setIsLoadingProfile(true);
      try {
        // Fetch profile and latest semester in parallel
        const [{ data: profile }, { data: semesters }] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, student_id, batch, section')
            .eq('id', userId)
            .single(),
          needsCourses
            ? supabase
                .from('semesters')
                .select('id')
                .eq('student_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
            : Promise.resolve({ data: null }),
        ]);

        if (profile && needsHydration) {
          setStudentProfile({
            fullName: profile.full_name || '',
            studentId: profile.student_id || '',
            batch: profile.batch || '',
            section: profile.section || '',
          });
        }

        if (needsCourses && semesters && semesters.length > 0) {
          const semesterId = semesters[0].id;
          const { data: semCourses } = await supabase
            .from('semester_courses')
            .select(`
              id,
              course_id,
              faculty_id,
              custom_course_code,
              custom_course_name,
              course:courses(id, course_code, course_name),
              faculty:faculty(id, name, designation)
            `)
            .eq('semester_id', semesterId);

          if (semCourses && semCourses.length > 0) {
            setSelectedCourses(mapSemesterCourseRows(semCourses));
          }
        }
      } finally {
        setIsLoadingProfile(false);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: once we know the user is a guest, fetch global directories
  useEffect(() => {
    if (isLoggedIn !== false) return; // wait until auth check resolves
    setIsLoadingDirectories(true);
    Promise.all([
      supabase.from('courses').select('id, course_code, course_name').order('course_code'),
      supabase.from('faculty').select('id, name, designation').order('name'),
    ]).then(([{ data: courses }, { data: faculty }]) => {
      if (courses) setDbCourses(courses);
      if (faculty) setDbFaculty(faculty);
      setIsLoadingDirectories(false);
    });
  }, [isLoggedIn]);

  // Reset guest course selection when switching back from custom mode
  const handleCancelCustom = () => {
    setIsCustomCourse(false);
    setCustomCourseCode('');
    setCustomCourseName('');
  };

  // Derive the active course+faculty pair from the right source depending on auth mode
  const activeCourseData = (() => {
    if (isLoggedIn && selectedCourses.length > 0) {
      // Authenticated: take directly from semester assignments
      return selectedCourses[selectedCourseIndex] || selectedCourses[0];
    }
    // Guest: build from standalone selections
    return {
      course: isCustomCourse
        ? { id: null, course_code: customCourseCode.toUpperCase(), course_name: customCourseName, isCustom: true }
        : dbCourses.find((c) => c.id === guestCourseId),
      faculty: dbFaculty.find((f) => f.id === guestFacultyId),
    };
  })();

  const docTypeLabel = docInfo.docType === 'Custom'
    ? (docInfo.customDocType.trim() || 'Document')
    : (docInfo.docType || 'Assignment');

  const formData = {
    ...studentProfile,
    docType: docTypeLabel,
    courseCode: activeCourseData?.course?.course_code || '',
    courseTitle: activeCourseData?.course?.course_name || '',
    instructorName: activeCourseData?.faculty?.name || '',
    designation: activeCourseData?.faculty?.designation || '',
    assignmentTitle: docInfo.assignmentTitle,
    assignmentNo: docInfo.assignmentNumber,
    date: formatSubmissionDate(docInfo.submissionDate)
  };

  const handleDocInfoChange = (e) => setDocInfo({ ...docInfo, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setStudentProfile({ ...studentProfile, [e.target.name]: e.target.value });

  const isFormComplete = Boolean(
    isLoggedIn !== null && // don't allow download while auth is still resolving
    studentProfile.fullName && studentProfile.studentId && studentProfile.batch &&
    activeCourseData?.course && activeCourseData?.faculty && docInfo.assignmentTitle && docInfo.submissionDate &&
    (docInfo.docType !== 'Custom' || docInfo.customDocType.trim())
  );

  const prepareAccountData = () => {
    setSemesterTitle('Current Semester');
    setSelectedCourses([activeCourseData]);
  };

  // Check if current activeCourseData is already in the semester to avoid duplicates
  const isCourseAlreadyInSemester = () => {
    if (!activeCourseData?.course) return false;
    return selectedCourses.some((item) => {
      const selectedCourseId = item.course?.id || item.course_id;
      const activeCourseId = activeCourseData.course?.id;
      if (activeCourseData.course?.isCustom) {
        return item.course?.isCustom &&
          item.course?.course_code === activeCourseData.course?.course_code &&
          item.course?.course_name === activeCourseData.course?.course_name &&
          (item.faculty?.id || item.faculty_id) === (activeCourseData.faculty?.id);
      }
      return String(selectedCourseId) === String(activeCourseId) &&
        String(item.faculty?.id || item.faculty_id) === String(activeCourseData.faculty?.id);
    });
  };

  // Auto-save the active course/faculty pair into the user's active semester
  const autoSaveCourseToSemester = async () => {
    if (!editingSemesterId || !activeCourseData?.course || !activeCourseData?.faculty) return;
    if (isCourseAlreadyInSemester()) return;

    setIsSavingCourse(true);
    try {
      const assignment = {
        semester_id: editingSemesterId,
        course_id: activeCourseData.course?.isCustom ? null : (activeCourseData.course?.id || null),
        custom_course_code: activeCourseData.course?.isCustom ? activeCourseData.course?.course_code : null,
        custom_course_name: activeCourseData.course?.isCustom ? activeCourseData.course?.course_name : null,
        faculty_id: activeCourseData.faculty?.id || null,
      };
      const { error } = await supabase.from('semester_courses').insert(assignment);
      if (error) throw error;
      // Sync into WizardContext so the UI reflects it immediately (no duplicates)
      setSelectedCourses((prev) => [...prev, activeCourseData]);
    } catch (err) {
      // Silently fail — auto-save is best-effort and should not interrupt the user's download
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDownload = async () => {
    trackEvent('pdf_download', {
      doc_type: formData.docType,
      course_code: formData.courseCode,
      is_logged_in: !!isLoggedIn,
    });
    if (isLoggedIn) {
      // Fire-and-forget auto-save for authenticated users
      autoSaveCourseToSemester();
    } else {
      prepareAccountData();
      setShowSavePrompt(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-900">
      <AppHeader
        maxWidth="max-w-6xl"
        rightContent={
          isLoggedIn ? (
            <button
              onClick={() => navigate('/cover-generator/dashboard')}
              className="group flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <svg className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span>Dashboard</span>
              <svg className="h-3 w-3 text-slate-400 transition-all group-hover:text-white group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => navigate('/cover-generator/login')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Log in</span>
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          )
        }
      />

      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row relative">
        <div className="w-full lg:w-[420px] shrink-0 bg-white p-6 lg:p-8 z-10 border-r border-slate-200 overflow-y-auto">
          <div className="mb-7">
            <h2 className="text-xl font-semibold tracking-tight">Cover details</h2>
            <p className="mt-1 text-sm text-slate-500">Fill in the information shown on your cover page.</p>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">Course and faculty</label>

            {/* ── AUTHENTICATED MODE ── */}
            {isLoggedIn && (
              <>
                {selectedCourses.length > 0 ? (
                  <>
                    <SearchableSelect
                      value={selectedCourseIndex}
                      onChange={(val) => setSelectedCourseIndex(Number(val))}
                      placeholder="Select your course…"
                      options={selectedCourses.map((item, idx) => ({
                        value: idx,
                        label: `${item.course?.course_code || 'N/A'} — ${item.course?.course_name || 'N/A'}${item.course?.isCustom ? ' (Custom)' : ''}`
                      }))}
                    />
                    {/* Auto-locked faculty from semester assignment */}
                    {activeCourseData?.faculty && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span className="text-sm text-slate-600">{activeCourseData.faculty.name}</span>
                        <span className="ml-auto text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Assigned</span>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(editingSemesterId ? `/cover-generator/semester/manage/${editingSemesterId}` : '/cover-generator/setup-semester')}
                      className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Missing a course? Manage Semester Courses
                    </button>
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">No courses in this semester yet.</p>
                    <button
                      onClick={() => navigate(editingSemesterId ? `/cover-generator/semester/manage/${editingSemesterId}` : '/cover-generator/setup-semester')}
                      className="mt-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors underline-offset-2 hover:underline"
                    >
                      Add courses to your semester →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── GUEST MODE ── */}
            {isLoggedIn === false && (
              <>
                {isCustomCourse ? (
                  <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 relative">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase text-emerald-800">Custom Course</span>
                      <button onClick={handleCancelCustom} className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors">✕ Cancel</button>
                    </div>
                    <InputField label="Course Code" name="customCode" value={customCourseCode} onChange={(e) => setCustomCourseCode(e.target.value.toUpperCase())} placeholder="e.g. FIN101" />
                    <InputField label="Course Title" name="customName" className="mb-0" value={customCourseName} onChange={(e) => setCustomCourseName(e.target.value)} placeholder="e.g. Principles of Finance" />
                  </div>
                ) : (
                  <div className="mb-3">
                    {isLoadingDirectories ? (
                      <div className="h-[46px] w-full animate-pulse rounded-lg bg-slate-100" />
                    ) : (
                      <SearchableSelect
                        value={guestCourseId}
                        onChange={(val) => { setGuestCourseId(val); setGuestFacultyId(''); }}
                        placeholder="Select Course…"
                        options={dbCourses.map((course) => ({
                          value: course.id,
                          label: `${course.course_code} — ${course.course_name}`
                        }))}
                      />
                    )}
                    <button
                      onClick={() => setIsCustomCourse(true)}
                      className="mt-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      Can't find your course? Add manually
                    </button>
                  </div>
                )}

                {isLoadingDirectories ? (
                  <div className="h-[46px] w-full animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <SearchableSelect
                    value={guestFacultyId}
                    onChange={(val) => setGuestFacultyId(val)}
                    placeholder="Select Assigned Faculty…"
                    options={dbFaculty.map((faculty) => ({
                      value: faculty.id,
                      label: faculty.name
                    }))}
                  />
                )}
              </>
            )}

            {/* ── AUTH CHECK IN PROGRESS ── */}
            {isLoggedIn === null && (
              <div className="space-y-2">
                <div className="h-[46px] w-full animate-pulse rounded-lg bg-slate-100" />
                <div className="h-[46px] w-full animate-pulse rounded-lg bg-slate-100" />
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">Document Type</label>
            <div className="relative">
              <select
                name="docType"
                value={docInfo.docType}
                onChange={handleDocInfoChange}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white p-3 pr-10 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 cursor-pointer shadow-sm"
              >
                <option value="Assignment">Assignment</option>
                <option value="Term Paper">Term Paper</option>
                <option value="Project Report">Project Report</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Case Study">Case Study</option>
                <option value="Internship Report">Internship Report</option>
                <option value="Custom">Other (Custom)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8">
                  <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {docInfo.docType === 'Custom' && (
            <InputField
              label="Custom Document Type"
              name="customDocType"
              value={docInfo.customDocType}
              onChange={handleDocInfoChange}
              placeholder="e.g. Research Proposal"
            />
          )}

          <InputField label={`${docTypeLabel} Title`} name="assignmentTitle" value={docInfo.assignmentTitle} onChange={handleDocInfoChange} placeholder="e.g. Market Analysis" />
          <InputField label="Submission Date" name="submissionDate" value={docInfo.submissionDate} onChange={handleDocInfoChange} type="date" className="mb-0" />

          <div className="mt-7 border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-baseline justify-between">
              <label className="text-sm font-medium text-slate-700">Student details</label>
              {isLoadingProfile ? (
                <span className="text-xs font-medium text-slate-400 animate-pulse">Loading…</span>
              ) : isLoggedIn ? (
                <span className="text-xs font-medium text-slate-400">Read-only</span>
              ) : (
                <span className="text-xs text-slate-500">Saved for your next cover</span>
              )}
            </div>

            {isLoadingProfile ? (
              /* Skeleton placeholders while profile fetches */
              <div className="space-y-3">
                <div className="h-[50px] w-full animate-pulse rounded-lg bg-slate-100" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-[50px] animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-[50px] animate-pulse rounded-lg bg-slate-100" />
                </div>
                <div className="h-[50px] w-full animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : (
              <>
                <InputField label="Full Name" name="fullName" value={studentProfile.fullName} onChange={handleProfileChange} placeholder="Enter your full name" readOnly={isLoggedIn} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Student ID" name="studentId" value={studentProfile.studentId} onChange={handleProfileChange} placeholder="e.g. 2502010" readOnly={isLoggedIn} />
                  <InputField label="Batch" name="batch" value={studentProfile.batch} onChange={handleProfileChange} placeholder="e.g. BBA-15" readOnly={isLoggedIn} />
                </div>
                <InputField label="Section (optional)" name="section" value={studentProfile.section} onChange={handleProfileChange} placeholder="e.g. A" className="mb-0" readOnly={isLoggedIn} />
                {isLoggedIn && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      To update your details,{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/cover-generator/dashboard')}
                        className="font-semibold text-emerald-700 underline-offset-2 hover:underline hover:text-emerald-800 transition-colors"
                      >
                        edit your profile in the Dashboard
                      </button>.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-7 border-t border-slate-100 pt-5">
            {isFormComplete ? (
              <PDFDownloadLink document={<CoverPDF formData={formData} formattedDate={formData.date} />} fileName={`${formData.courseCode ? `${formData.courseCode}_` : ''}${formData.docType.replace(/\s+/g, '_')}_Cover.pdf`} onClick={handleDownload} className="block w-full rounded-lg bg-emerald-700 px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-800 shadow-md">
                {({ loading }) => (loading || isSavingCourse ? 'Generating...' : 'Generate & Download PDF')}
              </PDFDownloadLink>
            ) : (
              <button disabled className="w-full cursor-not-allowed rounded-lg bg-slate-200 px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Complete form to generate</button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HTML Visual Preview */}
        <div className="flex-1 bg-slate-100 p-8 xl:p-12 flex-col items-center overflow-y-auto w-full hidden lg:flex">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 font-[Arial,_Helvetica,_sans-serif]">Live preview</p>
          <div className="transform scale-[0.45] sm:scale-[0.6] lg:scale-100 origin-top mb-[-150mm] sm:mb-[-110mm] lg:mb-0 w-[210mm] flex-shrink-0 transition-all duration-300">
            <div id="cover-preview" className="relative mx-auto bg-white text-black shadow-xl ring-1 ring-black/5 flex flex-col" style={{ width: '210mm', height: '297mm', padding: '20mm', boxSizing: 'border-box' }}>

              {/* Header Container */}
              <div className="flex flex-col items-center mb-[40pt] text-center">
                <img src="/aibalogo.png" className="w-[110pt] mb-[20pt] object-contain" alt="AIBA Logo" />
                <h1 className="font-['Times_New_Roman',_Times,_serif] text-[16pt] font-bold uppercase">
                  Army Institute of Business Administration, Savar
                </h1>
              </div>

              {/* Middle Section */}
              <div className="flex flex-col items-center mt-[40pt] mb-[40pt] w-full">
                <p className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mb-[15pt] tracking-[1px]">
                  {`${formData.docType || 'Assignment'} On`}
                </p>
                <h2 className="font-['Times_New_Roman',_Times,_serif] text-[24pt] font-bold text-center px-[20pt] mb-[25pt] leading-[1.3]">
                  {formData.assignmentTitle || `${formData.docType || 'Assignment'} Topic Goes Here`}
                </h2>

                {/* Course Info Block */}
                <div className="flex flex-col mt-[20pt]">
                  <div className="flex items-center justify-start mb-[12pt]">
                    <span className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mr-[12pt]">Course Title:</span>
                    <span className="font-['Times_New_Roman',_Times,_serif] text-[13pt] text-left">{formData.courseTitle || ''}</span>
                  </div>
                  <div className="flex items-center justify-start mb-[12pt]">
                    <span className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mr-[12pt]">Course Code:</span>
                    <span className="font-['Times_New_Roman',_Times,_serif] text-[13pt] text-left">{formData.courseCode || ''}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex justify-between w-full mt-[70pt] mb-[30pt]">
                {/* Left Column */}
                <div className="w-[45%]">
                  <p className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mb-[20pt] tracking-[1px]">Submitted To:</p>
                  <p className="font-['Times_New_Roman',_Times,_serif] text-[14pt] font-bold mb-[6pt]">{formData.instructorName || ''}</p>
                  <p className="font-['Times_New_Roman',_Times,_serif] text-[13pt] mb-[12pt]">{formData.designation || ''}</p>
                </div>

                {/* Right Column */}
                <div className="w-[45%]">
                  <p className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mb-[20pt] tracking-[1px]">Submitted By:</p>
                  <p className="font-['Times_New_Roman',_Times,_serif] text-[14pt] font-bold mb-[6pt]">{formData.fullName || ''}</p>

                  <div className="flex items-center justify-start mt-[8pt]">
                    <span className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mr-[12pt]">ID:</span>
                    <span className="font-['Times_New_Roman',_Times,_serif] text-[13pt] text-left">{formData.studentId || ''}</span>
                  </div>
                  <div className="flex items-center justify-start mt-[8pt]">
                    <span className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mr-[12pt]">BATCH:</span>
                    <span className="font-['Times_New_Roman',_Times,_serif] text-[13pt] text-left">{formData.batch || ''}</span>
                  </div>
                  {formData.section && (
                    <div className="flex items-center justify-start mt-[8pt]">
                      <span className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mr-[12pt]">SECTION:</span>
                      <span className="font-['Times_New_Roman',_Times,_serif] text-[13pt] text-left">{formData.section || ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto flex items-center justify-center text-center">
                <span className="font-[Arial,_Helvetica,_sans-serif] text-[10pt] font-bold uppercase mr-[10pt] tracking-[1px]">Date of Submission:</span>
                <span className="font-['Times_New_Roman',_Times,_serif] text-[13pt]">{formData.date || ''}</span>
              </div>

            </div>
          </div>
        </div>

        {/* POST-GENERATION ACCOUNT PROMPT */}
        {showSavePrompt && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">

              <div className="bg-emerald-50 px-8 py-6 text-center border-b border-emerald-100 relative">
                <button
                  onClick={() => setShowSavePrompt(false)}
                  className="absolute top-4 right-4 text-emerald-700 hover:text-emerald-900 transition-colors p-1"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4 shadow-sm ring-4 ring-white">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">Your PDF is ready!</h3>
                <p className="mt-1 text-sm text-emerald-800 font-bold uppercase tracking-wider">Don't lose your progress</p>
              </div>

              <div className="p-8">
                <p className="text-sm text-slate-600 mb-5 text-center leading-relaxed">
                  Create a free account to instantly save your profile, current courses, and faculty details.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-100">
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Never type your ID or Batch again
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Access your personalized dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Generate future covers in 2 seconds
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => setShowSavePrompt(false)}
                    className="w-full sm:w-1/3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    No thanks
                  </button>
                  <button
                    onClick={() => navigate('/cover-generator/sign-up')}
                    className="w-full sm:w-2/3 flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold tracking-wide uppercase text-white shadow-md transition hover:bg-emerald-800 hover:shadow-lg"
                  >
                    Save workspace
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

// --- ACCOUNT CREATION ---
const SignUp = () => {
  const navigate = useNavigate();
  const { studentProfile, selectedCourses } = useContext(WizardContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!studentProfile.fullName || !studentProfile.studentId || !studentProfile.batch || selectedCourses.length === 0) {
      alert('Your generated cover details are missing. Please return to the generator and try again.');
      navigate('/cover-generator');
      return;
    }
    if (!email || !password) return alert('Please enter an email address and password.');

    setIsSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const userId = authData.user.id;
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId, full_name: studentProfile.fullName, student_id: studentProfile.studentId, batch: studentProfile.batch, section: studentProfile.section
      });
      if (profileError) throw profileError;

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
  const handleGoogleSignUp = async () => {
    const hasDetails = studentProfile.fullName || studentProfile.studentId || studentProfile.batch;
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/cover-generator/dashboard' },
      });
      if (error) throw error;
    } catch (error) {
      localStorage.removeItem('pending_student_profile');
      alert('Google sign-up failed: ' + error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader maxWidth="max-w-5xl" />
      <main className="mx-auto flex max-w-5xl justify-center px-4 pt-16 pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
          <h1 className="text-2xl font-black mb-1 tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-500 mb-6">Your cover details will be saved under "Current Semester."</p>

          {/* Google OAuth — fastest path */}
          <button
            id="google-signup-btn"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 mb-5"
          >
            <GoogleIcon />
            {isGoogleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or sign up with email</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <InputField label="Full Name" name="fullName" value={studentProfile.fullName} onChange={() => { }} placeholder="" readOnly />
          <InputField label="Email Address" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" />
          <div className="flex flex-col mb-6">
            <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/cover-generator')} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all">Back</button>
            <button onClick={handleCreateAccount} disabled={isSaving} className="flex-[2] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
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

// --- STEP 4: RETURNING USER DASHBOARD ---
const Dashboard = () => {
  const navigate = useNavigate();
  const { setStudentProfile, setSemesterTitle, setSelectedCourses, setEditingSemesterId } = useContext(WizardContext);

  const [showEditProfile, setShowEditProfile] = useState(false);
  // isNewProfile = true means this is an onboarding modal (student_id is editable)
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', studentId: '', batch: '', section: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
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
        try { pendingProfile = JSON.parse(pendingRaw); } catch (_) {}
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

  const handleNewSemester = () => {
    setStudentProfile({ fullName: userProfile.full_name, studentId: userProfile.student_id, batch: userProfile.batch, section: userProfile.section });
    setSemesterTitle('');
    setSelectedCourses([]);
    setEditingSemesterId(null);
    navigate('/cover-generator/semester/new');
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">Loading workspace…</div>;

  return (
    <div className="flex flex-col relative min-h-screen bg-slate-50 text-slate-900">
      <AppHeader
        maxWidth="max-w-6xl"
        rightContent={
          <button
            onClick={handleLogout}
            className="group flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 active:scale-95"
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
          <div className="flex items-center gap-3">
            <button onClick={handleNewSemester} className="rounded-lg px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-200 hover:text-slate-900">New semester</button>
            <button onClick={() => navigate('/cover-generator/app')} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-800 shadow-sm">Generate cover</button>
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
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
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-[2] rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {isSavingProfile ? 'Saving…' : isNewProfile ? 'Complete Setup' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

// --- LANDING PAGE ---
const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Under Construction Notice Bar */}
      <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-center text-xs font-medium text-amber-300 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-bold uppercase tracking-wider text-[11px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 text-amber-200">
            Under Construction
          </span>
          <span className="text-slate-300">
            This website is currently being built. Check out my featured side project below!
          </span>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-10">

          {/* Main Hero Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-medium text-slate-300 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              🚧 Portfolio In Progress
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Building things for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                university & beyond
              </span>.
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Welcome to my digital corner. The main website is under active construction, but you can try my live side project below.
            </p>
          </div>

          {/* Featured Side Project Showcase Card */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-10 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 overflow-hidden group">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">My Side Project</span>
                </div>
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  Live &bull; Production
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Cover Page Generator for my University
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    A purpose-built web tool created for <strong className="text-emerald-400 font-semibold">AIBA Savar</strong> students to eliminate manual cover formatting. Generate 100% compliant, print-ready PDF cover pages in seconds.
                  </p>

                  {/* Feature Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2.5">
                      <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span>Official AIBA layout format</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2.5">
                      <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span>Pre-loaded courses & faculty</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2.5">
                      <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span>Auto-saves active semester info</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2.5">
                      <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span>Instant print-ready PDF export</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                    <button
                      onClick={() => {
                        trackEvent('landing_cta_click');
                        navigate('/cover-generator');
                      }}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
                    >
                      <span>Launch Cover Generator</span>
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigate('/cover-generator/login')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                    >
                      Student Login
                    </button>
                  </div>
                </div>

                {/* Visual Mini Preview Graphic */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center">
                  <div
                    onClick={() => navigate('/cover-generator')}
                    className="cursor-pointer w-full rounded-xl border border-slate-700/60 bg-slate-950/80 p-5 shadow-inner transition-transform hover:scale-[1.02] group-hover:border-emerald-500/40"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/80" />
                        <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                        <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">cover-generator.aiba</span>
                    </div>

                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3">
                        <img src="/aibalogo.png" alt="AIBA Logo" className="h-8 w-8 object-contain" />
                        <div>
                          <div className="h-2 w-28 bg-slate-700 rounded" />
                          <div className="h-1.5 w-36 bg-slate-800 rounded mt-1" />
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-3 border border-slate-800/80 space-y-2">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Assignment Cover Preview</div>
                        <div className="h-2 w-full bg-slate-700 rounded" />
                        <div className="h-2 w-3/4 bg-slate-800 rounded" />
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>Format: A4 Official</span>
                        <span className="font-semibold text-emerald-400 group-hover:underline">Open tool &rarr;</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Under Construction Footer Note */}
          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
            <span>More projects & portfolio sections coming soon</span>
          </div>

        </div>
      </main>
      
      <Footer isDark />
    </div>
  );
};

// --- COVER-GENERATOR AUTH GUARD ---
// Renders nothing while the session check is in-flight (prevents flicker),
// then redirects authenticated users to the dashboard or shows the Generator.
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
  return <Generator />;
};

// --- MAIN ROUTER APP ---
function App() {
  return (
    <WizardProvider>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Cover Generator sub-app */}
        <Route path="/cover-generator" element={<CoverGeneratorGuard />} />
        <Route path="/cover-generator/app" element={<Generator />} />
        <Route path="/cover-generator/login" element={<Login />} />
        <Route path="/cover-generator/sign-up" element={<SignUp />} />
        <Route path="/cover-generator/dashboard" element={<Dashboard />} />
        <Route path="/cover-generator/setup-profile" element={<ProfileSetup />} />
        <Route path="/cover-generator/setup-semester" element={<SemesterSetup />} />
        <Route path="/cover-generator/semester/new" element={<SemesterSetup />} />
        <Route path="/cover-generator/semester/manage/:semesterId" element={<SemesterSetup />} />
      </Routes>
    </WizardProvider>
  );
}

export default App;