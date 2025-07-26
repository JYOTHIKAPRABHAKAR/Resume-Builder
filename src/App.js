import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// Removed: import html2pdf from 'html2pdf.js'; // Will load via CDN script tag dynamically

// --- Context for Resume Data ---
const ResumeContext = createContext();

const ResumeProvider = ({ children }) => {
  const [resumeData, setResumeData] = useState(() => {
    // Initialize from localStorage if available
    const savedData = localStorage.getItem('autoResumeData');
    return savedData ? JSON.parse(savedData) : {
      personalInfo: {},
      education: [],
      workExperience: [],
      skills: [],
      projects: [],
      hobbies: [],
      achievements: [], // Added achievements
      certifications: [], // Added certifications
    };
  });
  const [currentTemplate, setCurrentTemplate] = useState('modern'); // Default template

  useEffect(() => {
    // Save resume data to localStorage on changes
    localStorage.setItem('autoResumeData', JSON.stringify(resumeData));
  }, [resumeData]);

  const updateResumeData = (section, data) => {
    setResumeData(prevData => ({
      ...prevData,
      [section]: data,
    }));
  };

  return (
    <ResumeContext.Provider value={{ resumeData, updateResumeData, currentTemplate, setCurrentTemplate }}>
      {children}
    </ResumeContext.Provider>
  );
};

