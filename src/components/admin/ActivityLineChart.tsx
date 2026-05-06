import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ActivityLineChart = ({
  data,
}: {
  data: { date: string; count: number }[];
}) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            borderColor: "#334155",
            color: "#ffffff",
          }}
        />
        <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ActivityLineChart;
