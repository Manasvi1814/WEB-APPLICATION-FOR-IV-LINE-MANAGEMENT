// src/components/Reports.tsx
import React, { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Report } from "../types";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import { InfusionReportPage } from "./InfusionReportPage";

const ADMIN_PIN = "1234";

// ─── Monthly row type (from view) ────────────────────────────────────────────
interface MonthlyRow {
  department_id: string;
  month_start: string;
  phlebitis_cases: number;
}

// ─── SVG icons ───────────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const FileExcelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const FilePdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin .8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

// ─── Component ────────────────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const { department } = useAuth();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  if (!department) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:200, fontFamily:"DM Sans,sans-serif" }}>
        <p style={{ color:"#9ca3af", fontSize:13 }}>Department not found. Please log in again.</p>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUnlock = () => {
    if (pinInput === ADMIN_PIN) { setIsUnlocked(true); setErrorMsg(null); setPinInput(""); }
    else setErrorMsg("Incorrect admin PIN. Please try again.");
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) { setErrorMsg("Please select both start and end dates."); return; }
    if (new Date(startDate) > new Date(endDate)) { setErrorMsg("Start date must be before end date."); return; }
    setErrorMsg(null);
    setLoading(true);

    // 1. Run the report generation RPC
    const { error: rpcError } = await supabase.rpc("generate_report_for_department", {
      p_department_id: department.id,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (rpcError) { setErrorMsg(rpcError.message); setLoading(false); return; }

    // 2. Fetch the report row
    const { data: reportData, error: repErr } = await supabase
      .from("reports").select("*")
      .eq("department_id", department.id)
      .eq("report_start_date", startDate)
      .eq("report_end_date", endDate)
      .single<Report>();
    if (repErr) { setErrorMsg(repErr.message); setReport(null); setLoading(false); return; }

    // 3. Fetch ALL monthly phlebitis data for this department (all time).
    //    Section 4 of the report shows the full trend, matching the Trends page.
    const { data: mData } = await supabase
      .from("monthly_phlebitis_by_department")
      .select("department_id, month_start, phlebitis_cases")
      .eq("department_id", department.id)
      .order("month_start", { ascending: true });

    setReport(reportData);
    setMonthlyData((mData as MonthlyRow[]) || []);
    setLoading(false);
  };

  const handleDownloadExcel = () => {
    if (!report) return;
    const deptName = department.name || "Department";
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

    const rows: (string | number)[][] = [
      ["INFUSION THERAPY QUALITY REPORT"],
      [`Department: ${deptName}`],
      [`Reporting Period: ${fmtDate(report.report_start_date)} – ${fmtDate(report.report_end_date)}`],
      [`Generated On: ${new Date().toLocaleString("en-IN")}`],
      [],
      ["1. KEY PERFORMANCE INDICATORS"],
      ["Indicator", "Formula", "Result"],
      ["Phlebitis Rate (per 100 insertions)",   `${report.phlebitis_cases} ÷ ${report.total_peripheral_venous_access} × 100`, report.phlebitis_cases === 0 ? "Nil" : `${Number(report.phlebitis_rate_access_percent).toFixed(2)}%`],
      ["Phlebitis Rate (per 100 patient days)", `${report.phlebitis_cases} ÷ ${report.total_patient_days} × 100`,              report.phlebitis_cases === 0 ? "Nil" : `${Number(report.phlebitis_rate_patient_days_percent).toFixed(2)}%`],
      ["Extravasation Rate",                    `${report.extravasation_cases} ÷ ${report.total_patient_days} × 100`,           report.extravasation_cases === 0 ? "Nil" : `${Number(report.extravasation_rate_percent).toFixed(2)}%`],
      ["First Prick Success Rate",              `${report.first_prick_success_count} ÷ ${report.total_patients} × 100`,         `${Number(report.first_prick_success_percent).toFixed(1)}%`],
      ["Second Prick Success Rate",             `${report.second_prick_success_count} ÷ ${report.total_patients} × 100`,        `${Number(report.second_prick_success_percent).toFixed(1)}%`],
      ["Escalation to Anaesthetics",            `${report.escalation_to_anaesthetics_count} ÷ ${report.total_patients} × 100`, report.escalation_to_anaesthetics_count === 0 ? "Nil" : `${Number(report.escalation_to_anaesthetics_percent).toFixed(2)}%`],
      ["Patient Satisfaction (Infusion Therapy)", `${report.positive_feedbacks ?? 0} ÷ ${report.total_feedbacks ?? 0} × 100`, report.total_feedbacks > 0 ? `${Number(report.feedback_percentage).toFixed(1)}%` : "Nil"],
      [],
      ["2. SUMMARY STATISTICS"],
      ["Metric", "Value"],
      ["Total Patients", report.total_patients],
      ["Total Patient Days", report.total_patient_days],
      ["Total Insertions (Peripheral Venous Access)", report.total_peripheral_venous_access],
      ["Phlebitis Cases", report.phlebitis_cases],
      ["Extravasation Cases", report.extravasation_cases],
      ["First Prick Success Cases", report.first_prick_success_count],
      ["Second Prick Success Cases", report.second_prick_success_count],
      ["Escalation to Anaesthetics Count", report.escalation_to_anaesthetics_count],
      ["Total Feedbacks", report.total_feedbacks ?? 0],
      ["Positive Feedbacks (Rating 4–5)", report.positive_feedbacks ?? 0],
      ["Patient Satisfaction (%)", report.total_feedbacks > 0 ? `${Number(report.feedback_percentage).toFixed(1)}%` : "Nil"],
      [],
      ["3. MONTHLY PHLEBITIS TREND"],
      ["Month", "Phlebitis Cases"],
      ...monthlyData.map(d => [new Date(d.month_start).toLocaleDateString("en-IN", { month:"long", year:"numeric" }), d.phlebitis_cases]),
      [],
      ["4. RESOURCE UTILIZATION & COST"],
      ["Metric", "Value"],
      ["Total Insertion Packages Used", report.total_insertion_packages],
      ["Total Insertion Cost (₹)", Number(report.total_insertion_cost).toFixed(2)],
      ["Cost per Patient (₹)", report.total_patients > 0 ? (Number(report.total_insertion_cost) / report.total_patients).toFixed(2) : "0.00"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch:50 }, { wch:40 }, { wch:18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Infusion Report");
    XLSX.writeFile(wb, `InfusionReport_${deptName.replace(/\s+/g,"_")}_${startDate}_to_${endDate}.xlsx`);
  };

  const handleDownloadPDF = async () => {
    if (!report || !reportRef.current) return;
    const deptName = department.name || "Department";
    setPdfLoading(true);
    try {
      const element = reportRef.current;
      await (html2pdf as any)().set({
        margin: [8, 8, 8, 8],
        filename: `InfusionReport_${deptName.replace(/\s+/g,"_")}_${startDate}_to_${endDate}.pdf`,
        image: { type:"jpeg", quality:0.98 },
        html2canvas: { scale:2, useCORS:true, logging:false, scrollY:0, windowWidth:element.scrollWidth },
        jsPDF: { unit:"mm" as const, format:"a4" as const, orientation:"portrait" as const },
        pagebreak: { mode:["css","legacy"] as const },
      }).from(element).save();
    } finally { setPdfLoading(false); }
  };

  // ─── Shared glass card style ──────────────────────────────────────────────
  const glassCard: React.CSSProperties = {
    background:"rgba(255,255,255,0.78)",
    backdropFilter:"blur(18px) saturate(1.5)",
    WebkitBackdropFilter:"blur(18px) saturate(1.5)",
    border:"1px solid rgba(221,214,254,0.65)",
    borderRadius:14,
    boxShadow:"0 2px 14px rgba(109,40,217,0.07)",
    overflow:"hidden",
    fontFamily:"DM Sans,sans-serif",
  };

  return (
    <div style={{ padding:"32px 40px", maxWidth:1100, margin:"0 auto", fontFamily:"DM Sans,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Page header ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1e1b4b", margin:0 }}>Infusion Therapy Reports</h1>
          <p style={{ fontSize:12, color:"#a78bfa", margin:"4px 0 0" }}>{department.name}</p>
        </div>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"6px 14px", borderRadius:20, fontSize:11, fontWeight:600,
          border:"1px solid", fontFamily:"DM Sans,sans-serif",
          background: isUnlocked ? "#f0fdf4" : "#fffbeb",
          color:       isUnlocked ? "#15803d" : "#92400e",
          borderColor: isUnlocked ? "#bbf7d0" : "#fde68a",
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", backgroundColor: isUnlocked ? "#16a34a" : "#f59e0b", display:"inline-block" }} />
          {isUnlocked ? "Admin Access Granted" : "Admin Lock Active"}
        </span>
      </div>

      {/* ── Admin PIN card ── */}
      {!isUnlocked && (
        <div style={{ ...glassCard, marginBottom:20 }}>
          <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(253,230,138,0.6)", background:"rgba(254,252,232,0.9)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"#fef3c7", border:"1px solid #fde68a", display:"flex", alignItems:"center", justifyContent:"center", color:"#b45309" }}>
              <LockIcon />
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#92400e", margin:0 }}>Admin Access Required</p>
              <p style={{ fontSize:11, color:"#b45309", margin:"2px 0 0" }}>Reports are restricted. Enter admin PIN to continue.</p>
            </div>
          </div>
          <div style={{ padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, maxWidth:360 }}>
              <div style={{ flex:1, position:"relative" }}>
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="Enter admin PIN"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUnlock()}
                  autoFocus
                  style={{ width:"100%", border:"1px solid rgba(221,214,254,0.8)", borderRadius:10, padding:"10px 40px 10px 14px", fontSize:13, background:"rgba(255,255,255,0.9)", color:"#1e1b4b", outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }}
                />
                <button type="button" onClick={() => setShowPin(p => !p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#7c3aed", lineHeight:0 }}>
                  <EyeIcon open={showPin} />
                </button>
              </div>
              <button onClick={handleUnlock} style={{ padding:"10px 20px", borderRadius:10, background:"#4c1d95", color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                Unlock
              </button>
            </div>
            {errorMsg && (
              <p style={{ marginTop:10, fontSize:12, color:"#dc2626", display:"flex", alignItems:"center", gap:6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Date range card ── */}
      {isUnlocked && (
        <div style={{ ...glassCard, marginBottom:20 }}>
          <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(221,214,254,0.4)" }}>
            <h2 style={{ fontSize:13, fontWeight:700, color:"#5b21b6", margin:0 }}>Generate Report</h2>
            <p style={{ fontSize:11, color:"#9ca3af", margin:"3px 0 0" }}>Select a date range to generate the infusion therapy quality report</p>
          </div>
          <div style={{ padding:"20px 24px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
              {/* Start date */}
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#5b21b6", marginBottom:6 }}>Start Date</label>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#a78bfa", pointerEvents:"none" }}><CalendarIcon /></div>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ width:"100%", paddingLeft:36, paddingRight:12, paddingTop:10, paddingBottom:10, border:"1px solid rgba(221,214,254,0.8)", borderRadius:10, fontSize:13, background:"rgba(255,255,255,0.9)", color:"#1e1b4b", outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
                </div>
              </div>
              {/* End date */}
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#5b21b6", marginBottom:6 }}>End Date</label>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#a78bfa", pointerEvents:"none" }}><CalendarIcon /></div>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ width:"100%", paddingLeft:36, paddingRight:12, paddingTop:10, paddingBottom:10, border:"1px solid rgba(221,214,254,0.8)", borderRadius:10, fontSize:13, background:"rgba(255,255,255,0.9)", color:"#1e1b4b", outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
                </div>
              </div>
              {/* Generate button */}
              <div style={{ display:"flex", alignItems:"flex-end" }}>
                <button onClick={handleGenerate} disabled={loading} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background: loading ? "#c4b5fd" : "#4c1d95", color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor: loading ? "not-allowed" : "pointer", fontFamily:"DM Sans,sans-serif", transition:"background .15s" }}>
                  {loading ? <><SpinnerIcon /> Generating…</> : <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    Generate Report
                  </>}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p style={{ fontSize:12, color:"#dc2626", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:9, padding:"9px 14px", margin:"0 0 12px", display:"flex", alignItems:"center", gap:6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errorMsg}
              </p>
            )}

            {/* Export buttons */}
            {report && (
              <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:14, borderTop:"1px solid rgba(221,214,254,0.4)" }}>
                <span style={{ fontSize:11, color:"#9ca3af" }}>Export as:</span>
                <button onClick={handleDownloadExcel} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:9, background:"#059669", color:"#fff", border:"none", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                  <FileExcelIcon /> Excel (.xlsx)
                </button>
                <button onClick={handleDownloadPDF} disabled={pdfLoading} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:9, background: pdfLoading ? "#fca5a5" : "#dc2626", color:"#fff", border:"none", fontSize:12, fontWeight:600, cursor: pdfLoading ? "not-allowed" : "pointer", fontFamily:"DM Sans,sans-serif" }}>
                  {pdfLoading ? <><SpinnerIcon /> Exporting…</> : <><FilePdfIcon /> PDF</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {isUnlocked && !report && !loading && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#9ca3af" }}>
          <svg style={{ display:"block", margin:"0 auto 12px", opacity:0.3 }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p style={{ fontSize:13, margin:0 }}>Select a date range and click Generate Report</p>
        </div>
      )}

      {/* ── Report output ── */}
      {report && (
        <div style={{ marginTop:8 }}>
          <InfusionReportPage
            ref={reportRef}
            report={report}
            departmentName={department.name}
            monthlyData={monthlyData}
          />
        </div>
      )}
    </div>
  );
};

export default Reports;