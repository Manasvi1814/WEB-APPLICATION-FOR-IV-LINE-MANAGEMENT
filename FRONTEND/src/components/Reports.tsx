// src/components/Reports.tsx
import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Report } from "../types";
import * as XLSX from "xlsx";
import generatePDF from "react-to-pdf";

const ADMIN_PIN = "1234"; // TODO: move to env/secure storage

const Reports: React.FC = () => {
  const { department } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ref for PDF export
  const reportRef = useRef<HTMLDivElement | null>(null);

  if (!department) {
    return (
      <div className="p-4 text-sm text-red-600">
        Department not found. Please log in again.
      </div>
    );
  }

  const handleUnlock = () => {
    if (pinInput === ADMIN_PIN) {
      setIsUnlocked(true);
      setErrorMsg(null);
    } else {
      setErrorMsg("Incorrect admin PIN.");
    }
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setErrorMsg("Please select both start and end dates.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    const { error: rpcError } = await supabase.rpc(
      "generate_report_for_department",
      {
        p_department_id: department.id,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError.message);
      setErrorMsg(rpcError.message);
      setLoading(false);
      return;
    }

    const { data, error: selectError } = await supabase
      .from("reports")
      .select("*")
      .eq("department_id", department.id)
      .eq("report_start_date", startDate)
      .eq("report_end_date", endDate)
      .single<Report>();

    setLoading(false);

    if (selectError) {
      console.error("Select report error:", selectError.message);
      setErrorMsg(selectError.message);
      setReport(null);
      return;
    }

    setReport(data);
  };

  const handleDownloadExcel = () => {
    if (!report) return;

    const rows = [
      {
        Section: "Denominators",
        Metric: "Total accesses",
        Value: report.total_peripheral_venous_access,
      },
      {
        Section: "Denominators",
        Metric: "Total patients",
        Value: report.total_patients,
      },
      {
        Section: "Denominators",
        Metric: "Total patient days",
        Value: report.total_patient_days,
      },
      {
        Section: "Phlebitis & extravasation",
        Metric: "Phlebitis cases",
        Value: report.phlebitis_cases,
      },
      {
        Section: "Phlebitis & extravasation",
        Metric: "Phlebitis / access (%)",
        Value: report.phlebitis_rate_access_percent,
      },
      {
        Section: "Phlebitis & extravasation",
        Metric: "Phlebitis / patient days (%)",
        Value: report.phlebitis_rate_patient_days_percent,
      },
      {
        Section: "Phlebitis & extravasation",
        Metric: "Extravasation cases",
        Value: report.extravasation_cases,
      },
      {
        Section: "Phlebitis & extravasation",
        Metric: "Extravasation / patient days (%)",
        Value: report.extravasation_rate_percent,
      },
      {
        Section: "Insertion success",
        Metric: "First prick success count",
        Value: report.first_prick_success_count,
      },
      {
        Section: "Insertion success",
        Metric: "First prick success (%)",
        Value: report.first_prick_success_percent,
      },
      {
        Section: "Insertion success",
        Metric: "Second prick success count",
        Value: report.second_prick_success_count,
      },
      {
        Section: "Insertion success",
        Metric: "Second prick success (%)",
        Value: report.second_prick_success_percent,
      },
      {
        Section: "Escalation & cost",
        Metric: "Escalation to anaesthetics count",
        Value: report.escalation_to_anaesthetics_count,
      },
      {
        Section: "Escalation & cost",
        Metric: "Escalation to anaesthetics (%)",
        Value: report.escalation_to_anaesthetics_percent,
      },
      {
        Section: "Escalation & cost",
        Metric: "Total insertion packages",
        Value: report.total_insertion_packages,
      },
      {
        Section: "Escalation & cost",
        Metric: "Total insertion cost",
        Value: report.total_insertion_cost,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const filename = `report_${department.name || "dept"}_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current || !report) return;

    generatePDF(() => reportRef.current!, {
      filename: `report_${department.name || "dept"}_${startDate}_${endDate}.pdf`,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Department Reports
          </h1>
          <p className="text-xs text-gray-500">
            Department:{" "}
            <span className="font-medium">{department.name || "Current"}</span>
          </p>
        </div>
      </div>

      {/* Admin lock */}
      {!isUnlocked && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            Admin access required
          </p>
          <p className="text-xs text-red-700">
            Only department admins can view and generate reports.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              className="w-40 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter admin PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button
              onClick={handleUnlock}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Unlock
            </button>
          </div>
          {errorMsg && (
            <p className="text-xs text-red-700">{errorMsg}</p>
          )}
        </div>
      )}

      {isUnlocked && (
        <>
          {/* Date range + actions */}
          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Generate report for date range
            </h2>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Start date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  End date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {loading ? "Generating..." : "Generate report"}
                </button>
              </div>
            </div>

            {/* Download buttons: only visible after a report is loaded */}
            {report && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 mt-2">
                <button
                  onClick={handleDownloadExcel}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Download Excel
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Download PDF
                </button>
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-red-600">{errorMsg}</p>
            )}
          </div>

          {/* Report display */}
          <div
            ref={reportRef}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <h2 className="text-sm font-semibold text-gray-800">
              Report summary
            </h2>

            {!report ? (
              <p className="text-xs text-gray-500">
                No report loaded. Select a date range and click "Generate
                report".
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  Period:{" "}
                  <span className="font-medium">
                    {report.report_start_date} to {report.report_end_date}
                  </span>
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Denominators */}
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                    <h3 className="mb-2 text-xs font-semibold text-gray-700">
                      Denominators
                    </h3>
                    <table className="w-full text-xs text-gray-700">
                      <tbody>
                        <tr>
                          <td className="py-0.5 pr-2">Total accesses</td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.total_peripheral_venous_access}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">Total patients</td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.total_patients}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">Total patient days</td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.total_patient_days}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Phlebitis & extravasation */}
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                    <h3 className="mb-2 text-xs font-semibold text-gray-700">
                      Phlebitis & extravasation
                    </h3>
                    <table className="w-full text-xs text-gray-700">
                      <tbody>
                        <tr>
                          <td className="py-0.5 pr-2">Phlebitis cases</td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.phlebitis_cases}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Phlebitis / access (%)
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.phlebitis_rate_access_percent.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Phlebitis / patient days (%)
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.phlebitis_rate_patient_days_percent.toFixed(
                              2
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Extravasation cases
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.extravasation_cases}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Extravasation / patient days (%)
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.extravasation_rate_percent.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Insertion success */}
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                    <h3 className="mb-2 text-xs font-semibold text-gray-700">
                      Insertion success
                    </h3>
                    <table className="w-full text-xs text-gray-700">
                      <tbody>
                        <tr>
                          <td className="py-0.5 pr-2">
                            First prick success
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.first_prick_success_count} (
                            {report.first_prick_success_percent.toFixed(2)}%)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Second prick success
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.second_prick_success_count} (
                            {report.second_prick_success_percent.toFixed(2)}%)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Escalation & cost */}
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                    <h3 className="mb-2 text-xs font-semibold text-gray-700">
                      Escalation & cost
                    </h3>
                    <table className="w-full text-xs text-gray-700">
                      <tbody>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Escalation to anaesthetics
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.escalation_to_anaesthetics_count} (
                            {report.escalation_to_anaesthetics_percent.toFixed(
                              2
                            )}
                            %)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Total insertion packages
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            {report.total_insertion_packages}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2">
                            Total insertion cost
                          </td>
                          <td className="py-0.5 text-right font-semibold">
                            ₹{report.total_insertion_cost.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
