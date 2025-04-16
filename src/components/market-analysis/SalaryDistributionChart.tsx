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

interface SalaryDistributionProps {
  data: { range: string; count: number }[];
}

const SalaryDistributionChart: React.FC<SalaryDistributionProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Salary Distribution</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="range"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="count" 
              fill="#6366f1" 
              name="Number of Jobs"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalaryDistributionChart;