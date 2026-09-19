import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { TrendingUp } from "lucide-react";

const data = [
  {
    month: "Jan",
    acquisition: 38,
    compensation: 29,
    survey: 45,
  },
  {
    month: "Feb",
    acquisition: 43,
    compensation: 34,
    survey: 51,
  },
  {
    month: "Mar",
    acquisition: 51,
    compensation: 42,
    survey: 58,
  },
  {
    month: "Apr",
    acquisition: 59,
    compensation: 49,
    survey: 64,
  },
  {
    month: "May",
    acquisition: 65,
    compensation: 56,
    survey: 71,
  },
  {
    month: "Jun",
    acquisition: 71,
    compensation: 63,
    survey: 77,
  },
  {
    month: "Jul",
    acquisition: 74,
    compensation: 68,
    survey: 81,
  },
];

export default function AnalyticsChart() {
  return (
    <div className="dashboard-card analytics-card">
      <div className="card-header">
        <div>
          <h2>Acquisition Progress</h2>
          <p>State-wide progress over the last 7 months</p>
        </div>

        <div className="chart-controls">
          <button className="chart-filter active">6 Months</button>
          <button className="chart-filter">1 Year</button>
        </div>
      </div>

      <div className="chart-legend">
        <div>
          <span className="legend-dot blue"></span>
          Land Acquired
        </div>

        <div>
          <span className="legend-dot teal"></span>
          Compensation
        </div>

        <div>
          <span className="legend-dot green"></span>
          Survey
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0}
                />
              </linearGradient>

              <linearGradient id="tealArea" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--accent-teal)"
                  stopOpacity={0.16}
                />
                <stop
                  offset="100%"
                  stopColor="var(--accent-teal)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--text-muted)",
                fontSize: 11,
              }}
            />

            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--text-muted)",
                fontSize: 11,
              }}
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
              labelStyle={{
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}
              formatter={(value) => [`${value}%`]}
            />

            <Area
              type="monotone"
              dataKey="acquisition"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#blueArea)"
            />

            <Area
              type="monotone"
              dataKey="compensation"
              stroke="var(--accent-teal)"
              strokeWidth={2}
              fill="url(#tealArea)"
            />

            <Area
              type="monotone"
              dataKey="survey"
              stroke="var(--success)"
              strokeWidth={2}
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <div className="chart-current">
          <TrendingUp size={15} />
          <span>Overall progress</span>
          <strong>74%</strong>
        </div>

        <button className="text-link">
          View analysis
          <ArrowUpRightIcon />
        </button>
      </div>
    </div>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}