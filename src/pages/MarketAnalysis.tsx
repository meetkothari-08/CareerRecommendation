import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Adzuna API configuration
const APP_ID = "43269a17";
const APP_KEY = "19ba1f2c6e26e34f4169b756815527ed";
const BASE_URL = "https://api.adzuna.com/v1/api/jobs";

// List of countries to fetch job data from
const SUPPORTED_COUNTRIES = ["gb", "us", "au", "de", "ca", "nl", "fr", "it", "br", "in", "sg", "es", "ie", "nz", "pl"];

interface JobData {
  demandTrends: Array<{
    date: string;
    count: number;
  }>;
  salaryData: Array<{
    range: string;
    count: number;
  }>;
  globalDemand: Array<{
    country: string;
    count: number;
  }>;
}

const countryNames: Record<string, string> = {
  'GB': 'United Kingdom',
  'US': 'United States',
  'AU': 'Australia',
  'DE': 'Germany',
  'CA': 'Canada',
  'NL': 'Netherlands',
  'FR': 'France',
  'IT': 'Italy',
  'BR': 'Brazil',
  'IN': 'India',
  'SG': 'Singapore',
  'ES': 'Spain',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'PL': 'Poland'
};

const MarketAnalysis: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [error, setError] = useState('');

  const fetchWithRetry = async (url: string, params: any, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, { params });
        return response.data;
      } catch (error: any) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const fetchJobTrends = async (title: string) => {
    try {
      const response = await fetchWithRetry(`${BASE_URL}/us/history`, {
        app_id: APP_ID,
        app_key: APP_KEY,
        what: title,
      });
      return Object.entries(response.month || {}).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: count as number
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error fetching job trends:', error);
      throw new Error('Failed to fetch job trends data');
    }
  };

  const fetchSalaryTrends = async (title: string) => {
    try {
      const response = await fetchWithRetry(`${BASE_URL}/us/histogram`, {
        app_id: APP_ID,
        app_key: APP_KEY,
        what: title,
      });
      return Object.entries(response.histogram || {}).map(([range, count]) => ({
        range: `$${parseInt(range).toLocaleString()}`,
        count: count as number
      })).sort((a, b) => parseInt(a.range.replace(/[$,]/g, '')) - parseInt(b.range.replace(/[$,]/g, '')));
    } catch (error) {
      console.error('Error fetching salary trends:', error);
      throw new Error('Failed to fetch salary data');
    }
  };

  const fetchGlobalDemand = async (title: string) => {
    try {
      const countryData = await Promise.all(
        SUPPORTED_COUNTRIES.map(async (country) => {
          try {
            const response = await fetchWithRetry(`${BASE_URL}/${country}/search/1`, {
              app_id: APP_ID,
              app_key: APP_KEY,
              what: title,
            });
            return {
              country: countryNames[country.toUpperCase()] || country.toUpperCase(),
              count: response.count || 0
            };
          } catch (error) {
            return { country: countryNames[country.toUpperCase()] || country.toUpperCase(), count: 0 };
          }
        })
      );
      
      // Filter out countries with no jobs and get top 5 by job count
      return countryData
        .filter(data => data.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching global demand:', error);
      throw new Error('Failed to fetch global demand data');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }

    setIsLoading(true);
    setError('');
    setJobData(null);

    try {
      const [demandTrends, salaryData, globalDemand] = await Promise.all([
        fetchJobTrends(jobTitle),
        fetchSalaryTrends(jobTitle),
        fetchGlobalDemand(jobTitle)
      ]);

      if (!demandTrends.length && !salaryData.length && !globalDemand.length) {
        throw new Error('No data found for this job title');
      }

      setJobData({
        demandTrends,
        salaryData,
        globalDemand
      });
    } catch (error: any) {
      setError(error.message || 'Failed to fetch job market data. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDemandTrends = () => {
    if (!jobData?.demandTrends?.length) return null;

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Demand Trends</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={jobData.demandTrends} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Job Postings"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderSalaryDistribution = () => {
    if (!jobData?.salaryData?.length) return null;

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Salary Distribution</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jobData.salaryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                name="Number of Jobs"
                fill="#9333ea"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderGlobalDemand = () => {
    if (!jobData?.globalDemand?.length) return null;

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Global Demand</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jobData.globalDemand} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                name="Job Postings"
                fill="#6366f1"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 inline-block text-transparent bg-clip-text">
            Job Market Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get real-time insights into job market trends, salary data, and global demand for your desired role.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Enter job title (e.g., Data Analyst)"
              className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Analyze
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        {jobData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderDemandTrends()}
            {renderSalaryDistribution()}
            <div className="lg:col-span-2">
              {renderGlobalDemand()}
            </div>
          </div>
        )}

        {/* Initial State */}
        {!jobData && !isLoading && !error && (
          <div className="text-center text-gray-600">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>Enter a job title to see market analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalysis;