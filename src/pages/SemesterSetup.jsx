import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


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
    if (isFacultyAssigned(activeFacultyId)) return;
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
  const isFacultyAssigned = (facultyId) => selectedCourses.some((item) => String(item.faculty?.id || item.faculty_id) === String(facultyId));
  const isFormValid = selectedCourses.length > 0;

  const handleContinue = async () => {
    if (!semesterTitle) setSemesterTitle('Current Semester');
    setIsSavingAssignments(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Fallback for unauthenticated users in legacy setup flow
        setIsSavingAssignments(false);
        navigate('/cover-generator/app');
        return;
      }

      let currentSemesterId = editingSemesterId;

      if (!currentSemesterId) {
        // Delete previous semesters first
        const { data: oldSemesters } = await supabase.from('semesters').select('id').eq('student_id', session.user.id);
        if (oldSemesters && oldSemesters.length > 0) {
          const oldIds = oldSemesters.map(s => s.id);
          await supabase.from('semester_courses').delete().in('semester_id', oldIds);
          await supabase.from('semesters').delete().in('id', oldIds);
        }

        const { data: newSemester, error: createError } = await supabase.from('semesters').insert({
          student_id: session.user.id,
          title: semesterTitle || 'Current Semester'
        }).select().single();

        if (createError) throw createError;
        currentSemesterId = newSemester.id;
      } else {
        const { error: removeError } = await supabase.from('semester_courses').delete().eq('semester_id', currentSemesterId);
        if (removeError) throw removeError;
      }

      const assignments = selectedCourses.map((item) => ({
        semester_id: currentSemesterId,
        course_id: item.course?.isCustom ? null : (item.course?.id || item.course_id),
        custom_course_code: item.course?.isCustom ? item.course?.course_code : null,
        custom_course_name: item.course?.isCustom ? item.course?.course_name : null,
        faculty_id: item.faculty?.id || item.faculty_id
      }));

      const { error: saveError } = await supabase.from('semester_courses').insert(assignments);
      if (saveError) throw saveError;

      setIsSavingAssignments(false);
      navigate('/cover-generator/dashboard');
    } catch (error) {
      alert('Unable to save course assignments: ' + error.message);
      setIsSavingAssignments(false);
    }
  };

  if (isLoadingSemester) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-emerald-700">
        Loading semester…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <AppHeader
        maxWidth="max-w-6xl"
        subtitle="Semester Setup"
        rightContent={
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
        }
      />
      <main className="mx-auto max-w-3xl px-3 sm:px-6 py-6 sm:py-12 w-full">
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
                      <button onClick={() => setIsCustomCourse(false)} className="absolute top-2 right-2 sm:top-3 sm:right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-emerald-700 hover:text-emerald-900">✕ Cancel</button>
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
                      label: `${f.name}${isFacultyAssigned(f.id) ? ' (already assigned)' : ''}`,
                      disabled: isFacultyAssigned(f.id)
                    }))}
                  />
                </div>

                <button
                  onClick={handleAddCourse}
                  disabled={(!activeCourseId && !isCustomCourse) || !activeFacultyId || isFacultyAssigned(activeFacultyId) || (!isCustomCourse && isCourseAssigned(activeCourseId)) || (isCustomCourse && (!customCourseCode || !customCourseName))}
                  className="w-full sm:w-auto min-h-[44px] px-6 rounded-lg bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0"
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
            className={`w-full sm:w-auto min-h-[44px] rounded-lg px-6 py-3 text-sm font-bold tracking-wide uppercase transition shadow-sm ${isFormValid ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}
          >
            {isSavingAssignments ? 'Saving...' : 'Save & Return to Dashboard'}
          </button>
        </div>
      </main>
    </div>
  );
};



export default SemesterSetup;
