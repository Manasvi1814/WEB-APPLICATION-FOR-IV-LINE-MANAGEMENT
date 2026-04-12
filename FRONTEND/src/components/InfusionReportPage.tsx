// src/components/InfusionReportPage.tsx
import React from "react";
import type { Report } from "../types";

// ─── types ────────────────────────────────────────────────────────────────────

type Props = {
  report: Report;
  departmentName?: string | null;
  monthlyData?: { month_start: string; phlebitis_cases: number }[];
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number | string, decimals = 2) => Number(n).toFixed(decimals);

const inr = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const nilOrPercent = (count: number, pct: number | string) =>
  count === 0 ? "Nil" : `${fmt(pct, 2)}%`;

const fmtMonthLabel = (ms: string) =>
  new Date(ms).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

const fmtMonthFull = (ms: string) =>
  new Date(ms).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

// ─── Static Bar Chart ─────────────────────────────────────────────────────────

interface BarDatum {
  label: string;
  value: number;
  color: string;
}

const StaticBarChart: React.FC<{
  data: BarDatum[];
  unit?: string;
  fixedMax?: number;
}> = ({ data, unit = "", fixedMax }) => {
  const W = 330,
    H = 210;
  const PAD = { top: 36, right: 16, bottom: 42, left: 46 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const dataMax = Math.max(...data.map((d) => d.value), 1);
  const yMax = fixedMax ?? Math.ceil(dataMax * 1.35);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMax * t));
  const groupW = cW / data.length;
  const barW = Math.min(groupW * 0.52, 62);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
    >
      {ticks.map((tick) => {
        const y = Math.round(PAD.top + cH - (tick / yMax) * cH) + 0.5;
        return (
          <g key={tick}>
            <line
              x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y}
              stroke={tick === 0 ? "#9ca3af" : "#d1d5db"}
              strokeWidth={tick === 0 ? 1.5 : 1}
              strokeDasharray={tick === 0 ? "0" : "4 3"}
            />
            <text
              x={PAD.left - 6} y={y}
              dominantBaseline="central" textAnchor="end"
              fontSize={9} fill="#9ca3af" fontFamily="DM Sans, sans-serif"
            >
              {tick}{unit}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = Math.max((d.value / yMax) * cH, 0);
        const x = Math.round(PAD.left + i * groupW + (groupW - barW) / 2);
        const barTop = Math.round(PAD.top + cH - barH);
        return (
          <g key={i}>
            <rect
              x={x} y={barH > 0 ? barTop : PAD.top + cH - 1}
              width={barW} height={barH > 0 ? Math.round(barH) : 1}
              rx={4} ry={4} fill={d.color}
            />
            <text
              x={x + barW / 2} y={barTop - 8}
              dominantBaseline="auto" textAnchor="middle"
              fontSize={11} fontWeight={700} fill="#374151" fontFamily="DM Sans, sans-serif"
            >
              {d.value}{unit}
            </text>
            <text
              x={x + barW / 2} y={PAD.top + cH + 18}
              dominantBaseline="hanging" textAnchor="middle"
              fontSize={10} fill="#6b7280" fontFamily="DM Sans, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Static Line Chart ────────────────────────────────────────────────────────

const StaticLineChart: React.FC<{
  data: { month_start: string; phlebitis_cases: number }[];
}> = ({ data }) => {
  const W = 760,
    H = 220;
  const PAD = { top: 36, right: 24, bottom: 44, left: 46 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxV = Math.max(...data.map((d) => d.phlebitis_cases), 1);
  const niceMax =
    Math.ceil(maxV / 5) * 5 === maxV ? maxV + 5 : Math.ceil(maxV / 5) * 5;
  const yTicks = Array.from({ length: 6 }, (_, i) =>
    Math.round((niceMax / 5) * i)
  );

  const getX = (i: number) =>
    data.length === 1
      ? PAD.left + cW / 2
      : PAD.left + (i / (data.length - 1)) * cW;
  const getY = (v: number) => PAD.top + cH - (v / niceMax) * cH;

  const pts = data.map((d, i) => ({
    x: Math.round(getX(i)),
    y: Math.round(getY(d.phlebitis_cases)),
    v: d.phlebitis_cases,
    label: fmtMonthLabel(d.month_start),
  }));

  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + (points[i + 1].x - points[i].x) * 0.45;
      const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) * 0.45;
      path += ` C ${cp1x} ${points[i].y}, ${cp2x} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return path;
  };

  const linePath = buildPath(pts);
  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x} ${PAD.top + cH} L ${pts[0].x} ${PAD.top + cH} Z`;
  const baseline = PAD.top + cH;
  const maxV2 = Math.max(...data.map((d) => d.phlebitis_cases));
  const minV2 = Math.min(...data.map((d) => d.phlebitis_cases));

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible", width: "100%" }}
    >
      <defs>
        <linearGradient id="reportAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => {
        const y = Math.round(getY(tick)) + 0.5;
        return (
          <g key={tick}>
            <line
              x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y}
              stroke={tick === 0 ? "#9ca3af" : "#e9d5ff"}
              strokeWidth={tick === 0 ? 1.5 : 1}
              strokeDasharray={tick === 0 ? "0" : "5 4"}
            />
            <text
              x={PAD.left - 6} y={y}
              dominantBaseline="central" textAnchor="end"
              fontSize={9} fill="#9ca3af" fontFamily="DM Sans, sans-serif"
            >
              {tick}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#reportAreaGrad)" />
      <path
        d={linePath} fill="none"
        stroke="#6d28d9" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />

      {pts.map((p, i) => (
        <g key={i}>
          <line
            x1={p.x} y1={baseline} x2={p.x} y2={baseline + 4}
            stroke="#c4b5fd" strokeWidth={1}
          />
          <text
            x={p.x} y={baseline + 14}
            dominantBaseline="hanging" textAnchor="middle"
            fontSize={9} fill="#6d28d9"
            fontFamily="DM Sans, sans-serif" fontWeight={500}
          >
            {p.label}
          </text>
        </g>
      ))}

      {pts.map((p, i) => {
        const isMax = p.v === maxV2 && p.v > 0;
        const isMin = p.v === minV2 && p.v > 0 && p.v !== maxV2;
        const labelAbove = i % 2 === 0 || data.length <= 6;
        return (
          <g key={i}>
            {(isMax || isMin) && (
              <circle
                cx={p.x} cy={p.y} r={7}
                fill={isMax ? "#ede9fe" : "#fef3c7"}
                stroke={isMax ? "#6d28d9" : "#f59e0b"}
                strokeWidth={1.5}
              />
            )}
            <circle cx={p.x} cy={p.y} r={3.5} fill="#6d28d9" />
            <circle cx={p.x} cy={p.y} r={1.5} fill="#ffffff" />
            {p.v > 0 && (
              <text
                x={p.x}
                y={labelAbove ? p.y - 10 : p.y + 16}
                dominantBaseline={labelAbove ? "auto" : "hanging"}
                textAnchor="middle"
                fontSize={9} fontWeight={700}
                fill={isMax ? "#4c1d95" : isMin ? "#b45309" : "#374151"}
                fontFamily="DM Sans, sans-serif"
              >
                {p.v}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Section Heading ──────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ number: string; title: string }> = ({
  number,
  title,
}) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
    <tbody>
      <tr>
        <td style={{ width: 24, padding: 0, verticalAlign: "middle" }}>
          <div
            style={{
              width: 22, height: 22, borderRadius: "50%",
              backgroundColor: "#6d28d9", color: "#fff",
              fontSize: 11, fontWeight: 700, textAlign: "center",
              lineHeight: "22px", fontFamily: "DM Sans, sans-serif",
            }}
          >
            {number}
          </div>
        </td>
        <td style={{ paddingLeft: 8, verticalAlign: "middle", whiteSpace: "nowrap", width: 1 }}>
          <span
            style={{
              fontSize: 11, fontWeight: 700, color: "#3b0764",
              textTransform: "uppercase", letterSpacing: "0.1em",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {title}
          </span>
        </td>
        <td style={{ paddingLeft: 10, verticalAlign: "middle" }}>
          <div style={{ height: 1, backgroundColor: "#ede9fe", width: "100%" }} />
        </td>
      </tr>
    </tbody>
  </table>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div
    style={{
      backgroundColor: "#f5f3ff",
      border: "1px solid #ede9fe",
      borderRadius: 8,
      padding: "10px 14px",
      boxSizing: "border-box",
      width: "100%",
    }}
  >
    <div
      style={{
        fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em",
        color: "#7c3aed", fontWeight: 600, marginBottom: 4,
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 20, fontWeight: 700, color: "#3b0764",
        fontFamily: "DM Serif Display, serif",
      }}
    >
      {value}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const InfusionReportPage = React.forwardRef<HTMLDivElement, Props>(
  ({ report, departmentName, monthlyData = [] }, ref) => {
    const costPerPatient =
      report.total_patients > 0
        ? Number(report.total_insertion_cost) / report.total_patients
        : 0;

    // ── Chart data ────────────────────────────────────────────────────────────
    const prickData: BarDatum[] = [
      {
        label: "First Prick",
        value: Number(fmt(report.first_prick_success_percent, 1)),
        color: "#6d28d9",
      },
      {
        label: "Second Prick",
        value: Number(fmt(report.second_prick_success_percent, 1)),
        color: "#c4b5fd",
      },
    ];

    const insertionPhlebData: BarDatum[] = [
      {
        label: "Insertions",
        value: report.total_peripheral_venous_access,
        color: "#4c1d95",
      },
      {
        label: "Phlebitis",
        value: report.phlebitis_cases,
        color: "#fb7185",
      },
    ];

    // ── KPI rows (Section 1) — includes Patient Satisfaction ─────────────────
    const kpiRows = [
      {
        label: "Phlebitis Rate (per 100 insertions)",
        formula: `${report.phlebitis_cases} ÷ ${report.total_peripheral_venous_access} × 100`,
        value:
          report.phlebitis_cases === 0
            ? "Nil"
            : `${fmt(report.phlebitis_rate_access_percent)}%`,
        highlight: Number(report.phlebitis_rate_access_percent) > 10,
      },
      {
        label: "Phlebitis Rate (per 100 patient days)",
        formula: `${report.phlebitis_cases} ÷ ${report.total_patient_days} × 100`,
        value:
          report.phlebitis_cases === 0
            ? "Nil"
            : `${fmt(report.phlebitis_rate_patient_days_percent)}%`,
        highlight: false,
      },
      {
        label: "Extravasation Rate",
        formula: `${report.extravasation_cases} ÷ ${report.total_patient_days} × 100`,
        value: nilOrPercent(
          report.extravasation_cases,
          report.extravasation_rate_percent
        ),
        highlight: false,
      },
      {
        label: "First Prick Success Rate",
        formula: `${report.first_prick_success_count} ÷ ${report.total_patients} × 100`,
        value: `${fmt(report.first_prick_success_percent, 1)}%`,
        highlight: false,
      },
      {
        label: "Second Prick Success Rate",
        formula: `${report.second_prick_success_count} ÷ ${report.total_patients} × 100`,
        value: `${fmt(report.second_prick_success_percent, 1)}%`,
        highlight: false,
      },
      {
        label: "Escalation to Anaesthetics",
        formula: `${report.escalation_to_anaesthetics_count} ÷ ${report.total_patients} × 100`,
        value: nilOrPercent(
          report.escalation_to_anaesthetics_count,
          report.escalation_to_anaesthetics_percent
        ),
        highlight: false,
      },
      {
        label: "Patient Satisfaction (Infusion Therapy)",
        formula: `${report.positive_feedbacks} ÷ ${report.total_feedbacks} × 100`,
        value:
          report.total_feedbacks > 0
            ? `${Number(report.feedback_percentage).toFixed(1)}%`
            : "Nil",
        highlight: false,
      },
    ];

    // ── Summary cards (Section 2) — 9 cards, 3 per row ───────────────────────
    const summaryCards = [
      { label: "Total Patients",               value: report.total_patients },
      { label: "Total Patient Days",           value: report.total_patient_days },
      { label: "Total Insertions",             value: report.total_peripheral_venous_access },
      { label: "Phlebitis Cases",              value: report.phlebitis_cases },
      {
        label: "Extravasation Cases",
        value: report.extravasation_cases === 0 ? "Nil" : report.extravasation_cases,
      },
      {
        label: "Escalation to Anaesthetics",
        value:
          report.escalation_to_anaesthetics_count === 0
            ? "Nil"
            : report.escalation_to_anaesthetics_count,
      },
      { label: "Total Feedbacks",              value: report.total_feedbacks },
      { label: "Positive Feedbacks",           value: report.positive_feedbacks },
      {
        label: "Patient Satisfaction",
        value:
          report.total_feedbacks > 0
            ? `${Number(report.feedback_percentage).toFixed(1)}%`
            : "Nil",
      },
    ];

    // ── Monthly trend stats ───────────────────────────────────────────────────
    const monthlyTotal = monthlyData.reduce((s, d) => s + d.phlebitis_cases, 0);
    const monthlyAvg   = monthlyData.length > 0 ? monthlyTotal / monthlyData.length : 0;
    const monthlyMax   =
      monthlyData.length > 0
        ? monthlyData.reduce((a, b) =>
            a.phlebitis_cases >= b.phlebitis_cases ? a : b
          )
        : null;
    const monthlyMin =
      monthlyData.length > 0
        ? monthlyData
            .filter((d) => d.phlebitis_cases > 0)
            .reduce(
              (a, b) => (a.phlebitis_cases <= b.phlebitis_cases ? a : b),
              monthlyData[0]
            )
        : null;

    // ── Shared table styles ───────────────────────────────────────────────────
    const thBase: React.CSSProperties = {
      backgroundColor: "#4c1d95",
      color: "#fff",
      fontSize: 11,
      fontWeight: 600,
      padding: "9px 14px",
      textAlign: "left",
      fontFamily: "DM Sans, sans-serif",
    };
    const tdBase: React.CSSProperties = {
      fontSize: 11,
      padding: "9px 14px",
      color: "#374151",
      fontWeight: 500,
      borderBottom: "1px solid #f3f4f6",
      fontFamily: "DM Sans, sans-serif",
    };

    // Chunk summaryCards into rows of 3
    const cardRows: typeof summaryCards[] = [];
    for (let i = 0; i < summaryCards.length; i += 3) {
      cardRows.push(summaryCards.slice(i, i + 3));
    }

    return (
      <>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <div
          ref={ref}
          className="report-page-print"
          style={{
            fontFamily: "DM Sans, sans-serif",
            backgroundColor: "#ffffff",
            color: "#1f2937",
            width: "100%",
            maxWidth: 860,
            margin: "0 auto",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
          }}
        >
          {/* ══ HEADER ══════════════════════════════════════════════════ */}
          <div
            style={{
              position: "relative",
              backgroundColor: "#4c1d95",
              color: "#fff",
              padding: "28px 36px 24px",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <img
              src="/assests/mgm_logo.png"
              alt=""
              aria-hidden
              style={{
                position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%",
                objectFit: "contain", opacity: 0.06,
                pointerEvents: "none", userSelect: "none",
              }}
            />
            <table style={{ width: "100%", borderCollapse: "collapse", position: "relative" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "top" }}>
                    <div
                      style={{
                        fontSize: 10, textTransform: "uppercase",
                        letterSpacing: "0.15em", color: "#c4b5fd",
                        fontWeight: 600, marginBottom: 6,
                      }}
                    >
                      Infusion Therapy Quality Report
                    </div>
                    <div
                      style={{
                        fontSize: 22, fontWeight: 700,
                        fontFamily: "DM Serif Display, serif",
                        lineHeight: 1.2, marginBottom: 14,
                      }}
                    >
                      {departmentName || "Infusion Therapy Unit"}
                    </div>
                    <table style={{ borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ fontSize: 9, color: "#c4b5fd", paddingRight: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                            Period
                          </td>
                          <td style={{ fontSize: 11, color: "#ede9fe", paddingRight: 22 }}>
                            {formatDate(report.report_start_date)} –{" "}
                            {formatDate(report.report_end_date)}
                          </td>
                          <td style={{ fontSize: 9, color: "#c4b5fd", paddingRight: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                            Generated
                          </td>
                          <td style={{ fontSize: 11, color: "#ede9fe" }}>
                            {new Date().toLocaleString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ verticalAlign: "top", textAlign: "right", width: 84 }}>
                    <img
                      src="/assests/mgm_logo.png"
                      alt="Hospital logo"
                      style={{ height: 56, objectFit: "contain" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══ BODY ════════════════════════════════════════════════════ */}
          <div style={{ padding: "28px 36px 24px", boxSizing: "border-box" }}>

            {/* ── 1. KPIs ── */}
            <div style={{ marginBottom: 28 }}>
              <SectionHeading number="1" title="Key Performance Indicators" />
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thBase, width: "37%", borderRadius: "6px 0 0 0" }}>
                      Indicator
                    </th>
                    <th style={{ ...thBase, width: "42%" }}>Formula</th>
                    <th style={{ ...thBase, textAlign: "right", borderRadius: "0 6px 0 0" }}>
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kpiRows.map((row, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa" }}
                    >
                      <td style={tdBase}>{row.label}</td>
                      <td
                        style={{
                          ...tdBase,
                          fontFamily: "monospace",
                          fontSize: 10,
                          color: "#6b7280",
                          fontWeight: 400,
                        }}
                      >
                        {row.formula}
                      </td>
                      <td
                        style={{
                          ...tdBase,
                          textAlign: "right",
                          fontWeight: 700,
                          color: row.highlight ? "#e11d48" : "#4c1d95",
                        }}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── 2. Summary Statistics ── */}
            <div style={{ marginBottom: 28 }}>
              <SectionHeading number="2" title="Summary Statistics" />
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "10px 10px",
                }}
              >
                <tbody>
                  {cardRows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((c, j) => (
                        <td
                          key={j}
                          style={{ width: "33.33%", verticalAlign: "top", padding: 0 }}
                        >
                          <StatCard label={c.label} value={c.value} />
                        </td>
                      ))}
                      {/* Pad last row if fewer than 3 cards */}
                      {row.length < 3 &&
                        Array.from({ length: 3 - row.length }).map((_, k) => (
                          <td key={`pad-${k}`} style={{ width: "33.33%" }} />
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── 3. Comparative Insights ── */}
            <div style={{ marginBottom: 28 }}>
              <SectionHeading number="3" title="Comparative Insights" />
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "14px 0",
                }}
              >
                <tbody>
                  <tr>
                    {/* Chart A */}
                    <td
                      style={{
                        width: "50%", verticalAlign: "top",
                        border: "1px solid #e5e7eb", borderRadius: 8,
                        padding: "14px 12px 10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10, fontWeight: 700, color: "#4b5563",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          marginBottom: 2,
                        }}
                      >
                        A. First vs Second Prick Success
                      </div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 8 }}>
                        % of patients per attempt type
                      </div>
                      <StaticBarChart data={prickData} unit="%" fixedMax={100} />
                      <table style={{ borderCollapse: "collapse", marginTop: 4 }}>
                        <tbody>
                          <tr>
                            {prickData.map((d, i) => (
                              <td
                                key={i}
                                style={{
                                  paddingRight: 14, fontSize: 10,
                                  color: "#4b5563", fontFamily: "DM Sans, sans-serif",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 10, height: 10, borderRadius: 2,
                                    backgroundColor: d.color,
                                    marginRight: 5, verticalAlign: "middle",
                                  }}
                                />
                                {d.label} — <strong>{d.value}%</strong>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    {/* Chart B */}
                    <td
                      style={{
                        width: "50%", verticalAlign: "top",
                        border: "1px solid #e5e7eb", borderRadius: 8,
                        padding: "14px 12px 10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10, fontWeight: 700, color: "#4b5563",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          marginBottom: 2,
                        }}
                      >
                        B. Insertions vs Phlebitis Cases
                      </div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 8 }}>
                        Absolute count comparison
                      </div>
                      <StaticBarChart data={insertionPhlebData} />
                      <table style={{ borderCollapse: "collapse", marginTop: 4 }}>
                        <tbody>
                          <tr>
                            {insertionPhlebData.map((d, i) => (
                              <td
                                key={i}
                                style={{
                                  paddingRight: 14, fontSize: 10,
                                  color: "#4b5563", fontFamily: "DM Sans, sans-serif",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 10, height: 10, borderRadius: 2,
                                    backgroundColor: d.color,
                                    marginRight: 5, verticalAlign: "middle",
                                  }}
                                />
                                {d.label} — <strong>{d.value}</strong>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── 4. Monthly Phlebitis Trend (All Time) ── */}
            <div
              style={{
                marginBottom: 28,
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <SectionHeading number="4" title="Monthly Phlebitis Trend (All Time)" />

              {monthlyData.length === 0 ? (
                <div
                  style={{ padding: "20px 0", fontSize: 11, color: "#9ca3af", textAlign: "center" }}
                >
                  No monthly breakdown available.
                </div>
              ) : (
                <>
                  {/* Line chart */}
                  <div
                    style={{
                      border: "1px solid #e5e7eb", borderRadius: 8,
                      padding: "14px 12px 10px", marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10, fontWeight: 700, color: "#4b5563",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        marginBottom: 2,
                      }}
                    >
                      Phlebitis Cases per Month (VIP ≥ 2)
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 10 }}>
                      VIP score ≥ 2 · full department history
                    </div>
                    <StaticLineChart data={monthlyData} />
                  </div>

                  {/* Month-by-month mini cards */}
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 9, fontWeight: 700, color: "#6d28d9",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        marginBottom: 8,
                      }}
                    >
                      Month-by-Month Breakdown
                    </div>
                    {(() => {
                      const maxCase = Math.max(...monthlyData.map((d) => d.phlebitis_cases));
                      const positiveCases = monthlyData.filter((d) => d.phlebitis_cases > 0);
                      const minCase =
                        positiveCases.length > 0
                          ? Math.min(...positiveCases.map((d) => d.phlebitis_cases))
                          : 0;
                      const chunkRows: typeof monthlyData[] = [];
                      for (let i = 0; i < monthlyData.length; i += 6) {
                        chunkRows.push(monthlyData.slice(i, i + 6));
                      }
                      return (
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "separate",
                            borderSpacing: "6px 6px",
                          }}
                        >
                          <tbody>
                            {chunkRows.map((chunk, ri) => (
                              <tr key={ri}>
                                {chunk.map((d, ci) => {
                                  const isMax = d.phlebitis_cases === maxCase;
                                  const isMin =
                                    d.phlebitis_cases === minCase &&
                                    d.phlebitis_cases > 0 &&
                                    !isMax;
                                  return (
                                    <td
                                      key={ci}
                                      style={{
                                        verticalAlign: "top",
                                        padding: 0,
                                        width: "16.6%",
                                      }}
                                    >
                                      <div
                                        style={{
                                          backgroundColor: isMax
                                            ? "#ede9fe"
                                            : isMin
                                            ? "#fef9c3"
                                            : "#faf5ff",
                                          border: `1px solid ${
                                            isMax
                                              ? "#c4b5fd"
                                              : isMin
                                              ? "#fde68a"
                                              : "#ede9fe"
                                          }`,
                                          borderRadius: 7,
                                          padding: "7px 10px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: 8, fontWeight: 600,
                                            color: "#9ca3af",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            marginBottom: 3,
                                          }}
                                        >
                                          {fmtMonthLabel(d.month_start)}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 16, fontWeight: 700,
                                            color: isMax
                                              ? "#4c1d95"
                                              : isMin
                                              ? "#92400e"
                                              : "#3b0764",
                                            fontFamily: "DM Serif Display, serif",
                                            lineHeight: 1,
                                          }}
                                        >
                                          {d.phlebitis_cases}
                                        </div>
                                        {isMax && (
                                          <div
                                            style={{
                                              fontSize: 8, color: "#7c3aed",
                                              fontWeight: 600, marginTop: 2,
                                            }}
                                          >
                                            ▲ High
                                          </div>
                                        )}
                                        {isMin && (
                                          <div
                                            style={{
                                              fontSize: 8, color: "#b45309",
                                              fontWeight: 600, marginTop: 2,
                                            }}
                                          >
                                            ▼ Low
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                                {chunk.length < 6 &&
                                  Array.from({ length: 6 - chunk.length }).map(
                                    (_, k) => (
                                      <td
                                        key={`empty-${k}`}
                                        style={{ width: "16.6%" }}
                                      />
                                    )
                                  )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>

                  {/* Analysis strip */}
                  <div
                    style={{
                      backgroundColor: "#f5f3ff",
                      border: "1px solid #ede9fe",
                      borderRadius: 9,
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9, fontWeight: 700, color: "#6d28d9",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        marginBottom: 10,
                      }}
                    >
                      Summary Analysis
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          {[
                            { label: "Average", value: monthlyAvg.toFixed(1), sub: "cases / month" },
                            {
                              label: "Highest",
                              value: monthlyMax ? monthlyMax.phlebitis_cases : "—",
                              sub: monthlyMax ? fmtMonthFull(monthlyMax.month_start) : "",
                            },
                            {
                              label: "Lowest",
                              value: monthlyMin ? monthlyMin.phlebitis_cases : "—",
                              sub: monthlyMin
                                ? fmtMonthFull(monthlyMin.month_start)
                                : "No cases",
                            },
                            {
                              label: "Total",
                              value: monthlyTotal,
                              sub: `across ${monthlyData.length} month${
                                monthlyData.length !== 1 ? "s" : ""
                              }`,
                            },
                          ].map((stat, i, arr) => (
                            <td
                              key={i}
                              style={{
                                width: "25%", verticalAlign: "top",
                                paddingLeft: i === 0 ? 0 : 14,
                                paddingRight: i === arr.length - 1 ? 0 : 14,
                                borderRight:
                                  i < arr.length - 1
                                    ? "1px solid #ddd6fe"
                                    : "none",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 8, fontWeight: 600, color: "#a78bfa",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.07em", marginBottom: 4,
                                }}
                              >
                                {stat.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 18, fontWeight: 700, color: "#4c1d95",
                                  fontFamily: "DM Serif Display, serif",
                                  lineHeight: 1, marginBottom: 2,
                                }}
                              >
                                {stat.value}
                              </div>
                              <div style={{ fontSize: 9, color: "#9ca3af" }}>
                                {stat.sub}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* ── 5. Resource Utilization & Cost ── */}
            <div
              style={{
                marginBottom: 24,
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <SectionHeading number="5" title="Resource Utilization & Cost" />
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thBase, borderRadius: "6px 0 0 0" }}>Metric</th>
                    <th
                      style={{
                        ...thBase,
                        textAlign: "right",
                        borderRadius: "0 6px 0 0",
                      }}
                    >
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "Total Insertion Packages Used",
                      value: report.total_insertion_packages,
                    },
                    {
                      label: "Total Insertion Cost",
                      value: inr(report.total_insertion_cost),
                    },
                    { label: "Cost per Patient", value: inr(costPerPatient) },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa" }}
                    >
                      <td style={tdBase}>{row.label}</td>
                      <td
                        style={{
                          ...tdBase,
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#4c1d95",
                        }}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Footer ── */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                borderTop: "1px solid #e5e7eb",
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      verticalAlign: "top", paddingTop: 14,
                      fontSize: 10, color: "#6b7280",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#374151" }}>Prepared by:</strong>{" "}
                      Quality and Nursing Audit Team
                    </div>
                    <div style={{ marginTop: 3 }}>
                      <strong style={{ color: "#374151" }}>Reviewed by:</strong>{" "}
                      Department Head – Infusion Therapy Unit
                    </div>
                  </td>
                  <td
                    style={{
                      verticalAlign: "top", paddingTop: 14,
                      textAlign: "right", fontSize: 9,
                      color: "#9ca3af", fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    <div>Generated automatically by IV Line Management System</div>
                    <div style={{ marginTop: 2 }}>
                      {new Date().toLocaleString("en-IN")}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }
);

InfusionReportPage.displayName = "InfusionReportPage";