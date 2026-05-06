import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Data {
  name: string;
  value: number;
}

interface Props {
  data: Data[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const ServiceStatusPieChart: React.FC<Props> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            color: '#ffffff',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ServiceStatusPieChart;
