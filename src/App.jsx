import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { WizardProvider, WizardContext } from './context/WizardContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import CoverPDF from './CoverPDF';
import { supabase } from './supabaseClient';

// --- REUSABLE INPUT COMPONENT ---
const InputField = ({ label, name, value, onChange, placeholder, readOnly = false, type = 'text', className="mb-4" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className="border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors bg-white"
    />
  </div>
);

const formatSubmissionDate = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
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

// --- STEP 1: LOGIN ---
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return alert('Please enter your email and password.');
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto flex h-14 max-w-5xl items-center">
        <button onClick={() => navigate('/')} className="text-lg font-semibold tracking-tight">CoverGen</button>
      </header>
      <main className="mx-auto flex max-w-5xl justify-center pt-16">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Log in to access your saved semesters.</p>
          <div className="mt-7">
            <InputField label="Email address" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" />
            <div className="mb-6 flex flex-col">
              <label className="mb-1 text-sm font-medium text-slate-700">Password</label>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </div>
            <button onClick={handleLogin} disabled={isLoggingIn} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50">
              {isLoggingIn ? 'Logging in…' : 'Log in'}
            </button>
          </div>
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
          onClick={() => navigate('/setup-semester')} 
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
          navigate('/login');
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
          navigate('/dashboard');
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
        navigate('/dashboard'); 
        return; 
      } catch (error) {
        alert('Unable to save course assignments: ' + error.message);
        setIsSavingAssignments(false);
        return;
      }
    }
    
    // IF NEW SETUP: Proceed to Generator
    navigate('/generate');
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
      <header className="bg-slate-900 shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-slate-900 font-black text-xl leading-none">
              C
            </div>
            <h1 className="text-xl font-black tracking-tight text-white hidden sm:block">CoverGen</h1>
          </div>
          
          <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Semester Setup</span>
        </div>
      </header>
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
  const { studentProfile, setStudentProfile, setSemesterTitle, selectedCourses, setSelectedCourses } = useContext(WizardContext);
  
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [docInfo, setDocInfo] = useState({ 
    docType: 'Assignment', 
    customDocType: '',
    assignmentTitle: '', 
    assignmentNumber: '', 
    submissionDate: '' 
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dbCourses, setDbCourses] = useState([]);
  const [dbFaculty, setDbFaculty] = useState([]);
  
  // Guest Standalone State
  const [courseId, setCourseId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseName, setCustomCourseName] = useState('');

  const [isLoadingDirectories, setIsLoadingDirectories] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    const fetchDirectories = async () => {
      const [{ data: courses }, { data: faculty }] = await Promise.all([
        supabase.from('courses').select('*').order('course_code'),
        supabase.from('faculty').select('*').order('name')
      ]);
      if (courses) setDbCourses(courses);
      if (faculty) setDbFaculty(faculty);
      setIsLoadingDirectories(false);
    };
    fetchDirectories();
  }, []);

  const activeCourseData = selectedCourses.length > 0
    ? selectedCourses[selectedCourseIndex]
    : {
        course: isCustomCourse 
          ? { id: null, course_code: customCourseCode.toUpperCase(), course_name: customCourseName, isCustom: true }
          : dbCourses.find((course) => course.id === courseId),
        faculty: dbFaculty.find((faculty) => faculty.id === facultyId)
      };

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
    studentProfile.fullName && studentProfile.studentId && studentProfile.batch &&
    activeCourseData?.course && activeCourseData?.faculty && docInfo.assignmentTitle && docInfo.submissionDate &&
    (docInfo.docType !== 'Custom' || docInfo.customDocType.trim())
  );

  const prepareAccountData = () => {
    setSemesterTitle('Current Semester');
    setSelectedCourses([activeCourseData]);
  };

  const handleDownload = () => {
    if (!isLoggedIn) {
      prepareAccountData();
      setShowSavePrompt(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 shadow-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-8">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-slate-900 font-black text-xl leading-none">
              C
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">CoverGen</h1>
          </div>
          
          {isLoggedIn ? (
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-sm font-bold tracking-wide text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              Dashboard <span className="text-emerald-500">→</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-500 shadow-sm"
            >
              Log in
            </button>
          )}
          
        </div>
      </header>
      
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row relative">
       <div className="w-full lg:w-[420px] shrink-0 bg-white p-6 lg:p-8 z-10 border-r border-slate-200 overflow-y-auto">
         <div className="mb-7">
           <h2 className="text-xl font-semibold tracking-tight">Cover details</h2>
           <p className="mt-1 text-sm text-slate-500">Fill in the information shown on your cover page.</p>
         </div>

         <div className="mb-5">
           <label className="mb-2 block text-sm font-medium text-slate-700">Course and faculty</label>
           
           {selectedCourses.length > 0 ? (
             <SearchableSelect 
               value={selectedCourseIndex} 
               onChange={(val) => setSelectedCourseIndex(Number(val))}
               placeholder="Select Saved Course..."
               options={selectedCourses.map((item, idx) => ({
                 value: idx,
                 label: `${item.course?.course_code || 'N/A'} - ${item.course?.course_name || 'N/A'} ${item.course?.isCustom ? '(Custom)' : ''}`
               }))}
             />
           ) : (
             <>
               {isCustomCourse ? (
                 <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 relative">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-xs font-bold uppercase text-emerald-800">Custom Course</span>
                     <button onClick={() => setIsCustomCourse(false)} className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors">✕ Cancel</button>
                   </div>
                   <InputField label="Course Code" name="customCode" value={customCourseCode} onChange={(e) => setCustomCourseCode(e.target.value.toUpperCase())} placeholder="e.g. FIN101" />
                   <InputField label="Course Title" name="customName" className="mb-0" value={customCourseName} onChange={(e) => setCustomCourseName(e.target.value)} placeholder="e.g. Principles of Finance" />
                 </div>
               ) : (
                 <div className="mb-3">
                   <SearchableSelect 
                     value={courseId} 
                     onChange={(val) => setCourseId(val)} 
                     disabled={isLoadingDirectories}
                     placeholder={isLoadingDirectories ? 'Loading courses...' : 'Select Course...'}
                     options={dbCourses.map((course) => ({
                       value: course.id,
                       label: `${course.course_code} - ${course.course_name}`
                     }))}
                   />
                   <button onClick={() => setIsCustomCourse(true)} className="mt-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">Can't find your course? Add manually</button>
                 </div>
               )}

               <SearchableSelect 
                 value={facultyId} 
                 onChange={(val) => setFacultyId(val)} 
                 disabled={isLoadingDirectories}
                 placeholder={isLoadingDirectories ? 'Loading faculty...' : 'Select Assigned Faculty...'}
                 options={dbFaculty.map((faculty) => ({
                   value: faculty.id,
                   label: faculty.name
                 }))}
               />
             </>
           )}
         </div>

          <div className="mb-4 flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">Document Type</label>
            <select
              name="docType"
              value={docInfo.docType}
              onChange={handleDocInfoChange}
              className="border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors bg-white text-slate-900 cursor-pointer"
            >
              <option value="Assignment">Assignment</option>
              <option value="Term Paper">Term Paper</option>
              <option value="Project Report">Project Report</option>
              <option value="Lab Report">Lab Report</option>
              <option value="Case Study">Case Study</option>
              <option value="Internship Report">Internship Report</option>
              <option value="Custom">Other (Custom)</option>
            </select>
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
              <span className="text-xs text-slate-500">Saved for your next cover</span>
            </div>
            <InputField label="Full Name" name="fullName" value={studentProfile.fullName} onChange={handleProfileChange} placeholder="e.g. Gazi Shahroar" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Student ID" name="studentId" value={studentProfile.studentId} onChange={handleProfileChange} placeholder="e.g. 2402010" />
              <InputField label="Batch" name="batch" value={studentProfile.batch} onChange={handleProfileChange} placeholder="e.g. BBA-15" />
            </div>
            <InputField label="Section (optional)" name="section" value={studentProfile.section} onChange={handleProfileChange} placeholder="e.g. A" className="mb-0"/>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-5">
             {isFormComplete ? (
               <PDFDownloadLink document={<CoverPDF formData={formData} formattedDate={formData.date} />} fileName={`${formData.courseCode ? `${formData.courseCode}_` : ''}${formData.docType.replace(/\s+/g, '_')}_Cover.pdf`} onClick={handleDownload} className="block w-full rounded-lg bg-emerald-700 px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-800 shadow-md">
                 {({ loading }) => (loading ? 'Generating...' : 'Generate & Download PDF')}
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
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
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
                     <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                     Never type your ID or Batch again
                   </li>
                   <li className="flex items-center gap-2">
                     <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                     Access your personalized dashboard
                   </li>
                   <li className="flex items-center gap-2">
                     <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
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
                   onClick={() => navigate('/sign-up')} 
                   className="w-full sm:w-2/3 flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold tracking-wide uppercase text-white shadow-md transition hover:bg-emerald-800 hover:shadow-lg"
                 >
                   Save workspace
                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                 </button>
               </div>
             </div>

           </div>
         </div>
       )}
    </div>
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

  const handleCreateAccount = async () => {
    if (!studentProfile.fullName || !studentProfile.studentId || !studentProfile.batch || selectedCourses.length === 0) {
      alert('Your generated cover details are missing. Please return to the generator and try again.');
      navigate('/');
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

      navigate('/dashboard');
    } catch (error) {
      alert('Unable to create and save your account: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-black mb-2">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Your cover details will be saved under “Current Semester.”</p>
        <InputField label="Full Name" name="fullName" value={studentProfile.fullName} onChange={() => {}} placeholder="" readOnly />
        <InputField label="Email Address" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" />
        <div className="flex flex-col mb-6">
          <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">Password</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="border border-slate-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-lg transition-all">Back</button>
          <button onClick={handleCreateAccount} disabled={isSaving} className="flex-[2] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
            {isSaving ? 'Creating account...' : 'Create & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- STEP 4: RETURNING USER DASHBOARD ---
const Dashboard = () => {
  const navigate = useNavigate();
  const { setStudentProfile, setSemesterTitle, setSelectedCourses, setEditingSemesterId } = useContext(WizardContext);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', batch: '', section: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleOpenEditProfile = () => {
    setEditForm({
      fullName: userProfile?.full_name || '',
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
    setIsSavingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('profiles').update({
        full_name: editForm.fullName.trim(),
        batch: editForm.batch.trim(),
        section: editForm.section.trim(),
      }).eq('id', session.user.id);
      if (error) throw error;

      setUserProfile(prev => ({ ...prev, full_name: editForm.fullName.trim(), batch: editForm.batch.trim(), section: editForm.section.trim() }));
      setStudentProfile(prev => ({ ...prev, fullName: editForm.fullName.trim(), batch: editForm.batch.trim(), section: editForm.section.trim() }));
      setShowEditProfile(false);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');

      const userId = session.user.id;
      const [{ data: profile }, { data: userSemesters }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('semesters').select('*').eq('student_id', userId).order('created_at', { ascending: false })
      ]);

      if (profile) setUserProfile(profile);
      if (userSemesters) setSemesters(userSemesters);
      setLoading(false);
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setStudentProfile({ fullName: '', studentId: '', batch: '', section: '' });
    setSemesterTitle('');
    setSelectedCourses([]);
    setEditingSemesterId(null);
    window.location.assign('/');
  };

  const handleOpenSemester = (semester) => {
    navigate(`/semester/manage/${semester.id}`);
  };

  const handleNewSemester = () => {
    setStudentProfile({ fullName: userProfile.full_name, studentId: userProfile.student_id, batch: userProfile.batch, section: userProfile.section });
    setSemesterTitle('');
    setSelectedCourses([]);
    setEditingSemesterId(null);
    navigate('/semester/new');
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">Loading workspace…</div>;

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
     <header className="bg-slate-900 shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-slate-900 font-black text-xl leading-none">
              C
            </div>
            <h1 className="text-xl font-black tracking-tight text-white hidden sm:block">CoverGen</h1>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>
      
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
            <button onClick={() => navigate('/generate')} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-800 shadow-sm">Generate cover</button>
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
                <h2 className="text-lg font-black tracking-tight text-slate-900">Edit Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">Student ID cannot be changed.</p>
              </div>
              <button
                onClick={() => setShowEditProfile(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Student ID</label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 select-none">{userProfile?.student_id}</div>
              </div>
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
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-[2] rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {isSavingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ROOT GUARD ---
// Renders nothing while the session check is in-flight (prevents flicker),
// then redirects authenticated users straight to /dashboard or shows Generator.
const RootGuard = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
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
        <Route path="/" element={<RootGuard />} />
        <Route path="/setup-profile" element={<ProfileSetup />} />
        <Route path="/setup-semester" element={<SemesterSetup />} />
        <Route path="/semester/new" element={<SemesterSetup />} />
        <Route path="/semester/manage/:semesterId" element={<SemesterSetup />} />
        <Route path="/generate" element={<Generator />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </WizardProvider>
  );
}

export default App;