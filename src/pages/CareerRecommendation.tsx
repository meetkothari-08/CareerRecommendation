import React from 'react';
import { Brain, Target, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const CareerRecommendation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-6 text-purple-600">
            Discover Your Ideal Career Path
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered system analyzes your skills, interests, and personality to recommend the best career paths for you.
          </p>
          <div className="mt-8 space-x-4">
            <button className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-all">
              Career Assessment
            </button>
            <button className="text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all">
              Market Analysis
            </button>
          </div>
        </div>

        {/* Career Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Skills Assessment Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="text-purple-600 mb-4">
              <Brain className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-4">Skills Assessment</h3>
            <p className="text-gray-600 mb-6">
              Evaluate your technical and soft skills to identify your strengths.
            </p>
            <Link 
              to="/assessment"
              className="text-purple-600 font-semibold hover:text-purple-700 flex items-center"
            >
              Start Assessment
              <TrendingUp className="h-4 w-4 ml-2" />
            </Link>
          </div>

          {/* Career Goals Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="text-purple-600 mb-4">
              <Target className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-4">Career Goals</h3>
            <p className="text-gray-600 mb-6">
              Define your professional objectives and desired career trajectory.
            </p>
            <Link 
              to="/goals"
              className="text-purple-600 font-semibold hover:text-purple-700 flex items-center"
            >
              Set Goals
              <TrendingUp className="h-4 w-4 ml-2" />
            </Link>
          </div>

          {/* Personality Analysis Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="text-purple-600 mb-4">
              <Star className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-4">Personality Analysis</h3>
            <p className="text-gray-600 mb-6">
              Take the Big 5 Personality Test to understand your work style and preferences.
            </p>
            <Link 
              to="/personality"
              className="text-purple-600 font-semibold hover:text-purple-700 flex items-center"
            >
              Start Test
              <TrendingUp className="h-4 w-4 ml-2" />
            </Link>
          </div>

          {/* Market Analysis Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="text-purple-600 mb-4">
              <TrendingUp className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-4">Market Analysis</h3>
            <p className="text-gray-600 mb-6">
              Get insights into job market trends and opportunities.
            </p>
            <Link 
              to="/market-analysis"
              className="text-purple-600 font-semibold hover:text-purple-700 flex items-center"
            >
              View Trends
              <TrendingUp className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerRecommendation;
