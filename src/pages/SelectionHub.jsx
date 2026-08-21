import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


// --- SELECTION HUB ---
// Entry point for unauthenticated users — choose between instant generation or workspace setup.
const SelectionHub = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      <AppHeader
        maxWidth="max-w-5xl"
        rightContent={
          <button
            onClick={() => navigate('/cover-generator/login')}
            className="flex items-center justify-center min-h-[42px] gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
          >
            Log in
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        }
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-5">
              <img src="/aibalogo.png" alt="AIBA" className="h-4 w-4 object-contain" />
              AIBA Cover Generator
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              How do you want to <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">generate your cover?</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Pick the workflow that fits you. Both paths produce the same official PDF.
            </p>
          </div>

          {/* Choice cards */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-5 w-full">

            {/* Card A — Instant */}
            <div
              onClick={() => navigate('/cover-generator/instant')}
              className="group relative cursor-pointer flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 transition-all duration-200 hover:border-slate-600 hover:bg-slate-900 hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden w-full"
            >
              {/* Subtle glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />

              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 group-hover:border-slate-600 transition-colors">
                  <svg className="h-6 w-6 text-slate-300 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>

                <h2 className="text-xl font-black text-white mb-2 tracking-tight">Generate Instant Cover</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Jump straight to the editor and export a ready PDF in seconds as a guest. No account needed.
                </p>

                <div className="flex items-center gap-2 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                  <span>Open editor</span>
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card B — Workspace (Recommended) */}
            <div
              onClick={() => navigate('/cover-generator/setup-courses')}
              className="group relative cursor-pointer flex-1 rounded-2xl border border-emerald-700/50 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900/90 p-6 sm:p-8 transition-all duration-200 hover:border-emerald-600/70 hover:shadow-2xl hover:shadow-emerald-900/20 hover:-translate-y-0.5 overflow-hidden w-full"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 60%, rgba(16,185,129,0.08) 0%, transparent 65%)' }} />
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

              <div className="relative z-10">
                {/* Recommended badge */}
                <div className="absolute top-5 right-5 sm:top-6 sm:right-7">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Recommended
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-900/60 border border-emerald-700/50 group-hover:border-emerald-600 transition-colors">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25v2.25m-16.5-2.25v2.25m16.5 2.25v2.25m-16.5-2.25v2.25" />
                  </svg>
                </div>

                <h2 className="text-xl font-black text-white mb-2 tracking-tight">Set Up Profile &amp; Courses</h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Add your active courses and assign faculty once. Your setup is saved to your account — generate future covers in 2 seconds.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Auto-fills every cover', 'Semester presets', 'No re-typing ever'].map((feat) => (
                    <span key={feat} className="inline-flex items-center gap-1 rounded-lg bg-emerald-900/40 border border-emerald-800/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  <span>Set up profile</span>
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer isDark />
    </div>
  );
};



export default SelectionHub;
