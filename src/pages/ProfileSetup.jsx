import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


// --- STEP 1: PROFILE SETUP VIEW ---
const ProfileSetup = () => {
  const navigate = useNavigate();
  const { studentProfile, setStudentProfile } = useContext(WizardContext);

  const handleChange = (e) => {
    setStudentProfile({ ...studentProfile, [e.target.name]: e.target.value });
  };

  const isFormValid = studentProfile.fullName && studentProfile.studentId && studentProfile.batch;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="bg-white p-5 sm:p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
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
          className={`w-full mt-6 min-h-[44px] py-4 rounded-lg font-bold uppercase tracking-wider transition-all ${isFormValid ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          Continue to Courses
        </button>
      </div>
    </div>
  );
};



export default ProfileSetup;
