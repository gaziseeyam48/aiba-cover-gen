import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';
import { PDFDownloadLink } from '@react-pdf/renderer';
import CoverPDF from '../CoverPDF';

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
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-900 overflow-x-hidden">
      <AppHeader
        maxWidth="max-w-6xl"
        rightContent={
          isLoggedIn ? (
            <button
              onClick={() => navigate('/cover-generator/dashboard')}
              className="group flex items-center justify-center min-h-[42px] gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
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
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-1.5 min-h-[42px] rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Log in</span>
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          )
        }
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row relative">
        <div className="w-full lg:w-[420px] shrink-0 bg-white p-4 sm:p-6 lg:p-8 z-10 border-r border-slate-200 overflow-y-auto">
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
                      <button onClick={handleCancelCustom} className="min-h-[44px] px-2 flex items-center justify-center text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors">✕ Cancel</button>
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
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white p-3 pr-10 min-h-[44px] text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 cursor-pointer shadow-sm"
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
              <PDFDownloadLink document={<CoverPDF formData={formData} formattedDate={formData.date} />} fileName={`${formData.courseCode ? `${formData.courseCode}_` : ''}${formData.docType.replace(/\s+/g, '_')}_Cover.pdf`} onClick={handleDownload} className="block w-full min-h-[44px] rounded-lg bg-emerald-700 px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-800 shadow-md">
                {({ loading }) => (loading || isSavingCourse ? 'Generating...' : 'Generate & Download PDF')}
              </PDFDownloadLink>
            ) : (
              <button disabled className="w-full min-h-[44px] cursor-not-allowed rounded-lg bg-slate-200 px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Complete form to generate</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all scale-100">

              <div className="bg-emerald-50 px-5 sm:px-8 py-6 text-center border-b border-emerald-100 relative">
                <button
                  onClick={() => setShowSavePrompt(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-700 hover:text-emerald-900 transition-colors p-1"
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
                    className="w-full sm:w-1/3 min-h-[44px] rounded-lg px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    No thanks
                  </button>
                  <button
                    onClick={() => navigate('/cover-generator/sign-up')}
                    className="w-full sm:w-2/3 min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold tracking-wide uppercase text-white shadow-md transition hover:bg-emerald-800 hover:shadow-lg"
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



export default Generator;
