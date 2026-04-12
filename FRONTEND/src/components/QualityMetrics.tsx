// src/components/QualityMetrics.tsx
import React, { useState, useEffect } from "react";
import { Target, AlertTriangle, Award, TrendingUp, CheckCircle, BarChart3 } from "lucide-react";

interface QualityMetrics {
  infectionRate: number; firstAttemptSuccess: number; averagePhlebitisScore: number;
  deviceUtilizationRatio: number; complianceScore: number;
  benchmarkComparison: { national: number; regional: number; hospital: number };
}

const MetricTile: React.FC<{ icon: React.ElementType; label: string; value: string; accent: string; iconColor: string }> =
  ({ icon: Icon, label, value, accent, iconColor }) => (
    <div style={{ background:accent, border:"1px solid rgba(221,214,254,0.5)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:9, background:"rgba(255,255,255,0.7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </div>
      <div>
        <p style={{ fontSize:10, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 3px" }}>{label}</p>
        <p style={{ fontSize:20, fontWeight:700, color:"#1e1b4b", fontFamily:"DM Serif Display,serif", margin:0, lineHeight:1 }}>{value}</p>
      </div>
    </div>
  );

const QualityMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<QualityMetrics>({
    infectionRate:0, firstAttemptSuccess:0, averagePhlebitisScore:0,
    deviceUtilizationRatio:0, complianceScore:0,
    benchmarkComparison:{ national:85, regional:88, hospital:0 }
  });
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMetrics({ infectionRate:1.2, firstAttemptSuccess:91.5, averagePhlebitisScore:0.6, deviceUtilizationRatio:72.3, complianceScore:88.4, benchmarkComparison:{ national:85, regional:88, hospital:91.5 } });
      setLoading(false);
    }, 400);
  }, [period]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:120 }}>
      <div style={{ width:28,height:28,borderRadius:"50%",border:"2px solid #ede9fe",borderTopColor:"#7c3aed",animation:"spin .75s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:"DM Sans,sans-serif" }}>
      {/* Period selector */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <BarChart3 size={14} color="#7c3aed" />
          <span style={{ fontSize:12, fontWeight:600, color:"#5b21b6" }}>Performance</span>
        </div>
        <select
          value={period} onChange={e => setPeriod(e.target.value)}
          style={{ border:"1px solid rgba(221,214,254,0.8)", borderRadius:8, padding:"5px 10px", fontSize:11, background:"rgba(255,255,255,0.8)", color:"#374151", outline:"none", fontFamily:"DM Sans,sans-serif", cursor:"pointer" }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Metric tiles */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        <MetricTile icon={Target}       label="First Attempt Success" value={`${metrics.firstAttemptSuccess}%`} accent="#f5f3ff" iconColor="#6d28d9" />
        <MetricTile icon={AlertTriangle} label="Infection Rate"         value={`${metrics.infectionRate}`}       accent="#faf5ff" iconColor="#7c3aed" />
        <MetricTile icon={Award}         label="Avg Phlebitis Score"    value={`${metrics.averagePhlebitisScore}`} accent="#f5f3ff" iconColor="#5b21b6" />
        <MetricTile icon={TrendingUp}    label="Device Utilisation"     value={`${metrics.deviceUtilizationRatio}%`} accent="#faf5ff" iconColor="#6d28d9" />
      </div>
      <MetricTile icon={CheckCircle} label="Compliance Score" value={`${metrics.complianceScore}`} accent="#f0fdf4" iconColor="#16a34a" />

      {/* Benchmark */}
      <div style={{ marginTop:14, background:"rgba(245,243,255,0.7)", border:"1px solid rgba(221,214,254,0.6)", borderRadius:10, padding:"12px 14px" }}>
        <p style={{ fontSize:10, fontWeight:700, color:"#7c3aed", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 8px" }}>Benchmark</p>
        <div style={{ display:"flex", gap:0 }}>
          {[["National",metrics.benchmarkComparison.national],["Regional",metrics.benchmarkComparison.regional],["This Dept",metrics.benchmarkComparison.hospital]].map(([label,val],i,arr) => (
            <div key={i as number} style={{ flex:1, paddingLeft: i===0?0:12, paddingRight: i===arr.length-1?0:12, borderRight: i<arr.length-1?"1px solid rgba(221,214,254,0.7)":"none" }}>
              <p style={{ fontSize:10, color:"#9ca3af", margin:"0 0 2px" }}>{label as string}</p>
              <p style={{ fontSize:15, fontWeight:700, color: i===2 ? "#5b21b6" : "#374151", margin:0, fontFamily:"DM Serif Display,serif" }}>{val as number}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QualityMetrics;