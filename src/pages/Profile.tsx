import React, { useState, useEffect } from 'react';
import { User, BookOpen, Award, Briefcase, Save, GraduationCap } from 'lucide-react';
import axios from 'axios';

interface Skill {
  name: string;
  proficiency: number;
}

interface Certification {
  name: string;
  issueDate: Date;
}

interface Activity {
  title: string;
  date: Date;
  description: string;
}

interface Education {
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
}

interface ProfileData {
  userId: string;
  fullName: string;
  jobTitle: string;
  education: Education;
  skills: Skill[];
  certifications: Certification[];
  careerGoals: string[];
  recentActivities: Activity[];
  memberSince: Date;
}

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    userId: '1', // This should come from your auth system
    fullName: '',
    jobTitle: '',
    education: {
      degree: '',
      field: '',
      institution: '',
      graduationYear: ''
    },
    skills: [],
    certifications: [],
    careerGoals: [],
    recentActivities: [],
    memberSince: new Date()
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/profile/${profile.userId}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5000/api/profile', profile);
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEducationChange = (field: keyof Education, value: string) => {
    setProfile(prev => ({
      ...prev,
      education: {
        ...prev.education,
        [field]: value
      }
    }));
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-20 w-20 text-indigo-600" />
              </div>
              <div className="ml-6">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Full Name"
                      required
                    />
                    <input
                      type="text"
                      value={profile.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Job Title"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.fullName || 'Your Name'}</h1>
                    <p className="text-gray-600">{profile.jobTitle || 'Your Title'}</p>
                  </>
                )}
                <p className="text-sm text-gray-500">Member since {new Date(profile.memberSince).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isEditing ? (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Profile
                </>
              ) : (
                'Edit Profile'
              )}
            </button>
          </div>
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <GraduationCap className="h-8 w-8 text-indigo-600 mr-4" />
            <h2 className="text-xl font-bold">Education</h2>
          </div>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <select
                  value={profile.education.degree}
                  onChange={(e) => handleEducationChange('degree', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  required
                >
                  <option value="">Select Degree</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="Ph.D.">Ph.D.</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                <input
                  type="text"
                  value={profile.education.field}
                  onChange={(e) => handleEducationChange('field', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  value={profile.education.institution}
                  onChange={(e) => handleEducationChange('institution', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="e.g., University Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={profile.education.graduationYear}
                  onChange={(e) => handleEducationChange('graduationYear', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="e.g., 2024"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Degree</p>
                <p className="mt-1">{profile.education.degree || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Field of Study</p>
                <p className="mt-1">{profile.education.field || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Institution</p>
                <p className="mt-1">{profile.education.institution || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Graduation Year</p>
                <p className="mt-1">{profile.education.graduationYear || 'Not specified'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Career Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <BookOpen className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Skills</h3>
            <div className="space-y-3">
              {isEditing ? (
                <button
                  onClick={() => handleInputChange('skills', [...profile.skills, { name: '', proficiency: 0 }])}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  + Add Skill
                </button>
              ) : null}
              {profile.skills.map((skill, index) => (
                <div key={index}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => {
                          const newSkills = [...profile.skills];
                          newSkills[index].name = e.target.value;
                          handleInputChange('skills', newSkills);
                        }}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Skill name"
                      />
                      <input
                        type="number"
                        value={skill.proficiency}
                        onChange={(e) => {
                          const newSkills = [...profile.skills];
                          newSkills[index].proficiency = Number(e.target.value);
                          handleInputChange('skills', newSkills);
                        }}
                        min="0"
                        max="100"
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <span className="text-sm font-medium">{skill.proficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${skill.proficiency}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Award className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Certifications</h3>
            {isEditing ? (
              <button
                onClick={() => handleInputChange('certifications', [...profile.certifications, { name: '', issueDate: new Date() }])}
                className="text-sm text-indigo-600 hover:text-indigo-500 mb-2"
              >
                + Add Certification
              </button>
            ) : null}
            <ul className="space-y-2">
              {profile.certifications.map((cert, index) => (
                <li key={index} className="flex items-center">
                  {isEditing ? (
                    <div className="w-full space-y-2">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const newCerts = [...profile.certifications];
                          newCerts[index].name = e.target.value;
                          handleInputChange('certifications', newCerts);
                        }}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Certification name"
                      />
                      <input
                        type="date"
                        value={new Date(cert.issueDate).toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newCerts = [...profile.certifications];
                          newCerts[index].issueDate = new Date(e.target.value);
                          handleInputChange('certifications', newCerts);
                        }}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                      <span>{cert.name}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Briefcase className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Career Goals</h3>
            {isEditing ? (
              <button
                onClick={() => handleInputChange('careerGoals', [...profile.careerGoals, ''])}
                className="text-sm text-indigo-600 hover:text-indigo-500 mb-2"
              >
                + Add Goal
              </button>
            ) : null}
            <ul className="space-y-2">
              {profile.careerGoals.map((goal, index) => (
                <li key={index} className="flex items-center">
                  {isEditing ? (
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...profile.careerGoals];
                        newGoals[index] = e.target.value;
                        handleInputChange('careerGoals', newGoals);
                      }}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Career goal"
                    />
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                      <span>{goal}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            {isEditing && (
              <button
                onClick={() => handleInputChange('recentActivities', [...profile.recentActivities, { title: '', date: new Date(), description: '' }])}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                + Add Activity
              </button>
            )}
          </div>
          <div className="space-y-6">
            {profile.recentActivities.map((activity, index) => (
              <div key={index} className="border-l-4 border-indigo-600 pl-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={activity.title}
                      onChange={(e) => {
                        const newActivities = [...profile.recentActivities];
                        newActivities[index].title = e.target.value;
                        handleInputChange('recentActivities', newActivities);
                      }}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Activity title"
                    />
                    <input
                      type="date"
                      value={new Date(activity.date).toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newActivities = [...profile.recentActivities];
                        newActivities[index].date = new Date(e.target.value);
                        handleInputChange('recentActivities', newActivities);
                      }}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <textarea
                      value={activity.description}
                      onChange={(e) => {
                        const newActivities = [...profile.recentActivities];
                        newActivities[index].description = e.target.value;
                        handleInputChange('recentActivities', newActivities);
                      }}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Activity description"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold">{activity.title}</h3>
                    <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                    <p className="text-gray-600">{activity.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;