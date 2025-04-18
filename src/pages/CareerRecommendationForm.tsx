import React, { useState } from 'react';
import { ArrowLeft, Send, Loader2, BookOpen, Briefcase, Target, Award, GraduationCap, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCombinedRecommendations } from '../services/modelService';
import { getCourseRecommendations } from '../services/courseRecommendationService';

interface UserInput {
  skills: string;
  interests: string;
  experience: string;
  education: string;
  goals: string;
}

interface RecommendationResult {
  lstm: any;
  groq: string;
  lstmAnalysis: {
    matchScore: number;
    confidence: number;
    topCareerPaths: string[];
  };
  recommendations: string;
  courseRecommendations?: {
    title: string;
    course_by: string;
  }[];
}

const CareerRecommendationForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState<UserInput>({
    skills: '',
    interests: '',
    experience: '',
    education: '',
    goals: ''
  });
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInput(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const results = await getCombinedRecommendations(userInput);
      const courses = await getCourseRecommendations(userInput.skills);
      setRecommendations({ ...results, courseRecommendations: courses });
      setStep(2);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        {step === 1 ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 inline-block text-transparent bg-clip-text">
                Get Personalized Career Recommendations
              </h1>
              <p className="text-gray-600 text-lg">
                Tell us about yourself, and we'll help you discover the perfect career path
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={userInput.skills}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g., Python, Data Analysis, Project Management"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests
                  </label>
                  <input
                    type="text"
                    name="interests"
                    value={userInput.interests}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g., AI, Marketing, Healthcare"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={userInput.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g., 3 years in software development"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={userInput.education}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g., Bachelor's in Computer Science"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Career Goals
                  </label>
                  <textarea
                    name="goals"
                    value={userInput.goals}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                    placeholder="Describe your career aspirations and goals..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Get Recommendations
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Career Recommendations</h2>

              {/* AI Analysis Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">AI Analysis Summary</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Match Score</p>
                    <div className="text-4xl font-bold text-indigo-600">
                      {recommendations?.lstmAnalysis.matchScore ? Math.round(recommendations.lstmAnalysis.matchScore) : 0}%
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
                    <div className="text-4xl font-bold text-purple-600">
                      {recommendations?.lstmAnalysis.confidence ? Math.round(recommendations.lstmAnalysis.confidence * 100) : 0}%
                    </div>
                  </div>
                </div>

                {/* Top Career Paths */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Recommended Career Paths</h4>
                  {recommendations?.lstmAnalysis.topCareerPaths.map((path, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start">
                        <Briefcase className="h-5 w-5 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                        <p className="text-gray-800">{path}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Target className="h-6 w-6 text-indigo-600 mr-2" />
                    Career Summary
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-800 leading-relaxed">
                      With your background in data science and interest in finance, you have a strong foundation for a career in finance that leverages your technical skills. Given your current experience level, focusing on developing key skills and gaining practical experience will increase your chances of success.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Award className="h-6 w-6 text-indigo-600 mr-2" />
                    Required Skills for Each Path
                  </h3>
                  <div className="space-y-4">
                    {recommendations?.lstmAnalysis.topCareerPaths.map((path, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-lg text-indigo-600 mb-3">{path}</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <span className="h-2 w-2 bg-indigo-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>Programming skills in Python, R, or MATLAB</span>
                          </li>
                          <li className="flex items-start">
                            <span className="h-2 w-2 bg-indigo-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>Knowledge of financial markets and instruments</span>
                          </li>
                          <li className="flex items-start">
                            <span className="h-2 w-2 bg-indigo-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>Experience with data visualization tools</span>
                          </li>
                          <li className="flex items-start">
                            <span className="h-2 w-2 bg-indigo-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>Understanding of statistical analysis and machine learning</span>
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <GraduationCap className="h-6 w-6 text-indigo-600 mr-2" />
                    Next Steps to Get Started
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <ol className="space-y-4">
                      <li className="flex items-start">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">1</span>
                        <div>
                          <h5 className="font-semibold text-gray-900">Build a Strong Foundation in Python</h5>
                          <p className="text-gray-700 mt-1">Focus on developing advanced Python skills, including data structures, algorithms, and software design patterns.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">2</span>
                        <div>
                          <h5 className="font-semibold text-gray-900">Learn Finance Fundamentals</h5>
                          <p className="text-gray-700 mt-1">Study financial markets, instruments, and regulations to gain a deeper understanding of the industry.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">3</span>
                        <div>
                          <h5 className="font-semibold text-gray-900">Gain Practical Experience</h5>
                          <p className="text-gray-700 mt-1">Participate in data science competitions, contribute to open-source projects, or intern with a financial institution.</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <AlertTriangle className="h-6 w-6 text-indigo-600 mr-2" />
                    Potential Challenges and Solutions
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-red-100 p-2 rounded-lg mr-4">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">Limited Experience</h5>
                          <p className="text-gray-700 mt-1">Address this by gaining practical experience through internships, projects, or volunteer work.</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-yellow-100 p-2 rounded-lg mr-4">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">Competitive Job Market</h5>
                          <p className="text-gray-700 mt-1">Stand out by developing a strong portfolio, building a professional network, and staying current with industry trends.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Course Recommendations */}
                {recommendations?.courseRecommendations && (
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <BookOpen className="h-6 w-6 text-indigo-600 mr-2" />
                      Recommended Courses
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.courseRecommendations.map((course, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900">{course.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">By {course.course_by}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerRecommendationForm; 