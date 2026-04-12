// src/components/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, Eye, EyeOff } from "lucide-react";

interface Department { id: string; name: string; password: string; }

const LoginPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const navigate = useNavigate();
  const { setDepartment } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoadingDepts(true);
      const { data, error } = await supabase.from("departments").select("id,name,password").order("name");
      if (!error && data) { setDepartments(data); if (data.length > 0) setSelectedId(data[0].id); }
      setLoadingDepts(false);
    };
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    const dept = departments.find(d => d.id === selectedId);
    if (!dept) { setError("Please select a department."); setSubmitting(false); return; }
    if (dept.password !== password) { setError("Incorrect password for this department."); setSubmitting(false); return; }
    setDepartment({ id: dept.id, name: dept.name });
    navigate("/dashboard");
  };

  const pageStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundImage: "url('/assests/mgm_hospital_bg.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "DM Sans, sans-serif",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(20,5,50,0.45)",
    backdropFilter: "blur(2px)",
  };

  if (loadingDepts) return (
    <div style={pageStyle}>
      <div style={overlayStyle} />
      <div style={{
        position: "relative", zIndex: 1,
        background: "rgba(20,5,50,0.35)",
        backdropFilter: "blur(20px)",
        borderRadius: 24, padding: "40px 48px",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 16,
        border: "1px solid rgba(255,255,255,0.15)",
      }}>
        <img src="/assests/mgm_logo.png" alt="MGM" style={{ height: 64, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} />
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(196,181,253,0.4)", borderTopColor: "#a78bfa", animation: "spin .8s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>Loading departments…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      {/* Dark overlay */}
      <div style={overlayStyle} />

      {/* Login card */}
      <div style={{
        position: "relative",
        zIndex: 1,
        background: "rgba(255,255,255,0.13)",
        backdropFilter: "blur(24px) saturate(1.8)",
        WebkitBackdropFilter: "blur(24px) saturate(1.8)",
        border: "1px solid rgba(255,255,255,0.24)",
        borderRadius: 28,
        padding: "44px 44px 40px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 32px 80px rgba(76,29,149,0.36), 0 0 0 1px rgba(255,255,255,0.08) inset",
      }}>

        {/* Logo + branding */}
        <div style={{ textAlign: "left", marginBottom: 36 }}>
          {/* Logo + badge: same row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 20,
          }}>
            {/* Logo box */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#ffffff",
              border: "2px solid rgba(255,255,255,0.60)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              padding: 8,
              flexShrink: 0,
            }}>
              <img
                src="/assests/mgm_logo.png"
                alt="MGM"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>

            {/* Badge to the right */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 20,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.30)",
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.95)", letterSpacing: "0.07em" }}>
                Hospital Login
              </span>
            </div>
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 700, color: "#fff",
            margin: "0 0 8px", lineHeight: 1.2,
            fontFamily: "DM Serif Display, serif",
          }}>
            IV Line Management
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", margin: "10px 0 0" }}>
            Department authentication · MGM Hospital Vashi
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Department select */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>
              Department
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                required
                style={{
                  width: "100%", appearance: "none",
                  border: "1px solid rgba(255,255,255,0.28)",
                  borderRadius: 14, padding: "13px 44px 13px 16px",
                  fontSize: 14, background: "rgba(255,255,255,0.93)",
                  color: "#1e1b4b", outline: "none",
                  fontFamily: "DM Sans, sans-serif",
                  cursor: "pointer", fontWeight: 500,
                  boxSizing: "border-box",
                }}
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                width: 28, height: 28, borderRadius: 8, background: "#ede9fe",
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>
              Department Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter department password"
                required
                style={{
                  width: "100%", border: "1px solid rgba(255,255,255,0.28)",
                  borderRadius: 14, padding: "13px 44px 13px 16px",
                  fontSize: 14, background: "rgba(255,255,255,0.93)",
                  color: "#1e1b4b", outline: "none",
                  fontFamily: "DM Sans, sans-serif",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#7c3aed", lineHeight: 0, padding: 2,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 18, padding: "11px 16px",
              background: "rgba(254,226,226,0.92)",
              border: "1px solid rgba(252,165,165,0.6)",
              borderRadius: 12, fontSize: 12, color: "#991b1b",
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              padding: "14px 0", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.22)",
              background: submitting ? "rgba(76,29,149,0.5)" : "#4c1d95",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "DM Sans, sans-serif",
              letterSpacing: "0.02em",
              transition: "background .15s, transform .12s",
              boxShadow: "0 4px 20px rgba(76,29,149,0.40)",
            }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = "#3b0764"; }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = "#4c1d95"; }}
          >
            <LogIn size={17} />
            {submitting ? "Logging in…" : "Login"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 20, lineHeight: 1.6 }}>
            Secure departmental access · IV Line Management System
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;