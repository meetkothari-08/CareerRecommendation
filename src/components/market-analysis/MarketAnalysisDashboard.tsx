import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, DollarSign, Globe } from 'lucide-react';
import { marketAnalysisService } from '../../services/marketAnalysisService';
import DemandTrendsChart from './DemandTrendsChart';
import SalaryDistributionChart from './SalaryDistributionChart';
import GlobalDemandChart from './GlobalDemandChart';

const MarketAnalysisDashboard: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demandData, setDemandData] = useState<{ date: string; count: number }[]>([]);
  const [salaryData, setSalaryData] = useState<{ range: string; count: number }[]>([]);
  const [globalData, setGlobalData] = useState([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle) return;

    setIsLoading(true);
    try {
      // Fetch job trends
      const trends = await marketAnalysisService.fetchJobTrends(jobTitle);
      if (trends?.month) {
        const trendData = Object.entries(trends.month).map(([date, count]) => ({
          date,
          count
        }));
        setDemandData(trendData);
      }

      // Fetch salary distribution
      const salaries = await marketAnalysisService.fetchSalaryTrends(jobTitle);
      if (salaries?.histogram) {
        const salaryDistribution = Object.entries(salaries.histogram).map(([range, count]) => ({
          range: `$${parseInt(range).toLocaleString()}`,
          count
        }));
        setSalaryData(salaryDistribution);
      }

      // Fetch global demand
      const global = await marketAnalysisService.fetchGlobalDemand(jobTitle);
      setGlobalData(global);
    } catch (error) {
      console.error('Error fetching market analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter job title (e.g., Software Engineer)"
                className="pl-10 w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`self-end px-6 py-2 rounded-lg font-semibold text-white transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {/* Dashboard Grid */}
      {(demandData.length > 0 || salaryData.length > 0 || globalData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DemandTrendsChart data={demandData} />
          <SalaryDistributionChart data={salaryData} />
          <div className="lg:col-span-2">
            <GlobalDemandChart data={globalData} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && demandData.length === 0 && salaryData.length === 0 && globalData.length === 0 && (
        <div className="text-center py-12">
          <div className="flex justify-center space-x-4 mb-6">
            <TrendingUp className="h-12 w-12 text-indigo-600" />
            <DollarSign className="h-12 w-12 text-purple-600" />
            <Globe className="h-12 w-12 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ready to Analyze the Job Market</h3>
          <p className="text-gray-600">
            Enter a job title above to see detailed market analysis, including demand trends,
            salary distributions, and global opportunities.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketAnalysisDashboard;