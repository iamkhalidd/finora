"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DataPoint {
  name: string;
  value: number;
  percentage?: number;
}

interface DonutChartProps {
  data: DataPoint[];
  centerLabel: string;
  centerValue: string;
}

// Color palette mapping based on index or category name
const COLORS = [
  "#9bcaff", // primary
  "#adc8f5", // secondary
  "#49df9b", // tertiary
  "#ffb4ab", // error / semantic
  "#5ba3e8", // secondary primary
  "#2a3548", // fallback surface
];

export default function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  // If no data, render an empty placeholder segment
  const chartData = data.length > 0 ? data : [{ name: "No Data", value: 1 }];

  return (
    <div className="relative w-full h-[200px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="rgba(7, 19, 37, 0.8)"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Central typography overlay */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {centerLabel}
        </span>
        <span className="text-xl font-bold font-data-lg text-on-surface mt-1">
          {centerValue}
        </span>
      </div>
    </div>
  );
}
