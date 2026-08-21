import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { WizardContext } from '../context/WizardContext';
import { supabase } from '../supabaseClient';
import { InputField, formatSubmissionDate, trackEvent, SearchableSelect, AppHeader, GoogleIcon, Footer, mapSemesterCourseRows } from '../components/Shared';


// --- LANDING PAGE ---
const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 font-sans selection:bg-zinc-950 selection:text-zinc-50 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-6 md:px-12 md:py-8 flex items-center justify-between border-b border-zinc-200/50">
        <div className="text-xl font-bold tracking-tighter">gaziseeyam.</div>
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-500">
          <span className="hidden sm:inline">Live in Dhaka (GMT+6)</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-20 lg:py-24">
        {/* Asymmetric 2-Column Hero & Featured Grid */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Left Column (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col justify-center">
            <h1 className="text-6xl sm:text-7xl lg:text-[7rem] font-bold tracking-tighter leading-[0.95] text-zinc-950 mb-8 lg:mb-10">
              Gazi Seeyam.<br />
              <span className="font-medium text-zinc-500 text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight block mt-4 lg:mt-6">
                Product Designer &amp; Builder based in Dhaka.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-800 leading-snug font-light max-w-xl mb-12">
              <strong className="font-medium">Specializing in UI/UX architecture, design systems, and frontend execution.</strong>
            </p>
            
            {/* Quick Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
              <a
                href="mailto:hellogaziseeyam@gmail.com"
                aria-label="Email Gazi Seeyam"
                className="rounded-full border border-zinc-950 bg-zinc-950 px-7 py-3.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:scale-[1.02] shadow-sm"
              >
                Let's Talk &rarr;
              </a>
              
              <ul className="flex flex-wrap items-center gap-6 text-sm font-semibold text-zinc-500">
                <li>
                  <a href="https://www.linkedin.com/in/gaziseeyam/" target="_blank" rel="noreferrer" aria-label="LinkedIn Profile" className="hover:text-zinc-950 hover:underline underline-offset-4 decoration-zinc-300 transition-all">LinkedIn</a>
                </li>
                <li>
                  <a href="https://www.behance.net/hellogaziseeyam" target="_blank" rel="noreferrer" aria-label="Behance Profile" className="hover:text-zinc-950 hover:underline underline-offset-4 decoration-zinc-300 transition-all">Behance</a>
                </li>
                <li>
                  <a href="https://dribbble.com/gaziseeyam" target="_blank" rel="noreferrer" aria-label="Dribbble Profile" className="hover:text-zinc-950 hover:underline underline-offset-4 decoration-zinc-300 transition-all">Dribbble</a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Right Column (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col pt-4 lg:pt-8">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em] mb-6">
              Featured Work &amp; Tools
            </h2>
            
            {/* Beautiful Project Card */}
            <div 
              role="button"
              tabIndex={0}
              aria-label="Open CoverGen for AIBA Savar"
              onClick={() => navigate('/cover-generator')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/cover-generator'); }}
              className="group cursor-pointer rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 transition-all duration-300 hover:border-zinc-900 shadow-sm hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Web Tool &middot; Live
                </span>
                <span className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight">CoverGen for AIBA Savar</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Automated standard cover page generator for university assignments and reports.
                </p>
              </div>
              
              {/* Visual Mock Element (Miniature Document) */}
              <div className="mt-4 w-full aspect-[4/3] rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-center p-6 relative overflow-hidden group-hover:bg-zinc-50 transition-colors">
                <div className="w-full max-w-[180px] aspect-[1/1.4] bg-white border border-zinc-200 shadow-sm rounded flex flex-col relative group-hover:shadow-md group-hover:-translate-y-2 transition-all duration-500 ease-out">
                  {/* Mock Doc Header */}
                  <div className="w-full h-1/4 bg-zinc-100/50 border-b border-zinc-100 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-200"></div>
                  </div>
                  {/* Mock Doc Lines */}
                  <div className="flex-1 p-4 space-y-3">
                    <div className="w-3/4 h-2 rounded bg-zinc-200"></div>
                    <div className="w-1/2 h-2 rounded bg-zinc-200"></div>
                    <div className="w-full h-2 rounded bg-zinc-100 mt-4"></div>
                    <div className="w-5/6 h-2 rounded bg-zinc-100"></div>
                  </div>
                  {/* Floating badges on mock */}
                  <div className="absolute -bottom-3 -right-3 flex flex-col gap-2 scale-90 sm:scale-100">
                    <span className="shadow-sm rounded bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-bold px-2 py-1 uppercase tracking-wider">A4 Standard</span>
                    <span className="shadow-sm rounded bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold px-2 py-1 uppercase tracking-wider text-right">Instant PDF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Work Experience & Consulting Section (Editorial Ledger) */}
        <section className="mt-20 lg:mt-28 border-t border-zinc-200 pt-12 md:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            
            {/* Left Header */}
            <div className="lg:col-span-3">
              <h2 className="text-sm font-semibold tracking-widest text-zinc-950 uppercase mb-2">
                Industry Roles &amp; Engagements
              </h2>
            </div>

            {/* Right List (The Ledger) */}
            <div className="lg:col-span-9 flex flex-col">
              
              {/* Sysonex Row */}
              <div className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center py-6 border-b border-zinc-200 hover:bg-zinc-50/80 transition-colors px-3 -mx-3 cursor-default">
                <div className="md:col-span-3 font-semibold text-zinc-950">
                  Sysonex
                </div>
                <div className="md:col-span-6 text-zinc-700">
                  <span className="font-medium">UI Designer &amp; Analyst</span>
                  <span className="text-zinc-500 ml-2 hidden lg:inline-block">&mdash; Interface design &amp; system analysis</span>
                </div>
                <div className="md:col-span-3 md:text-right text-xs text-zinc-400 uppercase tracking-widest font-mono flex justify-between md:justify-end items-center gap-4">
                  <span>Jan 2024 &mdash; Present</span>
                  <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-zinc-950">&rarr;</span>
                </div>
              </div>

              {/* Freelance & Client Work Row */}
              <div className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-6 border-b border-zinc-200 transition-colors px-3 -mx-3">
                <div className="md:col-span-3 font-semibold text-zinc-950">
                  Independent
                </div>
                <div className="md:col-span-6 text-zinc-700">
                  <span className="font-medium">Selected Works &amp; Client Case Studies</span>
                </div>
                <div className="md:col-span-3 md:text-right flex items-center md:justify-end">
                  <a
                    href="https://calendly.com/gaziseeyam/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Schedule a meeting with Gazi Seeyam on Calendly"
                    className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all rounded-sm"
                  >
                    Schedule Meeting <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Bottom Accent Strip (Editorial Marquee) */}
      <footer className="w-full mt-auto bg-zinc-950 text-zinc-400 py-4 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm font-medium tracking-wide uppercase">
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-8 gap-y-2">
            <span>&bull; Product Design (UI/UX)</span>
            <span className="hidden sm:inline">&bull; Frontend Development</span>
            <span className="hidden md:inline">&bull; Design Systems</span>
            <span className="text-zinc-100">&bull; Available for Select Projects</span>
          </div>
          <div className="shrink-0 text-zinc-600">
            &copy; {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
};



export default LandingPage;
