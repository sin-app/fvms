"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ReportData } from "../types";

const STATUS_COLORS_CHART = {
  completed: "#22c55e",
  pending: "#f59e0b",
  on_the_way: "#3b82f6",
  in_progress: "#8b5cf6",
  cancelled: "#ef4444",
};

interface ReportChartsProps {
  data: ReportData;
}

export function ReportCharts({ data }: ReportChartsProps) {
  const pieData = [
    { name: "Completed", value: data.completed, color: STATUS_COLORS_CHART.completed },
    { name: "Pending", value: data.pending, color: STATUS_COLORS_CHART.pending },
    { name: "On The Way", value: data.on_the_way, color: STATUS_COLORS_CHART.on_the_way },
    { name: "In Progress", value: data.in_progress, color: STATUS_COLORS_CHART.in_progress },
    { name: "Cancelled", value: data.cancelled, color: STATUS_COLORS_CHART.cancelled },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border p-5">
        <h3 className="text-sm font-medium mb-4">Distribusi Status</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="text-sm font-medium mb-4">Per Kabupaten</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.by_kabupaten}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="kabupaten_name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.by_kecamatan.length > 0 && (
        <div className="rounded-xl border p-5">
          <h3 className="text-sm font-medium mb-4">Per Kecamatan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.by_kecamatan}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kecamatan_name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.daily_data.length > 0 && (
        <div className="rounded-xl border p-5 lg:col-span-2">
          <h3 className="text-sm font-medium mb-4">Data Harian</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.daily_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
