/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  PieController,
  LineController,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  PieController,
  LineController
);

export function Chart({ type, data }: { type: "pie" | "line"; data: any[] }) {
  const chartData = {
    labels: type === "pie" ? data.map((d) => d.label) : undefined,
    datasets: [
      {
        data: type === "pie" ? data.map((d) => d.value) : data.map((d) => d.y),
        backgroundColor:
          type === "pie" ? ["#FF6384", "#36A2EB", "#FFCE56"] : undefined,
        borderColor: type === "line" ? "#36A2EB" : undefined,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return type === "pie" ? (
    <Pie data={chartData} options={options} />
  ) : (
    <Line data={chartData} options={options} />
  );
}
