import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Data {
  name: string;
  tasks: number;
}

interface Props {
  data: Data[];
}

const EmployeePerformanceBarChart: React.FC<Props> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            color: '#ffffff',
          }}
        />
        <Legend />
        <Bar dataKey="tasks" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EmployeePerformanceBarChart;
