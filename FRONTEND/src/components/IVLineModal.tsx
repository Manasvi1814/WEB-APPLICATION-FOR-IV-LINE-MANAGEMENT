import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface IVRecord {
  id: string;
  patient_id: string;
  inserted_by?: string;
  pvc_size?: string;
  vein_quality?: string;
  vein_site?: string;
  reason_for_insertion?: string;
  number_of_attempts?: number;
  result?: string;
  unsuccessful_reason?: string;
  insertion_pain?: number;
  insertion_date?: string;
  status?: "active" | "removed";

  removal_by?: string;
  removal_reason?: string;
  removal_date?: string;

  pvc_dislodgement?: boolean;
  patient_wish?: boolean;
  vesicant_drugs?: boolean;
  chemical_reason?: boolean;
  mechanical_reason?: boolean;

  remarks?: string;
  post_removal_status?: string;
  device_days?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient: { id: string; patient_id?: string } | null;
  onSave?: () => void;
}

const IVLineModal: React.FC<Props> = ({ isOpen, onClose, patient, onSave }) => {
  const { department } = useAuth();

  const [ivLines, setIvLines] = useState<IVRecord[]>([]);
  const [selectedLine, setSelectedLine] = useState<IVRecord | null>(null);

  const [loading, setLoading] = useState(false);

  const [insertionData, setInsertionData] = useState({
    pvc_size: "",
    vein_quality: "good",
    vein_site: "",
    reason_for_insertion: "",
    number_of_attempts: 1,
    result: "successful",
    unsuccessful_reason: "",
    insertion_pain: 0,
  });

  const [removalData, setRemovalData] = useState({
    removal_reason: "",
    remarks: "",
    pvc_dislodgement: false,
    patient_wish: false,
    vesicant_drugs: false,
    chemical_reason: false,
    mechanical_reason: false,
    post_removal_status: "",
  });

  useEffect(() => {
    if (isOpen && patient?.id) {
      fetchIVLines();
      setSelectedLine(null);
    }
  }, [isOpen, patient]);

  const fetchIVLines = async () => {
    if (!patient?.id) return;

    const { data, error } = await supabase
      .from("iv_records")
      .select("*")
      .eq("patient_id", patient.id)
      .order("insertion_date", { ascending: false });

    if (error) {
      console.error("Error fetching IV lines:", error.message);
      return;
    }

    setIvLines((data as IVRecord[]) || []);
  };

  const calculateDeviceDays = (date: string) => {
    const start = new Date(date);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleInsertIV = async () => {
    console.log("Insert IV clicked");
      console.log("USER:", department);
  console.log("PATIENT:", patient);

    if (!department|| !patient) return;

    // basic checks
    if (!insertionData.pvc_size) {
      alert("Please select PVC size.");
      return;
    }
    if (!insertionData.vein_site) {
      alert("Please enter vein site.");
      return;
    }
    if (!insertionData.reason_for_insertion) {
      alert("Please select reason for insertion.");
      return;
    }

    setLoading(true);

    // build payload without undefined department_id
    const payload: any = {
      patient_id: patient.id,
     

      pvc_size: insertionData.pvc_size,
      vein_quality: insertionData.vein_quality,
      vein_site: insertionData.vein_site,
      reason_for_insertion: insertionData.reason_for_insertion,

      number_of_attempts: insertionData.number_of_attempts,
      result: insertionData.result,
      unsuccessful_reason:
        insertionData.result === "unsuccessful"
          ? insertionData.unsuccessful_reason
          : null,

      insertion_pain: insertionData.insertion_pain,
      insertion_date: new Date().toISOString(),
      status: "active",
    };

    // only add department_id if it really exists on user
    

    const { data, error } = await supabase
      .from("iv_records")
      .insert([payload]);

    console.log("insert data:", data);
    console.log("insert error:", error);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    // reset + refresh
    setInsertionData({
      pvc_size: "",
      vein_quality: "good",
      vein_site: "",
      reason_for_insertion: "",
      number_of_attempts: 1,
      result: "successful",
      unsuccessful_reason: "",
      insertion_pain: 0,
    });

    await fetchIVLines();
    onSave?.();
  };

  const handleRemoveIV = async () => {
    if (!department || !selectedLine || !selectedLine.insertion_date) return;

    setLoading(true);

    const deviceDays = calculateDeviceDays(selectedLine.insertion_date);

    const { error } = await supabase
      .from("iv_records")
      .update({
        removal_by: department.id,
        removal_date: new Date().toISOString(),

        removal_reason: removalData.removal_reason,
        remarks: removalData.remarks,

        pvc_dislodgement: removalData.pvc_dislodgement,
        patient_wish: removalData.patient_wish,
        vesicant_drugs: removalData.vesicant_drugs,
        chemical_reason: removalData.chemical_reason,
        mechanical_reason: removalData.mechanical_reason,

        post_removal_status: removalData.post_removal_status,

        device_days: deviceDays,
        status: "removed",
      })
      .eq("id", selectedLine.id);

    setLoading(false);

    if (error) {
      console.error("Remove IV error:", error.message);
      alert(error.message);
      return;
    }

    setSelectedLine(null);
    await fetchIVLines();
    onSave?.();
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              IV Line Management
            </h2>
            <p className="text-sm text-gray-500">
              Patient ID:{" "}
              <span className="font-medium">{patient.patient_id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {/* Existing IV Lines */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Existing IV Lines
            </h3>
            <span className="text-xs text-gray-500">
              {ivLines.length} record{ivLines.length !== 1 && "s"}
            </span>
          </div>

          {ivLines.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              No IV lines recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {ivLines.map((line) => (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setSelectedLine(line)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    selectedLine?.id === line.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {line.pvc_size || "PVC size N/A"}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          line.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {line.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Inserted{" "}
                      {line.insertion_date &&
                        new Date(line.insertion_date).toLocaleString()}
                      {line.vein_site && ` • Site: ${line.vein_site}`}
                    </p>
                    {line.reason_for_insertion && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Reason: {line.reason_for_insertion}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-blue-600">
                    {line.status === "active" ? "Manage" : "View"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Layout: Insert + Remove */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Insert IV */}
          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Insert New IV Line
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Reason */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Reason for Insertion
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={insertionData.reason_for_insertion}
                  onChange={(e) =>
                    setInsertionData({
                      ...insertionData,
                      reason_for_insertion: e.target.value,
                    })
                  }
                >
                  <option value="">Select reason</option>
                  <option value="medicines">Medicines</option>
                  <option value="fluids">Fluids</option>
                  <option value="blood_products">Blood Products</option>
                  <option value="others">Others</option>
                </select>
              </div>

              {/* PVC size */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  PVC Size
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={insertionData.pvc_size}
                  onChange={(e) =>
                    setInsertionData({
                      ...insertionData,
                      pvc_size: e.target.value,
                    })
                  }
                >
                  <option value="">Select size</option>
                  <option value="20G">20G</option>
                  <option value="22G">22G</option>
                  <option value="24G">24G</option>
                  <option value="26G">26G</option>
                </select>
              </div>

              {/* Vein quality */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Vein Quality
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={insertionData.vein_quality}
                  onChange={(e) =>
                    setInsertionData({
                      ...insertionData,
                      vein_quality: e.target.value,
                    })
                  }
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Vein site */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Vein Site
                </label>
                <input
                  placeholder="e.g. Left forearm"
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={insertionData.vein_site}
                  onChange={(e) =>
                    setInsertionData({
                      ...insertionData,
                      vein_site: e.target.value,
                    })
                  }
                />
              </div>

              {/* Attempts */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Number of Attempts
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={insertionData.number_of_attempts}
                  onChange={(e) =>
                    setInsertionData({
                      ...insertionData,
                      number_of_attempts:
                        parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>

              {/* Pain score */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Pain Score (0–10)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={insertionData.insertion_pain}
                  onChange={(e) =>
                    setInsertionData({
                      ...insertionData,
                      insertion_pain:
                        parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleInsertIV}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
              >
                {loading ? "Saving..." : "Insert IV"}
              </button>
            </div>
          </div>

          {/* Removal */}
          <div className="space-y-4 rounded-lg border border-gray-200 bg-yellow-50/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                Remove IV Line
              </h3>
              {selectedLine && (
                <span className="text-xs text-gray-500">
                  Selected: {selectedLine.pvc_size || "N/A"} •{" "}
                  {selectedLine.insertion_date &&
                    new Date(
                      selectedLine.insertion_date
                    ).toLocaleDateString()}
                </span>
              )}
            </div>

            {!selectedLine || selectedLine.status !== "active" ? (
              <p className="rounded-md bg-yellow-100 px-3 py-2 text-xs text-yellow-800">
                Select an active IV line from the list to remove it.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Removal Reason
                    </label>
                    <input
                      placeholder="e.g. Therapy completed"
                      className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={removalData.removal_reason}
                      onChange={(e) =>
                        setRemovalData({
                          ...removalData,
                          removal_reason: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Remarks
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Additional notes"
                      className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={removalData.remarks}
                      onChange={(e) =>
                        setRemovalData({
                          ...removalData,
                          remarks: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2 text-xs text-gray-700 sm:grid-cols-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={removalData.patient_wish}
                        onChange={(e) =>
                          setRemovalData({
                            ...removalData,
                            patient_wish: e.target.checked,
                          })
                        }
                      />
                      <span>Patient wish</span>
                    </label>

                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={removalData.pvc_dislodgement}
                        onChange={(e) =>
                          setRemovalData({
                            ...removalData,
                            pvc_dislodgement: e.target.checked,
                          })
                        }
                      />
                      <span>PVC dislodgement</span>
                    </label>
                  </div>

                  <p className="text-xs text-gray-600">
                    Device days:{" "}
                    {selectedLine.insertion_date &&
                      calculateDeviceDays(selectedLine.insertion_date)}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleRemoveIV}
                    disabled={loading || !removalData.removal_reason}
                    className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    {loading ? "Updating..." : "Remove IV"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default IVLineModal;
