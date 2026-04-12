// src/components/IVMonitoring.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { X, Save, ClipboardList } from "lucide-react";

interface MonitoringRecord {
  id: string; iv_record_id: string; monitoring_date: string;
  infiltration_score: number; vip_score: number; dressing_appearance: string;
  dressing_replacement_done: boolean; flushing_pvc_done: boolean; infusion_system_replaced: boolean;
}

interface Props {
  isOpen: boolean; onClose: () => void;
  ivRecord: { id: string; pvc_size?: string; vein_site?: string } | null;
}

const Select: React.FC<{ label: string; value: number; options: number[]; onChange: (v: number) => void }> =
  ({ label, value, options, onChange }) => (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#5b21b6", marginBottom:5 }}>{label}</label>
      <select value={value} onChange={e => onChange(Number(e.target.value))} style={{ width:"100%", border:"1px solid rgba(221,214,254,0.8)", borderRadius:9, padding:"8px 12px", fontSize:13, background:"rgba(255,255,255,0.85)", color:"#1e1b4b", outline:"none", fontFamily:"DM Sans,sans-serif" }}>
        {options.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> =
  ({ label, checked, onChange }) => (
    <label style={{ display:"flex", alignItems:"center", gap:9, fontSize:12, color:"#374151", cursor:"pointer" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width:15, height:15, accentColor:"#6d28d9", cursor:"pointer" }} />
      {label}
    </label>
  );

const IVMonitoring: React.FC<Props> = ({ isOpen, onClose, ivRecord }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MonitoringRecord[]>([]);
  const [form, setForm] = useState({
    infiltration_score:0, vip_score:0, dressing_appearance:"",
    dressing_replacement_done:false, flushing_pvc_done:false, infusion_system_replaced:false,
  });

  useEffect(() => { if (isOpen && ivRecord?.id) fetch7Days(); }, [isOpen, ivRecord]);

  const fetch7Days = async () => {
    if (!ivRecord?.id) return;
    setLoading(true);
    const ago = new Date(); ago.setDate(ago.getDate()-7);
    const { data, error } = await supabase.from("iv_monitoring").select("*")
      .eq("iv_record_id", ivRecord.id).gte("monitoring_date", ago.toISOString())
      .order("monitoring_date", { ascending:false });
    setLoading(false);
    if (!error) setHistory((data as MonitoringRecord[]) || []);
  };

  const handleSave = async () => {
    if (!ivRecord?.id) return;
    setLoading(true);
    const { error } = await supabase.from("iv_monitoring").insert([{
      iv_record_id: ivRecord.id, monitoring_date: new Date().toISOString(),
      ...form, dressing_appearance: form.dressing_appearance || null,
    }]);
    setLoading(false);
    if (error) { alert(error.message); return; }
    setForm({ infiltration_score:0, vip_score:0, dressing_appearance:"", dressing_replacement_done:false, flushing_pvc_done:false, infusion_system_replaced:false });
    fetch7Days();
  };

  if (!isOpen || !ivRecord) return null;

  const vipColor = (score: number) => score >= 3 ? "#dc2626" : score >= 2 ? "#d97706" : score >= 1 ? "#ca8a04" : "#16a34a";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(30,27,75,0.45)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:400, padding:20 }}>
      <div style={{
        background:"rgba(255,255,255,0.96)", backdropFilter:"blur(20px) saturate(1.6)",
        border:"1px solid rgba(221,214,254,0.8)", borderRadius:20,
        boxShadow:"0 20px 60px rgba(76,29,149,0.25)",
        width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto",
        fontFamily:"DM Sans,sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid rgba(221,214,254,0.5)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"rgba(255,255,255,0.97)", zIndex:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ClipboardList size={16} color="#6d28d9" />
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#1e1b4b", margin:0 }}>IV Monitoring</h2>
              <p style={{ fontSize:11, color:"#a78bfa", margin:0 }}>
                PVC: {ivRecord.pvc_size || "N/A"} · Site: {ivRecord.vein_site || "N/A"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(245,243,255,0.8)", border:"1px solid rgba(221,214,254,0.7)", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#7c3aed" }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding:"20px 24px" }}>
          {/* Form */}
          <div style={{ background:"rgba(245,243,255,0.6)", border:"1px solid rgba(221,214,254,0.6)", borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#5b21b6", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 14px" }}>New Entry</p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <Select label="Infiltration Score (0–4)" value={form.infiltration_score} options={[0,1,2,3,4]} onChange={v => setForm(p => ({...p, infiltration_score:v}))} />
              <Select label="VIP Score (0–5)" value={form.vip_score} options={[0,1,2,3,4,5]} onChange={v => setForm(p => ({...p, vip_score:v}))} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#5b21b6", marginBottom:5 }}>Dressing Appearance</label>
              <input placeholder="e.g. Dry, intact, soiled" value={form.dressing_appearance}
                onChange={e => setForm(p => ({...p, dressing_appearance:e.target.value}))}
                style={{ width:"100%", border:"1px solid rgba(221,214,254,0.8)", borderRadius:9, padding:"8px 12px", fontSize:13, background:"rgba(255,255,255,0.85)", color:"#1e1b4b", outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              <Checkbox label="Dressing replacement done" checked={form.dressing_replacement_done} onChange={v => setForm(p => ({...p, dressing_replacement_done:v}))} />
              <Checkbox label="Flushing of PVC done" checked={form.flushing_pvc_done} onChange={v => setForm(p => ({...p, flushing_pvc_done:v}))} />
              <Checkbox label="Infusion system replaced" checked={form.infusion_system_replaced} onChange={v => setForm(p => ({...p, infusion_system_replaced:v}))} />
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={handleSave} disabled={loading} style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"9px 20px", borderRadius:9, border:"none",
                background: loading ? "#c4b5fd" : "#4c1d95", color:"#fff",
                fontSize:13, fontWeight:600, cursor: loading ? "not-allowed" : "pointer",
                fontFamily:"DM Sans,sans-serif", transition:"background .15s",
              }}>
                <Save size={14} /> {loading ? "Saving…" : "Save Entry"}
              </button>
            </div>
          </div>

          {/* History */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"#5b21b6", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 12px" }}>Last 7 Days</p>
            {loading && history.length === 0 ? (
              <p style={{ fontSize:12, color:"#9ca3af" }}>Loading…</p>
            ) : history.length === 0 ? (
              <p style={{ fontSize:12, color:"#9ca3af" }}>No monitoring entries in the last 7 days.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {history.map(m => (
                  <div key={m.id} style={{ background:"rgba(255,255,255,0.8)", border:"1px solid rgba(221,214,254,0.6)", borderRadius:11, padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:"#1e1b4b" }}>
                        {new Date(m.monitoring_date).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                      </span>
                      <div style={{ display:"flex", gap:8 }}>
                        <span style={{ padding:"2px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:"#ede9fe", color: vipColor(m.vip_score), border:"1px solid #ddd6fe" }}>
                          VIP {m.vip_score}
                        </span>
                        <span style={{ padding:"2px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:"#f5f3ff", color:"#6d28d9", border:"1px solid #ede9fe" }}>
                          Inf {m.infiltration_score}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>
                      {m.dressing_appearance && <span>Dressing: {m.dressing_appearance} · </span>}
                      {m.dressing_replacement_done && <span>Dressing repl. · </span>}
                      {m.flushing_pvc_done && <span>Flushed · </span>}
                      {m.infusion_system_replaced && <span>System repl.</span>}
                      {!m.dressing_replacement_done && !m.flushing_pvc_done && !m.infusion_system_replaced && !m.dressing_appearance && "No interventions"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVMonitoring;