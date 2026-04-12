// src/components/PatientManagement.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Plus, Search, Activity, CalendarCheck, UserX, Syringe } from "lucide-react";
import PatientModal, { Patient } from "./PatientModal";
import IVLineModal from "./IVLineModal";


interface IVRecord {
  id: string; patient_id: string; status?: string;
  pvc_size?: string; vein_site?: string; insertion_date?: string;
}


// ── Reusable glass card shell ──────────────────────────────────────────────
const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background:"rgba(255,255,255,0.78)", backdropFilter:"blur(18px) saturate(1.5)",
    WebkitBackdropFilter:"blur(18px) saturate(1.5)",
    border:"1px solid rgba(221,214,254,0.65)", borderRadius:16,
    boxShadow:"0 2px 14px rgba(109,40,217,0.07)", ...style
  }}>{children}</div>
);


const PatientManagement: React.FC = () => {
  const { department } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [ivRecords, setIVRecords] = useState<Record<string, IVRecord[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showIVLineModal, setShowIVLineModal] = useState(false);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);
  const [dischargeDates, setDischargeDates] = useState<Record<string, string>>({});


  const fetchData = async () => {
    if (!department) return;
    setIsLoading(true);
    try {
      const { data: pData, error: pErr } = await supabase
        .from("patients")
        .select("id,patient_id,current_department_id,created_at,updated_at,admission_date,discharge_date")
        .eq("current_department_id", department.id)
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;


      const list = (pData as Patient[]) || [];
      setPatients(list);


      if (list.length > 0) {
        const ids = list.map(p => p.id);
        const { data: ivData, error: ivErr } = await supabase
          .from("iv_records").select("id,patient_id,status,pvc_size,vein_site,insertion_date")
          .in("patient_id", ids).eq("status", "active");
        if (ivErr) throw ivErr;
        const byPt: Record<string, IVRecord[]> = {};
        ids.forEach(id => { byPt[id] = (ivData as IVRecord[])?.filter(r => r.patient_id === id) || []; });
        setIVRecords(byPt);
      } else { setIVRecords({}); }
    } catch(e) { console.error(e); setPatients([]); setIVRecords({}); }
    finally { setIsLoading(false); }
  };


  useEffect(() => { fetchData(); }, [department]);


  const filtered = searchTerm.trim()
    ? patients.filter(p => p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()))
    : patients;


  const handleDischarge = async (patientId: string) => {
    const date = dischargeDates[patientId];
    if (!date) { alert("Please select a discharge date first."); return; }
    if (!window.confirm("Mark this patient as discharged?")) return;
    const { error } = await supabase.from("patients").update({ discharge_date: date }).eq("id", patientId);
    if (error) { alert(error.message); return; }
    fetchData();
  };


  if (isLoading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:320, gap:14, fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ width:36,height:36,borderRadius:"50%",border:"3px solid #ede9fe",borderTopColor:"#7c3aed",animation:"spin .75s linear infinite" }} />
      <p style={{ color:"#9ca3af", fontSize:13 }}>Loading patients…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );


  return (
    <div style={{ padding:"32px 40px", maxWidth:1200, margin:"0 auto", fontFamily:"DM Sans,sans-serif" }}>


      {/* Page header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>
          <div style={{ background:"rgba(255,255,255,0.85)", backdropFilter:"blur(10px)", border:"1px solid rgba(221,214,254,0.7)", borderRadius:14, padding:"8px 10px" }}>
            <img src="/assests/mgm_logo.png" alt="MGM" style={{ height:48, objectFit:"contain", display:"block" }} />
          </div>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, color:"#1e1b4b", margin:0 }}>Patient Management</h1>
            <p style={{ fontSize:12, color:"#a78bfa", margin:"4px 0 0" }}>{department?.name} · {filtered.length} patient{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={() => setShowPatientModal(true)}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:11, background:"#4c1d95", color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(76,29,149,0.3)", transition:"background .15s" }}
          onMouseEnter={e => (e.currentTarget.style.background="#3b0764")}
          onMouseLeave={e => (e.currentTarget.style.background="#4c1d95")}
        >
          <Plus size={16} /> Add Patient
        </button>
      </div>


      {/* Search */}
      <Glass style={{ padding:"16px 20px", marginBottom:20 }}>
        <div style={{ position:"relative" }}>
          <Search size={16} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#a78bfa" }} />
          <input
            type="text" placeholder="Search by Patient ID…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width:"100%", paddingLeft:40, paddingRight:16, paddingTop:10, paddingBottom:10, border:"1px solid rgba(221,214,254,0.8)", borderRadius:10, background:"rgba(255,255,255,0.7)", fontSize:13, color:"#1e1b4b", outline:"none", fontFamily:"DM Sans,sans-serif" }}
          />
        </div>
      </Glass>


      {/* Patient list */}
      <Glass>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(221,214,254,0.5)" }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:"#5b21b6", textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>
            Patients ({filtered.length})
          </h3>
        </div>


        {filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:"center", color:"#9ca3af", fontSize:13 }}>
            No patients found.
          </div>
        ) : (
          <div>
            {filtered.map((patient, idx) => {
              const ivs = ivRecords[patient.id] || [];
              const isDischarged = !!patient.discharge_date;
              return (
                <div
                  key={patient.id}
                  style={{
                    padding:"20px 24px",
                    borderBottom: idx < filtered.length-1 ? "1px solid rgba(237,233,254,0.6)" : "none",
                    transition:"background .12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background="rgba(245,243,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                >
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:20 }}>


                    {/* Left info */}
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                        <h4 style={{ fontSize:15, fontWeight:700, color:"#1e1b4b", margin:0 }}>
                          {patient.patient_id}
                        </h4>
                        <span style={{
                          padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                          background: isDischarged ? "#fef3c7" : "#ede9fe",
                          color: isDischarged ? "#92400e" : "#5b21b6",
                          border: isDischarged ? "1px solid #fde68a" : "1px solid #ddd6fe",
                        }}>
                          {isDischarged ? "Discharged" : "Admitted"}
                        </span>
                      </div>


                      <div style={{ display:"flex", gap:20, fontSize:12, color:"#9ca3af", marginBottom:8 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <CalendarCheck size={12} color="#a78bfa" />
                          Admitted: {patient.admission_date ? new Date(patient.admission_date).toLocaleDateString("en-IN") : "N/A"}
                        </span>
                        {isDischarged && patient.discharge_date && (
                          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <UserX size={12} color="#f59e0b" />
                            Discharged: {new Date(patient.discharge_date).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>


                      {ivs.length > 0 ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                          {ivs.map(iv => (
                            <div key={iv.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600, background:"#dcfce7", color:"#15803d", border:"1px solid #bbf7d0" }}>
                                IV Active
                              </span>
                              <span style={{ fontSize:12, color:"#374151" }}>
                                <Syringe size={11} style={{ display:"inline", marginRight:4, color:"#7c3aed" }} />
                                {iv.pvc_size || "N/A"} at {iv.vein_site || "N/A"}
                              </span>
                              <span style={{ fontSize:11, color:"#9ca3af" }}>
                                Since {iv.insertion_date ? new Date(iv.insertion_date).toLocaleDateString("en-IN") : "N/A"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600, background:"#f5f3ff", color:"#7c3aed", border:"1px solid #ede9fe" }}>
                          No Active IV
                        </span>
                      )}
                    </div>


                    {/* Right action panel */}
                    <div style={{
                      width:200, display:"flex", flexDirection:"column", gap:8,
                      background:"rgba(250,248,255,0.9)", border:"1px solid rgba(221,214,254,0.7)",
                      borderRadius:12, padding:"12px 14px", flexShrink:0,
                    }}>
                      <button
                        onClick={() => { setModalPatient(patient); setShowIVLineModal(true); }}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px 0", borderRadius:9, background:"#4c1d95", color:"#fff", border:"none", fontSize:12, fontWeight:600, cursor:"pointer", transition:"background .15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background="#3b0764")}
                        onMouseLeave={e => (e.currentTarget.style.background="#4c1d95")}
                      >
                        <Activity size={13} />
                        {ivs.length > 0 ? "Manage IV" : "Insert IV"}
                      </button>


                      {!isDischarged && (
                        <>
                          <input
                            type="date"
                            value={dischargeDates[patient.id] || ""}
                            onChange={e => setDischargeDates(p => ({ ...p, [patient.id]: e.target.value }))}
                            style={{ border:"1px solid rgba(221,214,254,0.8)", borderRadius:8, padding:"7px 10px", fontSize:11, background:"rgba(255,255,255,0.9)", color:"#374151", outline:"none", width:"100%", fontFamily:"DM Sans,sans-serif" }}
                          />
                          <button
                            onClick={() => handleDischarge(patient.id)}
                            style={{ padding:"8px 0", borderRadius:9, background:"#dc2626", color:"#fff", border:"none", fontSize:12, fontWeight:600, cursor:"pointer", transition:"background .15s" }}
                            onMouseEnter={e => (e.currentTarget.style.background="#b91c1c")}
                            onMouseLeave={e => (e.currentTarget.style.background="#dc2626")}
                          >
                            Set Discharge
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Glass>


      {showPatientModal && (
        <PatientModal isOpen={showPatientModal} onClose={() => setShowPatientModal(false)}
          onSave={p => { setPatients([p, ...patients]); setModalPatient(p); setShowIVLineModal(true); setShowPatientModal(false); }} />
      )}
      {showIVLineModal && modalPatient && (
        <IVLineModal isOpen={showIVLineModal} onClose={() => { setShowIVLineModal(false); setModalPatient(null); }} patient={modalPatient} onSave={fetchData} />
      )}
    </div>
  );
};


export default PatientManagement;