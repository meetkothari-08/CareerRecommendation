import React, { useState } from 'react';
import { User, BookOpen, Briefcase, Heart, Star, Target, Award, Code } from 'lucide-react';

interface FormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  location: string;

  // Education
  education: {
    degree: string;
    field: string;
    institution: string;
    graduationYear: string;
    gpa: string;
  };

  // Work Experience
  hasWorkExperience: boolean;
  yearsOfExperience: string;
  currentRole: string;
  industry: string;

  // Skills & Interests
  technicalSkills: string[];
  softSkills: string[];
  interests: string[];
  
  // Career Preferences
  preferredWorkEnvironment: string[];
  expectedSalary: string;
  willingToRelocate: boolean;
  preferredWorkMode: string;
}

const UserProfile: React.FC = () => {
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    location: '',
    education: {
      degree: '',
      field: '',
      institution: '',
      graduationYear: '',
      gpa: '',
    },
    hasWorkExperience: false,
    yearsOfExperience: '',
    currentRole: '',
    industry: '',
    technicalSkills: [],
    softSkills: [],
    interests: [],
    preferredWorkEnvironment: [],
    expectedSalary: '',
    willingToRelocate: false,
    preferredWorkMode: 'hybrid',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const SectionButton: React.FC<{ section: string; icon: React.ReactNode; label: string }> = ({ section, icon, label }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
        activeSection === section
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 inline-block text-transparent bg-clip-text">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Help us understand you better to provide the most accurate career recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <SectionButton section="basic" icon={<User className="h-5 w-5" />} label="Basic Information" />
            <SectionButton section="education" icon={<BookOpen className="h-5 w-5" />} label="Education" />
            <SectionButton section="experience" icon={<Briefcase className="h-5 w-5" />} label="Work Experience" />
            <SectionButton section="skills" icon={<Code className="h-5 w-5" />} label="Skills" />
            <SectionButton section="interests" icon={<Heart className="h-5 w-5" />} label="Interests" />
            <SectionButton section="preferences" icon={<Target className="h-5 w-5" />} label="Career Preferences" />
          </div>

          {/* Form Sections */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
              {/* Basic Information Section */}
              <div className={activeSection === 'basic' ? 'block' : 'hidden'}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <User className="h-6 w-6 mr-2 text-indigo-600" />
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className={activeSection === 'education' ? 'block' : 'hidden'}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-indigo-600" />
                  Education Background
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Degree Level</label>
                      <select
                        name="education.degree"
                        value={formData.education.degree}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        required
                      >
                        <option value="">Select Degree</option>
                        <option value="high_school">High School</option>
                        <option value="bachelors">Bachelor's Degree</option>
                        <option value="masters">Master's Degree</option>
                        <option value="phd">Ph.D.</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                      <input
                        type="text"
                        name="education.field"
                        value={formData.education.field}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                      <input
                        type="text"
                        name="education.institution"
                        value={formData.education.institution}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                      <input
                        type="text"
                        name="education.graduationYear"
                        value={formData.education.graduationYear}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Experience Section */}
              <div className={activeSection === 'experience' ? 'block' : 'hidden'}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Briefcase className="h-6 w-6 mr-2 text-indigo-600" />
                  Work Experience
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.hasWorkExperience}
                        onChange={(e) => setFormData(prev => ({ ...prev, hasWorkExperience: e.target.checked }))}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span>I have work experience</span>
                    </label>
                  </div>

                  {formData.hasWorkExperience && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                        <input
                          type="number"
                          name="yearsOfExperience"
                          value={formData.yearsOfExperience}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current/Last Role</label>
                        <input
                          type="text"
                          name="currentRole"
                          value={formData.currentRole}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                        <input
                          type="text"
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Section */}
              <div className={activeSection === 'skills' ? 'block' : 'hidden'}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Code className="h-6 w-6 mr-2 text-indigo-600" />
                  Skills & Expertise
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Technical Skills</label>
                    <input
                      type="text"
                      placeholder="e.g., Python, JavaScript, Data Analysis"
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                    <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soft Skills</label>
                    <input
                      type="text"
                      placeholder="e.g., Leadership, Communication, Problem Solving"
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Interests Section */}
              <div className={activeSection === 'interests' ? 'block' : 'hidden'}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Heart className="h-6 w-6 mr-2 text-indigo-600" />
                  Interests & Hobbies
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Professional Interests</label>
                    <textarea
                      placeholder="What kind of work interests you the most?"
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all h-32 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies & Activities</label>
                    <textarea
                      placeholder="What do you enjoy doing in your free time?"
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all h-32 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Career Preferences Section */}
              <div className={activeSection === 'preferences' ? 'block' : 'hidden'}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Target className="h-6 w-6 mr-2 text-indigo-600" />
                  Career Preferences
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Work Environment</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['Startup', 'Corporate', 'Agency', 'Remote', 'Hybrid', 'On-site'].map((env) => (
                        <label key={env} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value={env}
                            className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span>{env}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary Range</label>
                      <select
                        name="expectedSalary"
                        value={formData.expectedSalary}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      >
                        <option value="">Select Range</option>
                        <option value="0-30k">$0 - $30,000</option>
                        <option value="30k-50k">$30,000 - $50,000</option>
                        <option value="50k-80k">$50,000 - $80,000</option>
                        <option value="80k-100k">$80,000 - $100,000</option>
                        <option value="100k+">$100,000+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Willing to Relocate?</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="willingToRelocate"
                            value="yes"
                            checked={formData.willingToRelocate}
                            onChange={(e) => setFormData(prev => ({ ...prev, willingToRelocate: e.target.value === 'yes' }))}
                            className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="willingToRelocate"
                            value="no"
                            checked={!formData.willingToRelocate}
                            onChange={(e) => setFormData(prev => ({ ...prev, willingToRelocate: e.target.value === 'yes' }))}
                            className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;