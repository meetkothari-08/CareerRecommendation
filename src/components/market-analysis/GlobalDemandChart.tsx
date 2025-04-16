import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { GlobalDemand } from '../../services/marketAnalysisService';

interface GlobalDemandChartProps {
  data: GlobalDemand[];
}

const countryNames: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'AU': 'Australia',
  'DE': 'Germany',
  'CA': 'Canada',
  'NL': 'Netherlands',
  'FR': 'France',
  'IT': 'Italy',
  'BR': 'Brazil',
  'IN': 'India'
};

const GlobalDemandChart: React.FC<GlobalDemandChartProps> = ({ data }) => {
  const formattedData = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({
      ...item,
      name: countryNames[item.country] || item.country
    }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Global Job Demand</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="count" 
              fill="#818cf8"
              name="Job Postings"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GlobalDemandChart;