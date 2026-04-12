// src/components/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import QualityMetrics from "./QualityMetrics";
import { Users, Activity, Clock, TrendingUp, ChevronRight } from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  activeIVLines: number;
  todayInsertions: number;
  successRate: number;
}

// ── Glass stat card ───────────────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string; value: string | number; icon: React.ElementType;
  accent: string; iconColor: string; href?: string; sub?: string;
}> = ({ title, value, icon: Icon, accent, iconColor, href, sub }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => href && navigate(href)}
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(22px) saturate(1.6)",
        WebkitBackdropFilter: "blur(22px) saturate(1.6)",
        border: "1px solid rgba(221,214,254,0.70)",
        borderRadius: 24,
        padding: "30px 32px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        cursor: href ? "pointer" : "default",
        transition: "transform .18s, box-shadow .18s, border-color .18s",
        boxShadow: "0 4px 20px rgba(109,40,217,0.10)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        if (href) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = "0 14px 40px rgba(109,40,217,0.18)";
          el.style.borderColor = "rgba(167,139,250,0.90)";
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 4px 20px rgba(109,40,217,0.10)";
        el.style.borderColor = "rgba(221,214,254,0.70)";
      }}
    >
      {/* BG blob */}
      <div style={{
        position: "absolute", top: -28, right: -28,
        width: 110, height: 110, borderRadius: "50%",
        backgroundColor: accent, opacity: 0.32,
      }} />
      <div style={{ position: "relative" }}>
        <p style={{
          fontSize: 12, fontWeight: 600, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px",
        }}>{title}</p>
        <p style={{
          fontSize: 38, fontWeight: 700, color: "#1e1b4b",
          fontFamily: "DM Serif Display, serif", lineHeight: 1, margin: 0,
        }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: "#a78bfa", marginTop: 10, fontWeight: 500 }}>{sub}</p>}
        {href && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            marginTop: 14, fontSize: 12, color: "#7c3aed", fontWeight: 600,
          }}>
            View details <ChevronRight size={12} />
          </div>
        )}
      </div>
      <div style={{
        width: 60, height: 60, borderRadius: 18,
        backgroundColor: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, border: `1.5px solid ${iconColor}30`,
        boxShadow: `0 4px 16px ${iconColor}18`,
      }}>
        <Icon size={26} color={iconColor} strokeWidth={2.2} />
      </div>
    </div>
  );
};

// ── Glass panel ───────────────────────────────────────────────────────────────
const GlassPanel: React.FC<{ title: string; sub?: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <div style={{
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(22px) saturate(1.6)",
    WebkitBackdropFilter: "blur(22px) saturate(1.6)",
    border: "1px solid rgba(221,214,254,0.70)",
    borderRadius: 24,
    padding: "28px 32px",
    boxShadow: "0 4px 20px rgba(109,40,217,0.10)",
  }}>
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontSize: 12, fontWeight: 700, color: "#5b21b6",
        textTransform: "uppercase", letterSpacing: "0.10em", margin: 0,
      }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: "#9ca3af", margin: "5px 0 0" }}>{sub}</p>}
    </div>
    {children}
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { department } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0, activeIVLines: 0, todayInsertions: 0, successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!department?.id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { count: pCount } = await supabase
          .from("patients").select("id", { count: "exact", head: true })
          .eq("current_department_id", department.id).is("discharge_date", null);

        const { count: ivCount } = await supabase
          .from("iv_records").select("id", { count: "exact", head: true })
          .eq("status", "active")
          .in("patient_id",
            (await supabase.from("patients").select("id").eq("current_department_id", department.id).is("discharge_date", null)).data?.map((p: any) => p.id) ?? []
          );

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from("iv_records").select("id", { count: "exact", head: true })
          .gte("insertion_date", todayStart.toISOString())
          .in("patient_id",
            (await supabase.from("patients").select("id").eq("current_department_id", department.id)).data?.map((p: any) => p.id) ?? []
          );

        const { data: ivData } = await supabase
          .from("iv_records").select("result,number_of_attempts")
          .in("patient_id",
            (await supabase.from("patients").select("id").eq("current_department_id", department.id)).data?.map((p: any) => p.id) ?? []
          );
        const total = ivData?.length ?? 0;
        const firstPrick = ivData?.filter((r: any) => r.result === "successful" && r.number_of_attempts === 1).length ?? 0;
        const rate = total > 0 ? Math.round((firstPrick / total) * 100) : 0;

        setStats({
          totalPatients: pCount ?? 0,
          activeIVLines: ivCount ?? 0,
          todayInsertions: todayCount ?? 0,
          successRate: rate,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [department?.id]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 420 }}>
      <div style={{
        width: 42, height: 42, borderRadius: "50%",
        border: "3px solid #ede9fe", borderTopColor: "#7c3aed",
        animation: "spin .75s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{
      padding: "40px 52px",
      maxWidth: 1440,
      margin: "0 auto",
      fontFamily: "DM Sans, sans-serif",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 40,
        gap: 24,
      }}>

        {/* Left: Logo + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Logo */}
          <div style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            overflow: "hidden",
            flexShrink: 0,
            border: "2.5px solid rgba(255,255,255,0.90)",
            boxShadow: "0 6px 28px rgba(109,40,217,0.20)",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 10,
          }}>
            <img
              src="/assests/mgm_logo.png"
              alt="MGM Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* Text */}
          <div>
            <p style={{
              fontSize: 12, fontWeight: 600, color: "#a78bfa",
              textTransform: "uppercase", letterSpacing: "0.10em", margin: "0 0 6px",
            }}>{today}</p>
            <h1 style={{
              fontSize: 32, fontWeight: 700, color: "#1e1b4b",
              margin: 0, lineHeight: 1.2,
            }}>
              {greeting},{" "}
              <span style={{ color: "#6d28d9" }}>{department?.name}</span>
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "8px 0 0" }}>
              Here's your department's IV activity at a glance.
            </p>
          </div>
        </div>

        {/* Right: Status pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 22px", borderRadius: 28,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(221,214,254,0.75)",
          boxShadow: "0 2px 12px rgba(109,40,217,0.10)",
          fontSize: 14, fontWeight: 600, color: "#5b21b6",
          whiteSpace: "nowrap",
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%",
            backgroundColor: "#7c3aed", display: "inline-block",
            boxShadow: "0 0 0 4px rgba(124,58,237,0.18)",
          }} />
          System Active
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 24,
        marginBottom: 30,
      }}>
        <StatCard
          title="Total Patients" value={stats.totalPatients}
          icon={Users} accent="#ede9fe" iconColor="#6d28d9"
          href="/patients"
        />
        <StatCard
          title="Active IV Lines" value={stats.activeIVLines}
          icon={Activity} accent="#f5f3ff" iconColor="#7c3aed"
          sub="Currently monitored"
        />
        <StatCard
          title="Today's Insertions" value={stats.todayInsertions}
          icon={Clock} accent="#ede9fe" iconColor="#5b21b6"
          sub="As of today"
        />
        <StatCard
          title="Success Rate" value={`${stats.successRate}%`}
          icon={TrendingUp} accent="#f5f3ff" iconColor="#6d28d9"
          sub="First prick success"
        />
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div style={{
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.50), transparent)",
        margin: "6px 0 30px",
      }} />

      {/* ── Lower panels ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
        <GlassPanel title="Quality Metrics" sub="Current period indicators">
          <QualityMetrics />
        </GlassPanel>
        
      </div>
    </div>
  );
};

export default Dashboard;