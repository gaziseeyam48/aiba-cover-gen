import { createContext, useState } from 'react';

export const WizardContext = createContext();

export const WizardProvider = ({ children }) => {
  // Step 1 Data
  const [studentProfile, setStudentProfile] = useState({
    fullName: '',
    studentId: '',
    batch: '',
    section: '',
  });

  // Step 2 Data
  const [semesterTitle, setSemesterTitle] = useState(''); // e.g., Fall 2026
  const [selectedCourses, setSelectedCourses] = useState([]); 
  const [editingSemesterId, setEditingSemesterId] = useState(null);
  
  return (
    <WizardContext.Provider value={{ 
      studentProfile, setStudentProfile,
      semesterTitle, setSemesterTitle,
      selectedCourses, setSelectedCourses,
      editingSemesterId, setEditingSemesterId
    }}>
      {children}
    </WizardContext.Provider>
  );
};
