// src/components/FeedbackSummary.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Plus } from "lucide-react";

// Glass UI (same style)
const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background:"rgba(255,255,255,0.78)",
    backdropFilter:"blur(18px)",
    border:"1px solid rgba(221,214,254,0.65)",
    borderRadius:16,
    boxShadow:"0 2px 14px rgba(109,40,217,0.07)",
    ...style
  }}>
    {children}
  </div>
);

const FeedbackSummary: React.FC = () => {
  const { department, user } = useAuth();

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [total, setTotal] = useState("");
  const [positive, setPositive] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {

    // ✅ FIXED (removed user dependency)
    if (!department) {
      alert("Missing department");
      return;
    }

    if (!periodStart || !periodEnd || !total || !positive) {
      alert("Fill all fields");
      return;
    }

    if (Number(positive) > Number(total)) {
      alert("Invalid values");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("iv_feedback_summary").insert({
      department_id: department.id,
      period_start: periodStart,
      period_end: periodEnd,
      total_feedbacks: Number(total),
      feedback_4_5: Number(positive),

      // ✅ FIXED (user optional)
      created_by: user?.id || null
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Saved ✅");

    setPeriodStart("");
    setPeriodEnd("");
    setTotal("");
    setPositive("");
  };

  const percentage =
    total && positive
      ? ((Number(positive) / Number(total)) * 100).toFixed(1)
      : null;

  return (
    <div style={{ padding:"32px 40px", maxWidth:700, margin:"0 auto", fontFamily:"DM Sans" }}>

      <h1 style={{ fontSize:22, fontWeight:700, color:"#1e1b4b" }}>
        Feedback Summary
      </h1>

      <Glass style={{ padding:24, marginTop:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Dates */}
          <div style={{ display:"flex", gap:10 }}>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={input} />
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={input} />
          </div>

          {/* Inputs */}
          <input type="number" placeholder="Total Feedbacks" value={total} onChange={e => setTotal(e.target.value)} style={input} />
          <input type="number" placeholder="4 & 5 Star Feedbacks" value={positive} onChange={e => setPositive(e.target.value)} style={input} />

          {/* Percentage */}
          {percentage && (
            <span style={{ fontSize:12, color:"#16a34a" }}>
              Positive Rate: {percentage}%
            </span>
          )}

          {/* Button */}
          <button onClick={handleSubmit} style={btn} disabled={loading}>
            <Plus size={14} />
            {loading ? "Saving..." : "Add Summary"}
          </button>

        </div>
      </Glass>
    </div>
  );
};

const input: React.CSSProperties = {
  width:"100%",
  padding:"10px",
  borderRadius:10,
  border:"1px solid #ddd6fe",
  background:"#fafafa"
};

const btn: React.CSSProperties = {
  marginTop:10,
  padding:"10px",
  background:"#4c1d95",
  color:"#fff",
  border:"none",
  borderRadius:10,
  cursor:"pointer",
  display:"flex",
  justifyContent:"center",
  gap:6
};

export default FeedbackSummary;