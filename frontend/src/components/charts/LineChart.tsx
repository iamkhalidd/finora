"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface LineDataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: LineDataPoint[];
  color?: string; // primary line stroke
}

export default function LineChart({ data, color = "#9bcaff" }: LineChartProps) {
  // Pad data if singular or empty
  const chartData = data.length > 0 ? data : [
    { date: "Start", value: 0 },
    { date: "End", value: 0 }
  ];

  return (
    <div className="w-full h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#chartGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
