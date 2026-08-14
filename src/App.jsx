import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import CoverPDF from './CoverPDF';

const InputField = ({ label, name, value, onChange, type = "text", rows = 2 }) => (
  <div className="flex flex-col mb-4">
    <label className="mb-1 text-sm font-semibold text-gray-700 uppercase tracking-wider">{label}</label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors resize-y"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors"
      />
    )}
  </div>
);

function App() {
  const initialState = {
    topic: '',
    courseTitle: '',
    courseCode: '',
    instructorName: '',
    instructorDesignation: '',
    studentName: '',
    studentId: '',
    batch: '',
    date: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [activeTab, setActiveTab] = useState('form');
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if(window.confirm("Are you sure you want to clear all fields?")) {
      setFormData(initialState);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; 
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Dynamically name the file based on the course code
  const filename = formData.courseCode ? `${formData.courseCode}_Cover_Page.pdf` : 'Assignment_Cover_Page.pdf';
  const formattedDateString = formatDate(formData.date);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row font-sans text-gray-900 pb-16 lg:pb-0">
      
      {/* Left Column: The Input Form */}
      <div className={`w-full lg:w-[400px] bg-white border-r border-gray-200 p-6 lg:p-8 overflow-y-auto max-h-screen shadow-lg z-10 ${activeTab === 'form' ? 'block' : 'hidden lg:block'}`}>
        <h1 className="text-2xl font-black mb-8 tracking-tight">CoverGen</h1>

        <InputField label="Assignment Topic" name="topic" value={formData.topic} onChange={handleChange} type="textarea" rows={3} />
        
        <div className="mt-4">
          <InputField label="Course Title" name="courseTitle" value={formData.courseTitle} onChange={handleChange} type="textarea" rows={2} />
        </div>
        <div className="mt-2">
          <InputField label="Course Code" name="courseCode" value={formData.courseCode} onChange={handleChange} />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h2 className="text-sm font-black mb-4 text-gray-400 uppercase tracking-widest">Submitted To</h2>
          <InputField label="Instructor Name" name="instructorName" value={formData.instructorName} onChange={handleChange} />
          <InputField label="Designation" name="instructorDesignation" value={formData.instructorDesignation} onChange={handleChange} />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h2 className="text-sm font-black mb-4 text-gray-400 uppercase tracking-widest">Submitted By</h2>
          <InputField label="Student Name" name="studentName" value={formData.studentName} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Student ID" name="studentId" value={formData.studentId} onChange={handleChange} />
            <InputField label="Batch" name="batch" value={formData.batch} onChange={handleChange} />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h2 className="text-sm font-black mb-4 text-gray-400 uppercase tracking-widest">Submission Details</h2>
          <InputField label="Date" name="date" value={formData.date} onChange={handleChange} type="date" />
        </div>
        
        {/* DESKTOP BUTTONS */}
        <div className="hidden lg:grid grid-cols-3 gap-4 mt-10 pt-6 border-t border-gray-100">
          <button onClick={handleReset} className="col-span-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-black uppercase tracking-wider py-4 rounded-lg transition-all">
            Clear
          </button>
          
       {/* THE CLEAN DESKTOP DOWNLOAD BUTTON */}
          <div 
            className="col-span-2"
            onClick={() => {
              window.umami?.track('Download PDF', {
                course: formData.courseCode || 'Unknown_Course',
                batch: formData.batch || 'Unknown_Batch'
              });
            }}
          >
            <PDFDownloadLink 
              document={<CoverPDF formData={formData} formattedDate={formattedDateString} />} 
              fileName={filename}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black uppercase tracking-wider py-4 px-6 rounded-lg shadow-lg transition-all flex justify-center items-center w-full h-full"
            >
              {({ loading }) => (loading ? 'Generating...' : 'Download PDF')}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      {/* Right Column: The HTML Visual Preview Canvas */}
      <div className={`flex-1 bg-gray-200 p-4 lg:p-8 flex-col items-center overflow-y-auto max-h-screen w-full ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
        
        <div className="transform scale-[0.45] sm:scale-[0.6] lg:scale-100 origin-top mb-[-150mm] sm:mb-[-110mm] lg:mb-0 w-[210mm] flex-shrink-0">
          {/* We keep the HTML here strictly as a live, fast visual preview on the screen */}
          <div className="bg-white w-[210mm] min-h-[297mm] flex flex-col relative p-[20mm] text-black font-['Times_New_Roman',_Times,_serif] shadow-2xl">
              <div className="flex flex-col items-center mb-8 text-center">
                <img src="/header-logo.png" alt="Institute Logo" className="w-32 h-auto mb-6" />
                <h1 className="text-2xl font-bold uppercase">
                  Army Institute of Business Administration, Savar
                </h1>
              </div>

             {/* === PREVIEW MIDDLE SECTION === */}
              <div className="flex flex-col items-center text-center space-y-12 w-full mt-12 mb-8">
                <div className="space-y-4 w-full">
                  <p className="text-sm font-bold uppercase font-['Arial',_Helvetica,_sans-serif] tracking-wider">Assignment On</p>
                  <h2 className="text-3xl font-bold leading-snug max-w-3xl mx-auto break-words">
                    {formData.topic || 'Assignment Topic Goes Here'}
                  </h2>
                </div>

               
                {/* === PREVIEW MIDDLE SECTION (COURSE) === */}
                <div className="flex flex-col gap-4 pt-4 w-fit mx-auto">
                  <div className="flex items-center justify-start text-left gap-3">
                    <span className="font-bold uppercase font-['Arial',_Helvetica,_sans-serif] text-sm">Course Title:</span>
                    <span className="font-normal text-lg">{formData.courseTitle}</span>
                  </div>
                  <div className="flex items-center justify-start text-left gap-3">
                    <span className="font-bold uppercase font-['Arial',_Helvetica,_sans-serif] text-sm">Course Code:</span>
                    <span className="font-normal text-lg">{formData.courseCode}</span>
                  </div>
                </div>
              </div>

              {/* === PREVIEW BOTTOM SECTION === */}
              <div className="flex justify-between items-start w-full mt-16">
                <div className="w-[45%] pr-6 text-left">
                  <h3 className="text-sm font-bold uppercase mb-6 font-['Arial',_Helvetica,_sans-serif] tracking-wider">Submitted To:</h3>
                  <p className="text-xl font-bold mb-1">{formData.instructorName}</p>
                  <p className="text-lg font-normal">{formData.instructorDesignation}</p>
                </div>

                <div className="w-[45%] pl-6 text-left">
                  <h3 className="text-sm font-bold uppercase mb-6 font-['Arial',_Helvetica,_sans-serif] tracking-wider">Submitted By:</h3>
                  <p className="text-xl font-bold mb-2">{formData.studentName}</p>
                  
                 {/* === PREVIEW BOTTOM SECTION (ID/BATCH) === */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center justify-start text-left gap-3">
                      <span className="font-bold uppercase font-['Arial',_Helvetica,_sans-serif] text-sm">ID:</span> 
                      <span className="font-normal text-lg">{formData.studentId}</span>
                    </div>
                    <div className="flex items-center justify-start text-left gap-3">
                      <span className="font-bold uppercase font-['Arial',_Helvetica,_sans-serif] text-sm">Batch:</span>
                      <span className="font-normal text-lg">{formData.batch}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-auto">
                <p className="text-lg">
                  <span className="font-bold uppercase mr-3 font-['Arial',_Helvetica,_sans-serif] text-sm tracking-wider">Date of Submission:</span>
                  <span className="font-normal">{formattedDateString}</span>
                </p>
              </div>

          </div>
        </div>

        {/* MOBILE BUTTONS */}
        <div className="lg:hidden flex gap-3 w-full max-w-sm relative z-10 pt-4 pb-24">
          <button onClick={handleReset} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black uppercase tracking-widest py-3 rounded-lg transition-all">
            Clear
          </button>
          
      {/* THE CLEAN MOBILE DOWNLOAD BUTTON */}
          <div 
            className="flex-[2]"
            onClick={() => {
              window.umami?.track('Download PDF', {
                course: formData.courseCode || 'Unknown_Course',
                batch: formData.batch || 'Unknown_Batch'
              });
            }}
          >
            <PDFDownloadLink 
              document={<CoverPDF formData={formData} formattedDate={formattedDateString} />} 
              fileName={filename}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest py-3 px-6 rounded-lg shadow-lg transition-all flex justify-center items-center w-full h-full"
            >
              {({ loading }) => (loading ? 'Generating...' : 'Download')}
            </PDFDownloadLink>
          </div>
        </div>

      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'form' ? 'text-emerald-700 bg-emerald-50 border-t-2 border-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Edit Details
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'preview' ? 'text-emerald-700 bg-emerald-50 border-t-2 border-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Preview & PDF
        </button>
      </div>
    </div>
  );
}

export default App;