// --- Authentication Context ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null for logged out, { email: '...', role: 'user' } or { email: '...', role: 'admin' }
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const storedUsers = localStorage.getItem('autoResumeRegisteredUsers');
    return storedUsers ? JSON.parse(storedUsers) : [
      // Add a default admin and user for initial testing
      { email: 'admin@example.com', passwordHash: 'admin', role: 'admin' },
      { email: 'user@example.com', passwordHash: 'password', role: 'user' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('autoResumeRegisteredUsers', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const registerUser = (email, password) => {
    // In a real app, password would be hashed with bcrypt
    const passwordHash = password; // Mock hash for frontend demo
    if (registeredUsers.some(u => u.email === email)) {
      return { success: false, message: 'User with this email already exists.' };
    }
    const newUser = { email, passwordHash, role: 'user' }; // New registrations are always 'user'
    setRegisteredUsers(prev => [...prev, newUser]);
    return { success: true, message: 'Registration successful!' };
  };

  const login = (email, password) => {
    const foundUser = registeredUsers.find(u => u.email === email && u.passwordHash === password);
    if (foundUser) {
      setUser({ email: foundUser.email, role: foundUser.role });
      setIsLoggedIn(true);
      console.log(`${foundUser.role} logged in: ${foundUser.email}`);
      return { success: true, message: 'Login successful!' };
    } else {
      return { success: false, message: 'Invalid email or password.' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    console.log('Logged out.');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, registerUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Reusable UI Components ---
const InputField = ({ label, type = 'text', name, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      {(name === 'email' || name === 'password') && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {name === 'email' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a4 4 0 01-8 0v-1" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104.896-2 2-2s2 .896 2 2v1h-4v-1zm-2 4h8v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2zm2-4V7a4 4 0 118 0v4" /></svg>
          )}
        </span>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-150 ${
          (name === 'email' || name === 'password') ? 'pl-10' : ''
        }`}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows="3"
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    ></textarea>
  </div>
);

const Button = ({ children, onClick, className = '', ...props }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-medium text-white shadow-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-95 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// --- Custom Message Box ---
const MessageBox = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 modal-fade">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
        <p className="text-lg text-gray-800 mb-4">{message}</p>
        <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">
          OK
        </Button>
      </div>
    </div>
  );
};

// --- Custom Confirm Box ---
const ConfirmBox = ({ message, onConfirm, onCancel }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 modal-fade">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
        <p className="text-lg text-gray-800 mb-4">{message}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Yes
          </Button>
          <Button onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">
            No
          </Button>
        </div>
      </div>
    </div>
  );
};


// --- Resume Templates ---

// Basic Template (Modern)
const ModernTemplate = ({ data }) => (
  <div className="responsive-section font-sans text-gray-800">
    {/* Personal Info */}
    {data.personalInfo && (
      <div className="text-center mb-4 sm:mb-6 border-b pb-2 sm:pb-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-indigo-700 mb-1">{data.personalInfo.name || 'Your Name'}</h1>
        <p className="text-md sm:text-lg text-gray-600">{data.personalInfo.title || 'Professional Title'}</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 flex flex-wrap justify-center gap-x-2">
          {data.personalInfo.email && <span className="mr-1 sm:mr-3">{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span className="mr-1 sm:mr-3">{data.personalInfo.phone}</span>}
          {data.personalInfo.linkedin && (
            <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline mr-1 sm:mr-3">LinkedIn</a>
          )}
          {data.personalInfo.github && (
            <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">GitHub</a>
          )}
        </p>
      </div>
    )}

    {/* Summary */}
    {data.personalInfo && data.personalInfo.summary && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Summary</h2>
        <p className="text-sm sm:text-gray-700 leading-relaxed">{data.personalInfo.summary}</p>
      </div>
    )}

    {/* Education */}
    {data.education && data.education.length > 0 && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-3 sm:mb-4 last:mb-0">
            <h3 className="text-md sm:text-lg font-bold">{edu.degree || 'Degree'} in {edu.fieldOfStudy || 'Field of Study'}</h3>
            <p className="text-sm sm:text-md text-gray-700">{edu.institution || 'Institution'}, {edu.location || 'Location'}</p>
            <p className="text-xs sm:text-sm text-gray-500">{edu.startDate} - {edu.endDate || 'Present'}</p>
            {edu.gpa && <p className="text-xs sm:text-sm text-gray-600">GPA: {edu.gpa}</p>}
          </div>
        ))}
      </div>
    )}

    {/* Work Experience */}
    {data.workExperience && data.workExperience.length > 0 && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Work Experience</h2>
        {data.workExperience.map((exp, index) => (
          <div key={index} className="mb-3 sm:mb-4 last:mb-0">
            <h3 className="text-md sm:text-lg font-bold">{exp.title || 'Job Title'} at {exp.company || 'Company'}</h3>
            <p className="text-sm sm:text-md text-gray-700">{exp.location || 'Location'}</p>
            <p className="text-xs sm:text-sm text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
            {exp.description && (
              <ul className="list-disc list-inside text-sm sm:text-gray-700 mt-1 sm:mt-2">
                {exp.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Skills */}
    {data.skills && data.skills.length > 0 && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Skills</h2>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {data.skills.map((skill, index) => (
            <span key={index} className="bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Projects */}
    {data.projects && data.projects.length > 0 && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Projects / Achievements</h2>
        {data.projects.map((proj, index) => (
          <div key={index} className="mb-3 sm:mb-4 last:mb-0">
            <h3 className="text-md sm:text-lg font-bold">{proj.name || 'Project Name'}</h3>
            <p className="text-xs sm:text-sm text-gray-500">{proj.startDate} - {proj.endDate || 'Present'}</p>
            {proj.description && (
              <ul className="list-disc list-inside text-sm sm:text-gray-700 mt-1 sm:mt-2">
                {proj.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
              </ul>
            )}
            {proj.url && (
              <p className="text-xs sm:text-sm mt-1">
                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">View Project</a>
              </p>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Hobbies */}
    {data.hobbies && data.hobbies.length > 0 && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Hobbies</h2>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {data.hobbies.map((hobby, index) => (
            <span key={index} className="bg-purple-100 text-purple-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
              {hobby}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Achievements */}
    {data.achievements && data.achievements.length > 0 && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Achievements</h2>
        {data.achievements.map((ach, index) => (
          <div key={index} className="mb-3 sm:mb-4 last:mb-0">
            <h3 className="text-md sm:text-lg font-bold">{ach.name || 'Achievement Name'}</h3>
            <p className="text-xs sm:text-sm text-gray-500">{ach.date}</p>
            {ach.description && (
              <ul className="list-disc list-inside text-sm sm:text-gray-700 mt-1 sm:mt-2">
                {ach.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Certifications */}
    {data.certifications && data.certifications.length > 0 && (
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-2 sm:mb-3 border-b pb-1 sm:pb-2">Certifications</h2>
        {data.certifications.map((cert, index) => (
          <div key={index} className="mb-3 sm:mb-4 last:mb-0">
            <h3 className="text-md sm:text-lg font-bold">{cert.name || 'Certification Name'}</h3>
            <p className="text-sm sm:text-md text-gray-700">Issued by: {cert.issuingBody || 'Issuing Body'}</p>
            <p className="text-xs sm:text-sm text-gray-500">
              Issued: {cert.issueDate} {cert.expirationDate && `- Expires: ${cert.expirationDate}`}
            </p>
            {cert.credentialUrl && (
              <p className="text-xs sm:text-sm mt-1">
                <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">View Credential</a>
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Professional Template
const ProfessionalTemplate = ({ data }) => (
  <div className="responsive-section font-serif text-gray-900 border-t-4 sm:border-t-8 border-blue-700">
    {/* Header */}
    {data.personalInfo && (
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-800 tracking-wide">{data.personalInfo.name || 'Your Name'}</h1>
        <p className="text-md sm:text-xl text-gray-700 mt-1 sm:mt-2">{data.personalInfo.title || 'Professional Title'}</p>
        <div className="flex justify-center flex-wrap gap-x-2 sm:gap-x-4 text-xs sm:text-sm text-gray-600 mt-2 sm:mt-4">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo.linkedin && (
            <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
          )}
          {data.personalInfo.github && (
            <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>
          )}
        </div>
      </div>
    )}

    {/* Sections */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
      <div className="md:col-span-2">
        {/* Summary */}
        {data.personalInfo && data.personalInfo.summary && (
          <Section title="Summary">
            <p className="text-sm sm:text-gray-800 leading-relaxed">{data.personalInfo.summary}</p>
          </Section>
        )}

        {/* Work Experience */}
        {data.workExperience && data.workExperience.length > 0 && (
          <Section title="Work Experience">
            {data.workExperience.map((exp, index) => (
              <div key={index} className="mb-4 sm:mb-6 last:mb-0">
                <div className="flex flex-col sm:flex-row justify-between items-baseline">
                  <h3 className="text-md sm:text-lg font-bold text-blue-700">{exp.title || 'Job Title'}</h3>
                  <span className="text-xs sm:text-sm text-gray-600">{exp.startDate} - {exp.endDate || 'Present'}</span>
                </div>
                <p className="text-sm sm:text-md text-gray-800 mb-0 sm:mb-1">{exp.company || 'Company'}, {exp.location || 'Location'}</p>
                {exp.description && (
                  <ul className="list-disc list-inside text-sm sm:text-gray-700 mt-1 sm:mt-2">
                    {exp.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <Section title="Projects / Achievements">
            {data.projects.map((proj, index) => (
              <div key={index} className="mb-4 sm:mb-6 last:mb-0">
                <div className="flex flex-col sm:flex-row justify-between items-baseline">
                  <h3 className="text-md sm:text-lg font-bold text-blue-700">{proj.name || 'Project Name'}</h3>
                  <span className="text-xs sm:text-sm text-gray-600">{proj.startDate} - {proj.endDate || 'Present'}</span>
                </div>
                {proj.description && (
                  <ul className="list-disc list-inside text-sm sm:text-gray-700 mt-1 sm:mt-2">
                    {proj.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
                  </ul>
                )}
                {proj.url && (
                  <p className="text-xs sm:text-sm mt-1">
                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Project</a>
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Achievements */}
        {data.achievements && data.achievements.length > 0 && (
          <Section title="Achievements">
            {data.achievements.map((ach, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <h3 className="text-md sm:text-lg font-bold text-blue-700">{ach.name || 'Achievement Name'}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{ach.date}</p>
                {ach.description && (
                  <ul className="list-disc list-inside text-sm sm:text-gray-700 mt-1 sm:mt-2">
                    {ach.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>

      <div>
        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <Section title="Skills">
            <ul className="list-disc list-inside text-sm sm:text-gray-800">
              {data.skills.map((skill, index) => (
                <li key={index} className="mb-1">{skill}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <Section title="Education">
            {data.education.map((edu, index) => (
              <div key={index} className="mb-3 sm:mb-4 last:mb-0">
                <h3 className="text-md sm:text-lg font-bold text-blue-700">{edu.degree || 'Degree'}</h3>
                <p className="text-sm sm:text-md text-gray-800">{edu.institution || 'Institution'}</p>
                <p className="text-xs sm:text-sm text-gray-600">{edu.startDate} - {edu.endDate || 'Present'}</p>
                {edu.gpa && <p className="text-xs sm:text-sm text-gray-700">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* Hobbies */}
        {data.hobbies && data.hobbies.length > 0 && (
          <Section title="Hobbies">
            <ul className="list-disc list-inside text-sm sm:text-gray-800">
              {data.hobbies.map((hobby, index) => (
                <li key={index} className="mb-1">{hobby}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <Section title="Certifications">
            {data.certifications.map((cert, index) => (
              <div key={index} className="mb-3 sm:mb-4 last:mb-0">
                <h3 className="text-md sm:text-lg font-bold text-blue-700">{cert.name || 'Certification Name'}</h3>
                <p className="text-sm sm:text-md text-gray-800">Issued by: {cert.issuingBody || 'Issuing Body'}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Issued: {cert.issueDate} {cert.expirationDate && `- Expires: ${cert.expirationDate}`}
                </p>
                {cert.credentialUrl && (
                  <p className="text-xs sm:text-sm mt-1">
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Credential</a>
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  </div>
);

// Helper for Professional Template sections
const Section = ({ title, children }) => (
  <div className="mb-6 sm:mb-8">
    <h2 className="text-xl sm:text-2xl font-bold text-blue-700 border-b-2 border-blue-500 pb-1 sm:pb-2 mb-3 sm:mb-4">{title}</h2>
    {children}
  </div>
);


const resumeTemplates = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  // Add more templates here
};

// --- Pages / Views ---

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { registerUser, login } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      const result = login(email, password);
      setMessage(result.message);
      if (result.success) {
        navigate('/resume-form');
      }
    } else {
      const result = registerUser(email, password);
      setMessage(result.message);
      if (result.success) {
        login(email, password);
        navigate('/resume-form');
      }
    }
  };

  return (
    <div className="flex-center">
      <div className="login-card">
        <div className="login-emoji" aria-label="lock" role="img">🔒</div>
        <div className="login-title">{isLogin ? 'Login' : 'Sign Up'}</div>
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="input-group">
            <span className="input-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2.25 6.75C2.25 5.50736 3.25736 4.5 4.5 4.5H19.5C20.7426 4.5 21.75 5.50736 21.75 6.75V17.25C21.75 18.4926 20.7426 19.5 19.5 19.5H4.5C3.25736 19.5 2.25 18.4926 2.25 17.25V6.75Z" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.75 8.25H17.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <input
              className="login-input"
              type="email"
              name="email"
              placeholder="your@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <span className="input-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 17.25C13.2426 17.25 14.25 16.2426 14.25 15C14.25 13.7574 13.2426 12.75 12 12.75C10.7574 12.75 9.75 13.7574 9.75 15C9.75 16.2426 10.7574 17.25 12 17.25Z" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.5 10.5V7.5C19.5 5.01472 17.4853 3 15 3H9C6.51472 3 4.5 5.01472 4.5 7.5V10.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.5 10.5H19.5V17.25C19.5 18.4926 18.4926 19.5 17.25 19.5H6.75C5.50736 19.5 4.5 18.4926 4.5 17.25V10.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <input
              className="login-input"
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <div className="login-footer">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            type="button"
            className="signup-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
        <MessageBox message={message} onClose={() => setMessage('')} />
      </div>
    </div>
  );
};

const ResumeForm = () => {
  const { resumeData, updateResumeData } = useContext(ResumeContext);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [localSkillsInput, setLocalSkillsInput] = useState(resumeData.skills.join(', '));
  const [localHobbiesInput, setLocalHobbiesInput] = useState(resumeData.hobbies.join(', '));
  const steps = [
    { name: 'Personal Info', key: 'personalInfo', icon: '👤' },
    { name: 'Education', key: 'education', icon: '🎓' },
    { name: 'Work Experience', key: 'workExperience', icon: '💼' },
    { name: 'Skills', key: 'skills', icon: '🛠' },
    { name: 'Projects', key: 'projects', icon: '📁' },
    { name: 'Hobbies', key: 'hobbies', icon: '🎨' },
    { name: 'Achievements', key: 'achievements', icon: '🏆' },
    { name: 'Certifications', key: 'certifications', icon: '📜' },
  ];
  useEffect(() => {
    if (steps[step].key === 'skills') {
      setLocalSkillsInput(resumeData.skills.join(', '));
    } else if (steps[step].key === 'hobbies') {
      setLocalHobbiesInput(resumeData.hobbies.join(', '));
    }
  }, [step, resumeData.skills, resumeData.hobbies]);
  const parseCommaSeparatedString = (str) => str.split(',').map(s => s.trim()).filter(s => s !== '');
  const validateDates = (sectionKey, item, index) => {
    if (item.startDate && item.endDate) {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      if (end < start) {
        setMessage(`Error in ${steps[step].name} (item ${index + 1}): End Date cannot be before Start Date.`);
        return false;
      }
    }
    return true;
  };
  const handleNext = () => {
    let isValid = true;

    if (steps[step].key === 'skills') {
      updateResumeData('skills', parseCommaSeparatedString(localSkillsInput));
    } else if (steps[step].key === 'hobbies') {
      updateResumeData('hobbies', parseCommaSeparatedString(localHobbiesInput));
    } else if (steps[step].key === 'education') {
      resumeData.education.forEach((item, index) => {
        if (!validateDates('education', item, index)) isValid = false;
      });
    } else if (steps[step].key === 'workExperience') {
      resumeData.workExperience.forEach((item, index) => {
        if (!validateDates('workExperience', item, index)) isValid = false;
      });
    } else if (steps[step].key === 'projects') {
      resumeData.projects.forEach((item, index) => {
        if (!validateDates('projects', item, index)) isValid = false;
      });
    } else if (steps[step].key === 'certifications') {
        resumeData.certifications.forEach((item, index) => {
          if (item.issueDate && item.expirationDate) {
            const issue = new Date(item.issueDate);
            const expiration = new Date(item.expirationDate);
            if (expiration < issue) {
              setMessage(`Error in Certifications (item ${index + 1}): Expiration Date cannot be before Issue Date.`);
              isValid = false;
            }
          }
        });
    }


    if (!isValid) return;

    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      // This is the "Submit" action
      setMessage('Resume data submitted! You can now view the preview and download the PDF.');
      // In a real app, you'd send data to backend here
      console.log('Resume data submitted:', resumeData);
    }
  };

  const handleBack = () => {
    // Save current step's data before moving back
    if (steps[step].key === 'skills') {
      updateResumeData('skills', parseCommaSeparatedString(localSkillsInput));
    } else if (steps[step].key === 'hobbies') {
      updateResumeData('hobbies', parseCommaSeparatedString(localHobbiesInput));
    }
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handlePersonalInfoChange = (e) => {
    updateResumeData('personalInfo', {
      ...resumeData.personalInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleArrayItemChange = (sectionKey, index, field, value) => {
    const updatedArray = [...resumeData[sectionKey]];
    updatedArray[index] = { ...updatedArray[index], [field]: value };
    updateResumeData(sectionKey, updatedArray);
  };

  const addArrayItem = (sectionKey, newItem) => {
    updateResumeData(sectionKey, [...resumeData[sectionKey], newItem]);
  };

  const removeArrayItem = (sectionKey, index) => {
    const updatedArray = resumeData[sectionKey].filter((_, i) => i !== index);
    updateResumeData(sectionKey, updatedArray);
  };

  // Modified handlers to update local state
  const handleSkillsChange = (e) => {
    setLocalSkillsInput(e.target.value);
  };

  const handleHobbiesChange = (e) => {
    setLocalHobbiesInput(e.target.value);
  };

  const renderCurrentStep = () => {
    switch (steps[step].key) {
      case 'personalInfo':
        return (
          <div>
            <InputField label="Full Name" name="name" value={resumeData.personalInfo.name} onChange={handlePersonalInfoChange} placeholder="John Doe" />
            <InputField label="Professional Title" name="title" value={resumeData.personalInfo.title} onChange={handlePersonalInfoChange} placeholder="Software Engineer" />
            <InputField label="Email" type="email" name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfoChange} placeholder="john.doe@example.com" />
            <InputField label="Phone" type="tel" name="phone" value={resumeData.personalInfo.phone} onChange={handlePersonalInfoChange} placeholder="+1 (123) 456-7890" />
            <InputField label="LinkedIn Profile" name="linkedin" value={resumeData.personalInfo.linkedin} onChange={handlePersonalInfoChange} placeholder="https://linkedin.com/in/johndoe" />
            <InputField label="GitHub Profile" name="github" value={resumeData.personalInfo.github} onChange={handlePersonalInfoChange} placeholder="https://github.com/johndoe" />
            <TextAreaField label="Summary / Objective" name="summary" value={resumeData.personalInfo.summary} onChange={handlePersonalInfoChange} placeholder="A brief summary of your professional background and goals." />
          </div>
        );
      case 'education':
        return (
          <div>
            {resumeData.education.map((edu, index) => (
              <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                <InputField label="Degree" name="degree" value={edu.degree} onChange={(e) => handleArrayItemChange('education', index, e.target.name, e.target.value)} placeholder="B.Sc. Computer Science" />
                <InputField label="Field of Study" name="fieldOfStudy" value={edu.fieldOfStudy} onChange={(e) => handleArrayItemChange('education', index, e.target.name, e.target.value)} placeholder="Computer Science" />
                <InputField label="Institution" name="institution" value={edu.institution} onChange={(e) => handleArrayItemChange('education', index, e.target.name, e.target.value)} placeholder="University of Example" />
                <InputField label="Location" name="location" value={edu.location} onChange={(e) => handleArrayItemChange('education', index, e.target.name, e.target.value)} placeholder="City, State" />
                <InputField label="Start Date" type="month" name="startDate" value={edu.startDate} onChange={(e) => handleArrayItemChange('education', index, e.target.name, e.target.value)} />
                <InputField label="End Date" type="month" name="endDate" value={edu.endDate} onChange={(e) => handleArrayItemChange('education', index, e.target.name, e.target.value)} />
                <InputField label="GPA (Optional)" name="gpa" value={edu.gpa} onChange={(e) => handleArrayItemChange('education', index, e.target.name, e.target.value)} placeholder="3.8 / 4.0" />
                <Button onClick={() => removeArrayItem('education', index)} className="bg-red-500 hover:bg-red-600 text-sm mt-2">
                  Remove Education
                </Button>
              </div>
            ))}
            <Button onClick={() => addArrayItem('education', {})} className="bg-green-500 hover:bg-green-600 text-sm mt-4">
              Add Education
            </Button>
          </div>
        );
      case 'workExperience':
        return (
          <div>
            {resumeData.workExperience.map((exp, index) => (
              <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                <InputField label="Job Title" name="title" value={exp.title} onChange={(e) => handleArrayItemChange('workExperience', index, e.target.name, e.target.value)} placeholder="Software Engineer" />
                <InputField label="Company" name="company" value={exp.company} onChange={(e) => handleArrayItemChange('workExperience', index, e.target.name, e.target.value)} placeholder="Tech Solutions Inc." />
                <InputField label="Location" name="location" value={exp.location} onChange={(e) => handleArrayItemChange('workExperience', index, e.target.name, e.target.value)} placeholder="City, State" />
                <InputField label="Start Date" type="month" name="startDate" value={exp.startDate} onChange={(e) => handleArrayItemChange('workExperience', index, e.target.name, e.target.value)} />
                <InputField label="End Date" type="month" name="endDate" value={exp.endDate} onChange={(e) => handleArrayItemChange('workExperience', index, e.target.name, e.target.value)} />
                <TextAreaField label="Responsibilities / Achievements (one per line)" name="description" value={exp.description} onChange={(e) => handleArrayItemChange('workExperience', index, e.target.name, e.target.value)} placeholder="- Developed and maintained..." />
                <Button onClick={() => removeArrayItem('workExperience', index)} className="bg-red-500 hover:bg-red-600 text-sm mt-2">
                  Remove Experience
                </Button>
              </div>
            ))}
            <Button onClick={() => addArrayItem('workExperience', {})} className="bg-green-500 hover:bg-green-600 text-sm mt-4">
              Add Work Experience
            </Button>
          </div>
        );
      case 'skills':
        return (
          <div>
            <TextAreaField
              label="Skills (comma-separated)"
              name="skills"
              value={localSkillsInput} // Use local state
              onChange={handleSkillsChange} // Update local state
              placeholder="JavaScript, React, Node.js, MongoDB, AWS, Git"
            />
          </div>
        );
      case 'projects':
        return (
          <div>
            {resumeData.projects.map((proj, index) => (
              <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                <InputField label="Project Name" name="name" value={proj.name} onChange={(e) => handleArrayItemChange('projects', index, e.target.name, e.target.value)} placeholder="E-commerce Platform" />
                <InputField label="Start Date" type="month" name="startDate" value={proj.startDate} onChange={(e) => handleArrayItemChange('projects', index, e.target.name, e.target.value)} />
                <InputField label="End Date" type="month" name="endDate" value={proj.endDate} onChange={(e) => handleArrayItemChange('projects', index, e.target.name, e.target.value)} />
                <InputField label="Project URL (Optional)" name="url" value={proj.url} onChange={(e) => handleArrayItemChange('projects', index, e.target.name, e.target.value)} placeholder="https://myproject.com" />
                <TextAreaField label="Description (one per line)" name="description" value={proj.description} onChange={(e) => handleArrayItemChange('projects', index, e.target.name, e.target.value)} placeholder="- Developed a responsive UI..." />
                <Button onClick={() => removeArrayItem('projects', index)} className="bg-red-500 hover:bg-red-600 text-sm mt-2">
                  Remove Project
                </Button>
              </div>
            ))}
            <Button onClick={() => addArrayItem('projects', {})} className="bg-green-500 hover:bg-green-600 text-sm mt-4">
              Add Project
            </Button>
          </div>
        );
      case 'hobbies': // New Hobbies section
        return (
          <div>
            <TextAreaField
              label="Hobbies (comma-separated)"
              name="hobbies"
              value={localHobbiesInput} // Use local state
              onChange={handleHobbiesChange} // Update local state
              placeholder="Reading, Hiking, Photography, Cooking"
            />
          </div>
        );
      case 'achievements': // New Achievements section
        return (
          <div>
            {resumeData.achievements.map((ach, index) => (
              <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                <InputField label="Achievement Name" name="name" value={ach.name} onChange={(e) => handleArrayItemChange('achievements', index, e.target.name, e.target.value)} placeholder="Won National Coding Competition" />
                <InputField label="Date" type="month" name="date" value={ach.date} onChange={(e) => handleArrayItemChange('achievements', index, e.target.name, e.target.value)} />
                <TextAreaField label="Description (one per line)" name="description" value={ach.description} onChange={(e) => handleArrayItemChange('achievements', index, e.target.name, e.target.value)} placeholder="- Led a team to develop..." />
                <Button onClick={() => removeArrayItem('achievements', index)} className="bg-red-500 hover:bg-red-600 text-sm mt-2">
                  Remove Achievement
                </Button>
              </div>
            ))}
            <Button onClick={() => addArrayItem('achievements', {})} className="bg-green-500 hover:bg-green-600 text-sm mt-4">
              Add Achievement
            </Button>
          </div>
        );
      case 'certifications': // New Certifications section
        return (
          <div>
            {resumeData.certifications.map((cert, index) => (
              <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                <InputField label="Certification Name" name="name" value={cert.name} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} placeholder="AWS Certified Developer" />
                <InputField label="Issuing Body" name="issuingBody" value={cert.issuingBody} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} placeholder="Amazon Web Services" />
                <InputField label="Issue Date" type="month" name="issueDate" value={cert.issueDate} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} />
                <InputField label="Expiration Date (Optional)" type="month" name="expirationDate" value={cert.expirationDate} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} />
                <InputField label="Credential URL (Optional)" name="credentialUrl" value={cert.credentialUrl} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} placeholder="https://www.credly.com/badges/..." />
                <p className="text-xs text-gray-500 mt-1">Note: Direct file uploads are a backend feature. You can provide a URL to your certificate here.</p>
                <Button onClick={() => removeArrayItem('certifications', index)} className="bg-red-500 hover:bg-red-600 text-sm mt-2">
                  Remove Certification
                </Button>
              </div>
            ))}
            <Button onClick={() => addArrayItem('certifications', {})} className="bg-green-500 hover:bg-green-600 text-sm mt-4">
              Add Certification
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((s, i) => (
          <button
            key={s.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition font-medium text-base md:text-lg
              ${i === step
                ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg scale-105'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'}
            `}
            onClick={() => setStep(i)}
            type="button"
          >
            <span className="text-xl md:text-2xl flex items-center">{s.icon}</span>
            <span>{i + 1}. {s.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 animate-fade-in">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 font-poppins">{steps[step].name}</h3>
        {renderCurrentStep()}
      </div>
      <div className="flex justify-between mt-6 gap-2">
        <button
          onClick={handleBack}
          className={`px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition ${step === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={step === 0}
          type="button"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow hover:from-cyan-400 hover:to-blue-400 transition"
          type="button"
        >
          {step === steps.length - 1 ? 'Submit & View Preview' : 'Next'}
        </button>
      </div>
      <MessageBox message={message} onClose={() => setMessage('')} />
    </div>
  );
};

const ResumePreview = () => {
  const { resumeData, currentTemplate } = useContext(ResumeContext);
  const resumeRef = useRef(); // Ref for the resume content to be exported
  const [message, setMessage] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // New loading state
  const [isPdfLibLoaded, setIsPdfLibLoaded] = useState(false); // State to track if PDF library is loaded

  const TemplateComponent = resumeTemplates[currentTemplate];

  // Effect to check if html2pdf.js is loaded
  useEffect(() => {
    const checkLib = setInterval(() => {
      if (typeof window.html2pdf !== 'undefined') {
        setIsPdfLibLoaded(true);
        clearInterval(checkLib);
      }
    }, 100); // Check every 100ms

    return () => clearInterval(checkLib); // Cleanup on unmount
  }, []);

  const handleDownloadPdf = () => {
    if (resumeRef.current) {
      if (isPdfLibLoaded) { // Ensure library is loaded before proceeding
        setIsGeneratingPdf(true); // Set loading state

        const parentContainer = resumeRef.current.closest('.overflow-y-auto');
        let originalParentOverflow = '';
        let originalParentHeight = '';
        let originalParentMaxHeight = '';
        let originalBodyOverflow = '';

        // Store original styles and apply temporary ones
        if (parentContainer) {
          originalParentOverflow = parentContainer.style.overflow;
          originalParentHeight = parentContainer.style.height;
          originalParentMaxHeight = parentContainer.style.maxHeight;

          parentContainer.style.overflow = 'visible';
          parentContainer.style.height = 'auto'; // Ensure it expands to content
          parentContainer.style.maxHeight = 'none'; // Ensure it expands to content
        }

        originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'visible';

        // Get the actual rendered width and height of the resume content for html2canvas
        const renderedWidth = resumeRef.current.offsetWidth;
        const renderedHeight = resumeRef.current.offsetHeight;

        console.log('Resume Ref Width:', renderedWidth, 'Height:', renderedHeight); // Debugging

        const opt = {
          margin: 0.5,
          filename: 'resume.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#fff', // Ensures white background
            width: renderedWidth,
            height: renderedHeight,
          },
          jsPDF: {
            unit: 'in',
            format: 'a4', // or 'letter'
            orientation: 'portrait',
          },
          pagebreak: {
            mode: ['avoid-all', 'css', 'legacy'],
            before: ['.new-page-before'],
            after: ['.new-page-after'],
            avoid: ['h2', 'h3', '.no-break'],
          },
        };

        // Add a longer delay to ensure all content is rendered before capture
        setTimeout(() => {
          window.html2pdf().from(resumeRef.current).set(opt).save().then(() => {
            // Revert styles after PDF generation is complete
            if (parentContainer) {
              parentContainer.style.overflow = originalParentOverflow;
              parentContainer.style.height = originalParentHeight;
              parentContainer.style.maxHeight = originalParentMaxHeight;
            }
            document.body.style.overflow = originalBodyOverflow;
            setIsGeneratingPdf(false); // Reset loading state
          }).catch(error => {
            console.error('PDF generation failed:', error);
            setMessage('Failed to generate PDF. Please try again.');
            // Ensure styles are reverted even on error
            if (parentContainer) {
              parentContainer.style.overflow = originalParentOverflow;
              parentContainer.style.height = originalParentHeight;
              parentContainer.style.maxHeight = originalParentMaxHeight;
            }
            document.body.style.overflow = originalBodyOverflow;
            setIsGeneratingPdf(false); // Reset loading state
          });
        }, 500); // Increased delay to 500ms
      } else {
        setMessage('PDF generation library not loaded. Please wait and try again.');
        console.error('html2pdf.js is not loaded yet.');
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute -top-10 -right-10 w-32 h-32 md:w-48 md:h-48 bg-cyan-100 rounded-full opacity-30 blur-2xl pointer-events-none hidden md:block" />
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 transition-transform hover:scale-105 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Live Preview</h2>
          <button
            className="px-4 py-2 text-sm rounded-lg shadow-sm bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold transition"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !isPdfLibLoaded}
          >
            {isGeneratingPdf ? 'Generating...' : (isPdfLibLoaded ? 'Download PDF' : 'Loading...')}
          </button>
        </div>
        <div ref={resumeRef} className="resume-pdf-content font-poppins bg-white text-gray-900 p-4 sm:p-6 md:p-8 rounded-xl w-full overflow-x-auto">
          {TemplateComponent && <TemplateComponent data={resumeData} />}
        </div>
        <MessageBox message={message} onClose={() => setMessage('')} />
      </div>
    </div>
  );
};

const TemplateSelector = () => {
  const { setCurrentTemplate } = useContext(ResumeContext);

  const handleTemplateChange = (e) => {
    setCurrentTemplate(e.target.value);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-4">
      <label htmlFor="template-select" className="block text-lg font-semibold text-gray-800 mb-2">
        Choose Resume Template:
      </label>
      <select
        id="template-select"
        onChange={handleTemplateChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        {Object.keys(resumeTemplates).map(key => (
          <option key={key} value={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)} Template
          </option>
        ))}
      </select>
    </div>
  );
};

const Dashboard = () => {
  const { resumeData, setCurrentTemplate } = useContext(ResumeContext);
  const [savedResumes, setSavedResumes] = useState(() => {
    // Mock saved resumes - in a real app, this would come from a backend DB
    const storedResumes = localStorage.getItem('autoResumeSavedResumes');
    return storedResumes ? JSON.parse(storedResumes) : [];
  });
  const [message, setMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    localStorage.setItem('autoResumeSavedResumes', JSON.stringify(savedResumes));
  }, [savedResumes]);

  const handleSaveResume = () => {
    const newResume = {
      id: Date.now(), // Unique ID
      name: resumeData.personalInfo.name || `Resume ${savedResumes.length + 1}`,
      data: resumeData,
      template: 'modern', // Default template for saved resume
      savedAt: new Date().toLocaleString(),
    };
    setSavedResumes(prev => [...prev, newResume]);
    setMessage('Resume saved to dashboard!');
  };

  const handleLoadResume = (id) => {
    const resumeToLoad = savedResumes.find(r => r.id === id);
    if (resumeToLoad) {
      setMessage(`Loading resume: ${resumeToLoad.name}. In a full app, this would populate the form.`);
      setCurrentTemplate(resumeToLoad.template);
      // setResumeData(resumeToLoad.data); // This would require a setter from ResumeContext
    }
  };

  const handleDeleteResume = (id) => {
    setConfirmMessage("Are you sure you want to delete this resume?");
    setConfirmAction(() => () => {
      setSavedResumes(prev => prev.filter(r => r.id !== id));
      setMessage('Resume deleted.');
      setConfirmMessage('');
      setConfirmAction(null);
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Your Dashboard</h2>

      <div className="mb-4 sm:mb-6">
        <Button onClick={handleSaveResume} className="bg-purple-600 hover:bg-purple-700">
          Save Current Resume
        </Button>
      </div>

      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Saved Resumes</h3>
      {savedResumes.length === 0 ? (
        <p className="text-gray-500 text-sm sm:text-base">No resumes saved yet. Start creating one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto flex-grow">
          {savedResumes.map(resume => (
            <div key={resume.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm bg-gray-50">
              <h4 className="text-lg sm:text-xl font-bold text-indigo-700 mb-1 sm:mb-2">{resume.name}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Saved: {resume.savedAt}</p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">Template: {resume.template.charAt(0).toUpperCase() + resume.template.slice(1)}</p>
              <div className="flex gap-2">
                <Button onClick={() => handleLoadResume(resume.id)} className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm">
                  Load
                </Button>
                <Button onClick={() => handleDeleteResume(resume.id)} className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <MessageBox message={message} onClose={() => setMessage('')} />
      <ConfirmBox
        message={confirmMessage}
        onConfirm={confirmAction}
        onCancel={() => {
          setConfirmMessage('');
          setConfirmAction(null);
        }}
      />
    </div>
  );
};

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateConfig, setTemplateConfig] = useState('');
  const [templates, setTemplates] = useState(() => {
    const storedTemplates = localStorage.getItem('autoResumeCustomTemplates');
    return storedTemplates ? JSON.parse(storedTemplates) : [];
  });

  useEffect(() => {
    localStorage.setItem('autoResumeCustomTemplates', JSON.stringify(templates));
  }, [templates]);

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 sm:p-6 text-center text-red-500 font-bold bg-white rounded-lg shadow-md">
        Access Denied: Admins only.
      </div>
    );
  }

  const handleAddTemplate = (e) => {
    e.preventDefault();
    if (templateName && templateConfig) {
      try {
        const newTemplate = {
          id: Date.now(),
          name: templateName,
          config: JSON.parse(templateConfig), // In a real app, this would be more complex (e.g., actual React component code)
        };
        setTemplates(prev => [...prev, newTemplate]);
        setTemplateName('');
        setTemplateConfig('');
        setMessage('Template added successfully!');
      } catch (error) {
        setMessage('Invalid JSON for template config: ' + error.message);
      }
    } else {
      setMessage('Please fill in both template name and config.');
    }
  };

  const handleDeleteTemplate = (id) => {
    setConfirmMessage("Are you sure you want to delete this template?");
    setConfirmAction(() => () => {
      setTemplates(prev => prev.filter(t => t.id !== id));
      setMessage('Template deleted.');
      setConfirmMessage('');
      setConfirmAction(null);
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Admin Panel - Template Management</h2>

      <div className="mb-6 sm:mb-8 p-3 sm:p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Add New Template</h3>
        <form onSubmit={handleAddTemplate}>
          <InputField
            label="Template Name"
            name="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Creative Template"
          />
          <TextAreaField
            label="Template Configuration (JSON)"
            name="templateConfig"
            value={templateConfig}
            onChange={(e) => setTemplateConfig(e.target.value)}
            placeholder={`{
  "fontFamily": "Georgia",
  "colors": {
    "primary": "#4A90E2",
    "secondary": "#50E3C2"
  }
}`}
          />
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4">
            Add Template
          </Button>
        </form>
      </div>

      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Available Templates</h3>
      {templates.length === 0 ? (
        <p className="text-gray-500 text-sm sm:text-base">No custom templates added yet. Add one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto flex-grow">
          {templates.map(template => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm bg-gray-50">
              <h4 className="text-lg sm:text-xl font-bold text-indigo-700 mb-1 sm:mb-2">{template.name}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">ID: {template.id}</p>
              <div className="flex gap-2">
                <Button onClick={() => handleDeleteTemplate(template.id)} className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <MessageBox message={message} onClose={() => setMessage('')} />
      <ConfirmBox
        message={confirmMessage}
        onConfirm={confirmAction}
        onCancel={() => {
          setConfirmMessage('');
          setConfirmAction(null);
        }}
      />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ResumeProvider>
          <Routes>
            <Route path="/" element={<AuthForm />} />
            <Route path="/resume-form" element={
              <div className="min-h-screen bg-gradient-to-b from-[#F8F9FA] to-[#E0EAFC] flex flex-col md:flex-row items-start justify-center gap-8 px-2 py-8">
                <div className="w-full max-w-md md:max-w-lg flex-shrink-0">
                  <ResumeForm />
                </div>
                <div className="w-full max-w-2xl flex justify-center">
                  <ResumePreview />
                </div>
              </div>
            } />
            <Route path="/resume-preview" element={<ResumePreview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/template-selector" element={<TemplateSelector />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ResumeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;