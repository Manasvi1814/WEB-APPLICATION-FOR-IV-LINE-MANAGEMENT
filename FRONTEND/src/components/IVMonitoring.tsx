import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface MonitoringRecord {
  id: string;
  iv_record_id: string;
  monitoring_date: string;
  infiltration_score: number;
  vip_score: number;
  dressing_appearance: string;
  dressing_replacement_done: boolean;
  flushing_pvc_done: boolean;
  infusion_system_replaced: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ivRecord: { id: string; pvc_size?: string; vein_site?: string } | null;
}



const IVMonitoring: React.FC<Props> = ({ isOpen, onClose, ivRecord }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MonitoringRecord[]>([]);
  const [form, setForm] = useState({
    infiltration_score: 0,
    vip_score: 0,
    dressing_appearance: "",
    dressing_replacement_done: false,
    flushing_pvc_done: false,
    infusion_system_replaced: false,
  });

  useEffect(() => {
    if (isOpen && ivRecord?.id) {
      fetchHistory();
    }
  }, [isOpen, ivRecord]);

  const fetchHistory = async () => {
    if (!ivRecord?.id) return;
    setLoading(true);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("iv_monitoring")
      .select("*")
      .eq("iv_record_id", ivRecord.id)
      .gte("monitoring_date", sevenDaysAgo.toISOString())
      .order("monitoring_date", { ascending: false });

    setLoading(false);

    if (error) {
      console.error("Error fetching IV monitoring:", error.message);
      return;
    }

    setHistory((data as MonitoringRecord[]) || []);
  };

  const handleSave = async () => {
    if (!ivRecord?.id) return;

    setLoading(true);

    const payload = {
      iv_record_id: ivRecord.id,
      monitoring_date: new Date().toISOString(),
      infiltration_score: form.infiltration_score,
      vip_score: form.vip_score,
      dressing_appearance: form.dressing_appearance || null,
      dressing_replacement_done: form.dressing_replacement_done,
      flushing_pvc_done: form.flushing_pvc_done,
      infusion_system_replaced: form.infusion_system_replaced,
    };

    const { error } = await supabase.from("iv_monitoring").insert([payload]);

    setLoading(false);

    if (error) {
      console.error("Error saving IV monitoring:", error.message);
      alert(error.message);
      return;
    }

    setForm({
      infiltration_score: 0,
      vip_score: 0,
      dressing_appearance: "",
      dressing_replacement_done: false,
      flushing_pvc_done: false,
      infusion_system_replaced: false,
    });

    await fetchHistory();
  };

  if (!isOpen || !ivRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              IV Monitoring
            </h2>
            <p className="text-xs text-gray-500">
              PVC: {ivRecord.pvc_size || "N/A"} • Site:{" "}
              {ivRecord.vein_site || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Infiltration score (0–4)
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.infiltration_score}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    infiltration_score: Number(e.target.value),
                  }))
                }
              >
                {[0, 1, 2, 3, 4].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                VIP score (0–5)
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.vip_score}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    vip_score: Number(e.target.value),
                  }))
                }
              >
                {[0, 1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Dressing appearance
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Dry, intact, soiled"
              value={form.dressing_appearance}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  dressing_appearance: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2 text-xs text-gray-700 md:grid-cols-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.dressing_replacement_done}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    dressing_replacement_done: e.target.checked,
                  }))
                }
              />
              <span>Dressing replacement done</span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.flushing_pvc_done}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    flushing_pvc_done: e.target.checked,
                  }))
                }
              />
              <span>Flushing of PVC done</span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.infusion_system_replaced}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    infusion_system_replaced: e.target.checked,
                  }))
                }
              />
              <span>Infusion system replaced</span>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? "Saving..." : "Save monitoring"}
            </button>
          </div>
        </div>

        {/* Last 7 days history */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700">
            Last 7 days monitoring
          </h3>
          {loading && history.length === 0 ? (
            <p className="text-xs text-gray-500">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-gray-500">
              No monitoring entries in the last 7 days.
            </p>
          ) : (
            <div className="divide-y rounded-md border border-gray-200 text-xs">
              {history.map((m) => (
                <div
                  key={m.id}
                  className="grid gap-1 px-3 py-2 md:grid-cols-4"
                >
                  <div>
                    <span className="font-medium">
                      {new Date(m.monitoring_date).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    VIP: {m.vip_score} | Infilt: {m.infiltration_score}
                  </div>
                  <div>
                    Dressing: {m.dressing_appearance || "—"}
                  </div>
                  <div>
                    {m.dressing_replacement_done && "Dressing repl. • "}
                    {m.flushing_pvc_done && "Flushed • "}
                    {m.infusion_system_replaced && "System repl."}
                    {!m.dressing_replacement_done &&
                      !m.flushing_pvc_done &&
                      !m.infusion_system_replaced &&
                      "No interventions"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IVMonitoring;
