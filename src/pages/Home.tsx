import React, { useState } from 'react';
import { ArrowRight, Briefcase, BookOpen, Target, Brain, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCombinedRecommendations } from '../services/modelService';

interface UserInput {
  skills: string;
  interests: string;
  experience: string;
  education: string;
  goals: string;
}

const Home: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [userInput, setUserInput] = useState<UserInput>({
    skills: '',
    interests: '',
    experience: '',
    education: '',
    goals: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    lstm: any;
    groq: string;
    lstmAnalysis: {
      matchScore: number;
      confidence: number;
      topCareerPaths: string[];
    };
    recommendations: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInput(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const results = await getCombinedRecommendations(userInput);
      setRecommendations(results);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Navigate Your Career Path with Confidence
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Get personalized career guidance and discover opportunities that match your skills and aspirations
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:text-lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Briefcase className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Career Assessment</h3>
              <p className="text-gray-600">
                Take our comprehensive assessment to understand your strengths and ideal career paths
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <BookOpen className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Skill Development</h3>
              <p className="text-gray-600">
                Access resources and guidance to develop the skills needed for your dream career
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Target className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Goal Setting</h3>
              <p className="text-gray-600">
                Create actionable plans and track your progress towards your career goals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Take the Next Step in Your Career?
          </h2>
          <p className="text-xl mb-8">
            Our AI-powered career guidance system is here to help you make informed decisions
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 md:text-lg"
          >
            Contact Us
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Recommendation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Get Career Recommendations</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRecommendations(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {!recommendations ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skills
                      </label>
                      <input
                        type="text"
                        name="skills"
                        value={userInput.skills}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Python, Data Analysis, Project Management"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., AI, Marketing, Healthcare"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 3 years in software development"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Bachelor's in Computer Science"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Career Goals
                    </label>
                    <textarea
                      name="goals"
                      value={userInput.goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe your career aspirations and goals..."
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Get Recommendations'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="prose max-w-none">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Career Recommendations</h3>
                    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                      {/* LSTM Analysis Summary */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-2">AI Analysis Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Match Score</p>
                            <p className="text-lg font-medium">{recommendations.lstmAnalysis.matchScore}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Confidence Level</p>
                            <p className="text-lg font-medium">{(recommendations.lstmAnalysis.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">Top Career Paths</p>
                          <div className="flex flex-wrap gap-2">
                            {recommendations.lstmAnalysis.topCareerPaths.map((path, index) => (
                              <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                                {path}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Recommendations */}
                      <div className="mt-6 whitespace-pre-wrap">
                        {recommendations.recommendations}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;