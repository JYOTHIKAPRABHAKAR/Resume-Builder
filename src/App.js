import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Context for Resume Data ---
const ResumeContext = createContext();

const ResumeProvider = ({ children }) => {
  const [resumeData, setResumeData] = useState(() => {
    const savedData = localStorage.getItem('autoResumeData');
    return savedData ? JSON.parse(savedData) : {
      personalInfo: {},
      education: [],
      workExperience: [],
      skills: [],
      projects: [],
      hobbies: [],
      achievements: [],
      certifications: [],
    };
  });
  const [currentTemplate, setCurrentTemplate] = useState('modern');

  useEffect(() => {
    localStorage.setItem('autoResumeData', JSON.stringify(resumeData));
  }, [resumeData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser !== user.email) {
          setResumeData({
            personalInfo: {},
            education: [],
            workExperience: [],
            skills: [],
            projects: [],
            hobbies: [],
            achievements: [],
            certifications: [],
          });
          localStorage.setItem('currentUser', user.email);
        }
      } else {
        localStorage.removeItem('currentUser');
      }
    });

    return () => unsubscribe();
  }, []);

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
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({ email: user.email, uid: user.uid });
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const clearUserData = () => {
    localStorage.removeItem('autoResumeData');
    localStorage.removeItem('autoResumeSavedResumes');
  };

  const registerUser = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
        role: 'user'
      });
      clearUserData();
      return { success: true, message: 'Registration successful!' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      clearUserData();
      return { success: true, message: 'Login successful!' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate('/');
      console.log('Logged out.');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, registerUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- UI Components ---
const InputField = ({ label, type = 'text', name, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
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

const MessageBox = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
        <p className="text-lg text-gray-800 mb-4">{message}</p>
        <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">
          OK
        </Button>
      </div>
    </div>
  );
};

// --- Resume Template ---
const ModernTemplate = ({ data }) => (
  <div className="font-sans text-gray-800">
    {data.personalInfo && (
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-4xl font-bold text-indigo-700 mb-1">{data.personalInfo.name || 'Your Name'}</h1>
        <p className="text-lg text-gray-600">{data.personalInfo.title || 'Professional Title'}</p>
        <p className="text-sm text-gray-500 mt-2">
          {data.personalInfo.email && <span className="mr-3">{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span className="mr-3">{data.personalInfo.phone}</span>}
          {data.personalInfo.linkedin && (
            <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline mr-3">LinkedIn</a>
          )}
          {data.personalInfo.github && (
            <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">GitHub</a>
          )}
        </p>
      </div>
    )}

    {data.personalInfo && data.personalInfo.summary && (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-3 border-b pb-2">Summary</h2>
        <p className="text-gray-700 leading-relaxed">{data.personalInfo.summary}</p>
      </div>
    )}

    {data.education && data.education.length > 0 && (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-3 border-b pb-2">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h3 className="text-lg font-bold">{edu.degree || 'Degree'} in {edu.fieldOfStudy || 'Field of Study'}</h3>
            <p className="text-md text-gray-700">{edu.institution || 'Institution'}, {edu.location || 'Location'}</p>
            <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate || 'Present'}</p>
            {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
          </div>
        ))}
      </div>
    )}

    {data.workExperience && data.workExperience.length > 0 && (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-3 border-b pb-2">Work Experience</h2>
        {data.workExperience.map((exp, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h3 className="text-lg font-bold">{exp.title || 'Job Title'} at {exp.company || 'Company'}</h3>
            <p className="text-md text-gray-700">{exp.location || 'Location'}</p>
            <p className="text-sm text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
            {exp.description && (
              <ul className="list-disc list-inside text-gray-700 mt-2">
                {exp.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    )}

    {data.skills && data.skills.length > 0 && (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-3 border-b pb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill, index) => (
            <span key={index} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}

    {data.projects && data.projects.length > 0 && (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-3 border-b pb-2">Projects</h2>
        {data.projects.map((proj, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h3 className="text-lg font-bold">{proj.name || 'Project Name'}</h3>
            <p className="text-sm text-gray-500">{proj.startDate} - {proj.endDate || 'Present'}</p>
            {proj.description && (
              <ul className="list-disc list-inside text-gray-700 mt-2">
                {proj.description.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
              </ul>
            )}
            {proj.url && (
              <p className="text-sm mt-1">
                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">View Project</a>
              </p>
            )}
          </div>
        ))}
      </div>
    )}

    {data.certifications && data.certifications.length > 0 && (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-3 border-b pb-2">Certifications</h2>
        {data.certifications.map((cert, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h3 className="text-lg font-bold">{cert.name || 'Certification Name'}</h3>
            <p className="text-md text-gray-700">{cert.issuer || 'Issuing Organization'}</p>
            <p className="text-sm text-gray-500">{cert.issueDate} - {cert.expiryDate || 'No Expiry'}</p>
            {cert.credentialId && <p className="text-sm text-gray-600">Credential ID: {cert.credentialId}</p>}
            {cert.url && (
              <p className="text-sm mt-1">
                <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Verify Credential</a>
              </p>
            )}
          </div>
        ))}
      </div>
    )}

    {data.achievements && data.achievements.length > 0 && (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-3 border-b pb-2">Achievements</h2>
        {data.achievements.map((achievement, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h3 className="text-lg font-bold">{achievement.title || 'Achievement Title'}</h3>
            <p className="text-md text-gray-700">{achievement.organization || 'Organization'}</p>
            <p className="text-sm text-gray-500">{achievement.date}</p>
            {achievement.description && (
              <p className="text-gray-700 mt-2 leading-relaxed">{achievement.description}</p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

// --- Pages ---
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { registerUser, login } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const result = await login(email, password);
      setMessage(result.message);
      if (result.success) {
        navigate('/resume-form');
      }
    } else {
      const result = await registerUser(email, password);
      setMessage(result.message);
      if (result.success) {
        navigate('/resume-form');
      }
    }
  };

    return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="text-3xl font-bold text-center mb-2">Welcome</h2>
        <p className="text-center text-gray-400 mb-8">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              className="auth-input-field"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-8">
            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              id="password"
              className="auth-input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn-signin mb-6">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="auth-link-text font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
        
        <MessageBox message={message} onClose={() => setMessage('')} />
      </div>
    </div>
  );
};

const ResumeForm = () => {
  const { resumeData, updateResumeData } = useContext(ResumeContext);
  const { logout } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [localSkillsInput, setLocalSkillsInput] = useState(resumeData.skills.join(', '));
  const resumeRef = useRef();
  
  const steps = [
    { name: 'Personal Info', key: 'personalInfo' },
    { name: 'Education', key: 'education' },
    { name: 'Work Experience', key: 'workExperience' },
    { name: 'Skills', key: 'skills' },
    { name: 'Projects', key: 'projects' },
    { name: 'Certifications', key: 'certifications' },
    { name: 'Achievements', key: 'achievements' },
  ];

  const parseCommaSeparatedString = (str) => str.split(',').map(s => s.trim()).filter(s => s !== '');

  const handleNext = () => {
    if (steps[step].key === 'skills') {
      updateResumeData('skills', parseCommaSeparatedString(localSkillsInput));
    }

    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setMessage('Resume data submitted! You can now view the preview.');
    }
  };

  const handleBack = () => {
    if (steps[step].key === 'skills') {
      updateResumeData('skills', parseCommaSeparatedString(localSkillsInput));
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

  const handleDownload = async () => {
    const input = resumeRef.current;
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('resume.pdf');
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
              value={localSkillsInput}
              onChange={(e) => setLocalSkillsInput(e.target.value)}
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
      case 'certifications':
        return (
          <div>
            {resumeData.certifications.map((cert, index) => (
              <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                <InputField label="Certification Name" name="name" value={cert.name} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} placeholder="AWS Certified Solutions Architect" />
                <InputField label="Issuing Organization" name="issuer" value={cert.issuer} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} placeholder="Amazon Web Services" />
                <InputField label="Issue Date" type="month" name="issueDate" value={cert.issueDate} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} />
                <InputField label="Expiry Date (Optional)" type="month" name="expiryDate" value={cert.expiryDate} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} />
                <InputField label="Credential ID (Optional)" name="credentialId" value={cert.credentialId} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} placeholder="AWS-123456789" />
                <InputField label="Credential URL (Optional)" name="url" value={cert.url} onChange={(e) => handleArrayItemChange('certifications', index, e.target.name, e.target.value)} placeholder="https://aws.amazon.com/verification" />
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
      case 'achievements':
        return (
          <div>
            {resumeData.achievements.map((achievement, index) => (
              <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                <InputField label="Achievement Title" name="title" value={achievement.title} onChange={(e) => handleArrayItemChange('achievements', index, e.target.name, e.target.value)} placeholder="Employee of the Year" />
                <InputField label="Organization" name="organization" value={achievement.organization} onChange={(e) => handleArrayItemChange('achievements', index, e.target.name, e.target.value)} placeholder="Tech Solutions Inc." />
                <InputField label="Date" type="month" name="date" value={achievement.date} onChange={(e) => handleArrayItemChange('achievements', index, e.target.name, e.target.value)} />
                <TextAreaField label="Description" name="description" value={achievement.description} onChange={(e) => handleArrayItemChange('achievements', index, e.target.name, e.target.value)} placeholder="Recognized for outstanding performance and leadership in developing innovative solutions..." />
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col lg:flex-row items-start justify-center gap-8 px-4 py-8">
      <div className="w-full max-w-md lg:max-w-lg flex-shrink-0">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Resume Builder</h2>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
        >
          Logout
        </button>
      </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {steps.map((s, i) => (
          <button
            key={s.key}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl whitespace-nowrap transition font-medium min-w-max flex-shrink-0
              ${i === step
                    ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-300'}
            `}
            onClick={() => setStep(i)}
          >
            <span className="text-xl">
              {s.key === 'personalInfo' && '👤'}
              {s.key === 'education' && '🎓'}
              {s.key === 'workExperience' && '💼'}
              {s.key === 'skills' && '⚡'}
              {s.key === 'projects' && '🚀'}
              {s.key === 'certifications' && '🏆'}
              {s.key === 'achievements' && '⭐'}
            </span>
            <span className="font-semibold">{i + 1}. {s.name}</span>
          </button>
        ))}
      </div>
          
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">
                {steps[step].key === 'personalInfo' && '👤'}
                {steps[step].key === 'education' && '🎓'}
                {steps[step].key === 'workExperience' && '💼'}
                {steps[step].key === 'skills' && '⚡'}
                {steps[step].key === 'projects' && '🚀'}
                {steps[step].key === 'certifications' && '🏆'}
                {steps[step].key === 'achievements' && '⭐'}
              </span>
              {steps[step].name}
            </h3>
        {renderCurrentStep()}
      </div>
          
          <div className="flex justify-between gap-2">
        <button
          onClick={handleBack}
          className={`px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition ${step === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={step === 0}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow hover:from-cyan-400 hover:to-blue-400 transition"
        >
          {step === steps.length - 1 ? 'Submit & View Preview' : 'Next'}
        </button>
      </div>
    </div>
          </div>
      
      <div className="w-full max-w-2xl flex justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Live Preview</h2>
          <button className="download-btn" onClick={handleDownload}>Download PDF</button>
          <div className="border rounded-lg p-6" ref={resumeRef}>
            <ModernTemplate data={resumeData} />
    </div>
      </div>
      </div>

      <MessageBox message={message} onClose={() => setMessage('')} />
    </div>
  );
};

const Home = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <header className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center rounded-b-lg">
      <div className="text-2xl font-bold text-blue-600">
        Resume<span className="text-gray-800">Trick</span>
      </div>
    </header>

    {/* Hero Section */}
    <section className="hero-gradient py-20 md:py-32 text-center rounded-b-lg shadow-md">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
          Build Your Resume with <span className="text-blue-700">AI</span> —
        </h1>
        <p className="text-2xl md:text-3xl text-gray-700 mb-8 font-medium">
          Fast, Easy, and Free
        </p>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Create your perfect resume in no time, optimized for success.
        </p>
        <Link to="/login" className="btn-primary text-white font-semibold py-4 px-10 rounded-full shadow-lg text-lg md:text-xl focus:outline-none focus:ring-4 focus:ring-blue-300 inline-block">
          Build My Resume Now
        </Link>
      </div>
    </section>

    {/* Live Preview Section */}
    <section className="py-16 md:py-24 bg-white px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          See Your Resume Come to Life with Live Preview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="step-card bg-blue-50 p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
            <div className="text-blue-600 text-5xl mb-4">
              <i className="fas fa-eye"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Preview</h3>
            <p className="text-gray-700">Watch your resume update instantly as you type. See exactly how it will look to employers.</p>
          </div>
          {/* Feature 2 */}
          <div className="step-card bg-green-50 p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
            <div className="text-green-600 text-5xl mb-4">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Responsive</h3>
            <p className="text-gray-700">Preview your resume on different screen sizes. Ensure it looks perfect on any device.</p>
          </div>
          {/* Feature 3 */}
          <div className="step-card bg-purple-50 p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
            <div className="text-purple-600 text-5xl mb-4">
              <i className="fas fa-print"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Print-Ready Format</h3>
            <p className="text-gray-700">Your preview shows exactly how your resume will appear when printed or shared as PDF.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* <NavBar /> removed */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              <AuthProvider>
                <ResumeProvider>
                  <AuthForm />
                </ResumeProvider>
              </AuthProvider>
            } />
            <Route path="/resume-form" element={
              <AuthProvider>
                <ResumeProvider>
                      <ResumeForm />
                </ResumeProvider>
              </AuthProvider>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default AppRoutes;