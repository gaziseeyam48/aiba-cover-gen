import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- REUSABLE INPUT COMPONENT ---
export const InputField = ({ label, name, value, onChange, placeholder, readOnly = false, type = 'text', className = "mb-4" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-1 text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`border rounded-lg p-3 min-h-[44px] text-base focus:outline-none transition-colors ${readOnly
        ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-default select-none'
        : 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600'
        }`}
    />
  </div>
);

export const formatSubmissionDate = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

// --- SAFE UMAMI EVENT TRACKING HELPER ---
export const trackEvent = (eventName, eventData = {}) => {
  if (typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function') {
    window.umami.track(eventName, eventData);
  }
};

// --- REUSABLE SEARCHABLE SELECT COMPONENT ---
export const SearchableSelect = ({ value, onChange, options = [], placeholder, disabled = false, className = '' }) => {
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
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => { if (!disabled) setIsOpen(!isOpen); setSearchTerm(''); }}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 min-h-[44px] text-base sm:text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
      >
        <span className="truncate text-slate-900">{displayLabel}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="1.8"><path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden">
          <div
            className="p-2 border-b border-slate-100 bg-slate-50"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              autoFocus
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 min-h-[44px] text-base sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="min-h-0 max-h-52 overflow-y-auto py-1 bg-white">
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
export const AppHeader = ({ maxWidth = 'max-w-6xl', rightContent, subtitle }) => {
  const navigate = useNavigate();

  return (
    <header className={`sticky top-3 sm:top-4 z-40 px-3 sm:px-4 w-full ${maxWidth} mx-auto mb-4 sm:mb-6 pointer-events-none`}>
      <div className="pointer-events-auto w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/80 shadow-lg shadow-slate-950/10 rounded-full px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all">

        {/* Brand Lockup */}
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          onClick={() => navigate('/cover-generator')}
        >
          {/* Emerald Brand Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-lg font-bold tracking-tight text-white transition-colors group-hover:text-emerald-400 truncate max-w-[100px] sm:max-w-none">
              CoverGen
            </span>
          </div>
        </div>

        {/* Center / Right Content */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {subtitle && (
            <span className="hidden md:inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-700/60">
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
export const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
  </svg>
);

// --- SHARED FOOTER ---
export const Footer = ({ isDark = false }) => (
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




export const mapSemesterCourseRows = (courseData = []) =>
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

