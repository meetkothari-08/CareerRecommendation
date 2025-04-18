import React from 'react';
import MarketAnalysisDashboard from '../components/market-analysis/MarketAnalysisDashboard';

const MarketAnalysis: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 inline-block text-transparent bg-clip-text">
            Job Market Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore real-time job market trends, salary insights, and global demand for different career paths.
          </p>
        </div>

        {/* Market Analysis Dashboard */}
        <MarketAnalysisDashboard />
      </div>
    </div>
  );
};

export default MarketAnalysis;