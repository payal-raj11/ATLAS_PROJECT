import {
  Download,
  FileBarChart,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  LandPlot,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";


/* =====================================================
   DATA
===================================================== */

const progressData = [
  {
    name: "Required",
    value: 10000,
  },
  {
    name: "Acquired",
    value: 9280,
  },
  {
    name: "Pending",
    value: 720,
  },
];


const statusData = [
  {
    name: "Completed",
    value: 62,
  },
  {
    name: "Ongoing",
    value: 23,
  },
  {
    name: "Pending",
    value: 10,
  },
  {
    name: "Delayed",
    value: 5,
  },
];


const delayData = [
  {
    name: "Compensation",
    value: 42,
  },
  {
    name: "Objections",
    value: 28,
  },
  {
    name: "Survey Issue",
    value: 18,
  },
  {
    name: "Legal Issue",
    value: 12,
  },
];


const monthlyData = [
  {
    month: "Apr",
    acquired: 6200,
  },
  {
    month: "May",
    acquired: 7100,
  },
  {
    month: "Jun",
    acquired: 7600,
  },
  {
    month: "Jul",
    acquired: 8150,
  },
  {
    month: "Aug",
    acquired: 8750,
  },
  {
    month: "Sep",
    acquired: 9280,
  },
];


/* =====================================================
   CUSTOM TOOLTIP
===================================================== */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="report-chart-tooltip">
      <strong>{label}</strong>

      {payload.map((item) => (
        <div key={item.name}>
          {item.name}:{" "}
          <b>{item.value.toLocaleString()}</b>
        </div>
      ))}
    </div>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function ReportStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  type,
}) {
  return (
    <div className="report-stat-card">

      <div className="report-stat-top">

        <div
          className={`report-stat-icon report-stat-icon-${type}`}
        >
          <Icon size={18} />
        </div>

        <TrendingUp
          className="report-stat-trend"
          size={15}
        />

      </div>

      <div className="report-stat-value">
        {value}
      </div>

      <div className="report-stat-title">
        {title}
      </div>

      <div className="report-stat-subtitle">
        {subtitle}
      </div>

    </div>
  );
}


/* =====================================================
   REPORTS PAGE
===================================================== */

