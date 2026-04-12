// src/components/PatientModal.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { X, UserPlus } from "lucide-react";

export interface Patient {
  id: string; patient_id: string; current_department_id: string;
  created_at: string; updated_at: string;
  admission_date?: string; status?: string;
  added_by_staff_id?: string; added_by_role?: string;
  added_from_department_id?: string; discharge_date?: string;
}

interface Props { isOpen: boolean; onClose: () => void; onSave: (p: Patient) => void; }

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} style={{ display:"block", fontSize:12, fontWeight:600, color:"#5b21b6", marginBottom:6 }}>{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{ width:"100%", border:"1px solid rgba(221,214,254,0.8)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#1e1b4b", background:"rgba(255,255,255,0.85)", outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box", ...props.style }} />
);

const PatientModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { department } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    if (!department) { setError("Department not found."); setLoading(false); return; }
    try {
      const { data: ex } = await supabase.from("patients").select("id").eq("patient_id", patientId).eq("current_department_id", department.id).maybeSingle();
      if (ex) { setError("Patient ID already exists in this department."); setLoading(false); return; }
      const { data, error: err } = await supabase.from("patients").insert([{
        patient_id: patientId, current_department_id: department.id,
        added_from_department_id: department.id,
        admission_date: admissionDate || new Date().toISOString(),
      }]).select("*").single();
      if (err) throw err;
      onSave(data as Patient);
      setPatientId(""); setAdmissionDate(""); onClose();
    } catch(e: any) { setError(e.message || "Failed to add patient"); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(30,27,75,0.45)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:20 }}>
      <div style={{
        background:"rgba(255,255,255,0.95)", backdropFilter:"blur(20px) saturate(1.6)",
        border:"1px solid rgba(221,214,254,0.8)", borderRadius:20,
        boxShadow:"0 20px 60px rgba(76,29,149,0.25)", width:"100%", maxWidth:440,
        fontFamily:"DM Sans,sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid rgba(221,214,254,0.5)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <UserPlus size={16} color="#6d28d9" />
            </div>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#1e1b4b", margin:0 }}>Add New Patient</h3>
              <p style={{ fontSize:11, color:"#a78bfa", margin:0 }}>{department?.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(245,243,255,0.8)", border:"1px solid rgba(221,214,254,0.7)", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#7c3aed" }}>
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding:"22px 24px" }}>
          <div style={{ marginBottom:18 }}>
            <Label htmlFor="pid">Patient ID *</Label>
            <Input id="pid" type="text" placeholder="e.g. P001, MRN123456" value={patientId} onChange={e => setPatientId(e.target.value)} required />
            <p style={{ fontSize:11, color:"#9ca3af", margin:"5px 0 0" }}>Must be unique within this department.</p>
          </div>

          <div style={{ marginBottom:22 }}>
            <Label htmlFor="adm">Admission Date *</Label>
            <Input id="adm" type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} required />
            <p style={{ fontSize:11, color:"#9ca3af", margin:"5px 0 0" }}>Used in patient-days calculation for reports.</p>
          </div>

          {error && (
            <div style={{ marginBottom:16, padding:"10px 14px", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:9, fontSize:12, color:"#9f1239" }}>
              {error}
            </div>
          )}

          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding:"9px 18px", borderRadius:9, border:"1px solid rgba(221,214,254,0.8)", background:"rgba(245,243,255,0.8)", color:"#6d28d9", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !patientId.trim() || !admissionDate} style={{ padding:"9px 22px", borderRadius:9, border:"none", background: loading || !patientId.trim() || !admissionDate ? "#c4b5fd" : "#4c1d95", color:"#fff", fontSize:13, fontWeight:600, cursor: loading || !patientId.trim() || !admissionDate ? "not-allowed" : "pointer", fontFamily:"DM Sans,sans-serif", transition:"background .15s" }}>
              {loading ? "Adding…" : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;