export default function Reports() {

  const exportReport = () => {
    alert("Report export will be connected to the backend.");
  };


  return (
    <div className="reports-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="reports-page-header">

        <div>

          <div className="reports-breadcrumb">
            Reports & Analytics
          </div>

          <h1>
            Report & Analysis
          </h1>

          <p>
            Overview of land acquisition progress,
            project status and delay analysis.
          </p>

        </div>


        <button
          type="button"
          className="reports-export-button"
          onClick={exportReport}
        >
          <Download size={15} />

          <span>
            Export Report
          </span>
        </button>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <section className="reports-stats-grid">

        <ReportStatCard
          title="Total Land"
          value="10,000 m²"
          subtitle="Required land"
          icon={LandPlot}
          type="blue"
        />

        <ReportStatCard
          title="Acquired"
          value="9,280 m²"
          subtitle="92.8% of total land"
          icon={CheckCircle2}
          type="green"
        />

        <ReportStatCard
          title="Pending"
          value="720 m²"
          subtitle="7.2% remaining"
          icon={Clock3}
          type="orange"
        />

        <ReportStatCard
          title="Delayed"
          value="24"
          subtitle="Active delay cases"
          icon={AlertTriangle}
          type="red"
        />

      </section>


      {/* =================================================
          MAIN CHARTS
      ================================================= */}

      <section className="reports-charts-row">


        {/* ACQUISITION PROGRESS */}

        <div className="report-chart-card">

          <div className="report-card-header">

            <div>

              <h2>
                Acquisition Progress
              </h2>

              <p>
                Required vs acquired vs pending land
              </p>

            </div>

            <div className="report-card-icon blue">
              <FileBarChart size={17} />
            </div>

          </div>


          <div className="report-chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={progressData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-light)"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--text-muted)",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--text-muted)",
                    fontSize: 9,
                  }}
                  tickFormatter={(value) =>
                    `${value / 1000}k`
                  }
                />

                <Tooltip
                  content={<ChartTooltip />}
                />

                <Bar
                  dataKey="value"
                  name="Land"
                  radius={[5, 5, 0, 0]}
                  fill="#1683e8"
                  barSize={42}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>


        {/* ACQUISITION STATUS */}

        <div className="report-chart-card">

          <div className="report-card-header">

            <div>

              <h2>
                Acquisition Status
              </h2>

              <p>
                Current project distribution
              </p>

            </div>

            <div className="report-card-icon teal">
              <CheckCircle2 size={17} />
            </div>

          </div>


          <div className="status-chart-layout">

            <div className="status-donut">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                  >

                    <Cell fill="#20b981" />
                    <Cell fill="#1683e8" />
                    <Cell fill="#f5a623" />
                    <Cell fill="#ef5b5b" />

                  </Pie>

                  <Tooltip />

                </PieChart>
              </ResponsiveContainer>


              <div className="donut-center">

                <strong>
                  100%
                </strong>

                <span>
                  Projects
                </span>

              </div>

            </div>


            <div className="status-legend">

              {statusData.map((item, index) => {

                const classes = [
                  "green",
                  "blue",
                  "orange",
                  "red",
                ];

                return (
                  <div
                    className="status-legend-item"
                    key={item.name}
                  >

                    <div className="status-legend-name">

                      <span
                        className={`status-legend-dot ${classes[index]}`}
                      />

                      <span>
                        {item.name}
                      </span>

                    </div>

                    <strong>
                      {item.value}%
                    </strong>

                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          DELAY ANALYSIS
      ================================================= */}

      <section className="report-wide-card">

        <div className="report-card-header">

          <div>

            <h2>
              Delay Analysis
            </h2>

            <p>
              Major reasons affecting project timelines
            </p>

          </div>

          <div className="report-card-icon red">
            <AlertTriangle size={17} />
          </div>

        </div>


        <div className="delay-chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={delayData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-light)"
                horizontal={false}
              />

              <XAxis
                type="number"
                domain={[0, 50]}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--text-muted)",
                  fontSize: 9,
                }}
                tickFormatter={(value) =>
                  `${value}%`
                }
              />

              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={90}
                tick={{
                  fill: "var(--text-secondary)",
                  fontSize: 10,
                }}
              />

              <Tooltip
                formatter={(value) => [
                  `${value}%`,
                  "Cases",
                ]}
                contentStyle={{
                  background:
                    "var(--surface)",
                  border:
                    "1px solid var(--border)",
                  borderRadius: "7px",
                  color:
                    "var(--text-primary)",
                }}
              />

              <Bar
                dataKey="value"
                name="Delay"
                radius={[0, 5, 5, 0]}
                fill="#ef5b5b"
                barSize={22}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </section>


      {/* =================================================
          ACQUISITION TREND
      ================================================= */}

      <section className="report-wide-card">

        <div className="report-card-header">

          <div>

            <h2>
              Acquisition Trend
            </h2>

            <p>
              Cumulative land acquisition over the
              last six months
            </p>

          </div>

          <div className="report-card-icon blue">
            <TrendingUp size={17} />
          </div>

        </div>


        <div className="trend-chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={monthlyData}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 0,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-light)"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--text-muted)",
                  fontSize: 10,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--text-muted)",
                  fontSize: 9,
                }}
                tickFormatter={(value) =>
                  `${value / 1000}k`
                }
              />

              <Tooltip
                content={<ChartTooltip />}
              />

              <Line
                type="monotone"
                dataKey="acquired"
                name="Acquired Land"
                stroke="#1683e8"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#1683e8",
                }}
                activeDot={{
                  r: 5,
                }}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </section>

    </div>
  );
}