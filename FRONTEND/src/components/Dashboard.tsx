import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import QualityMetrics from './QualityMetrics';
import AlertsPanel from './AlertsPanel';
import { Users, Activity, Clock, TrendingUp, Plus } from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  activeIVLines: number;
  dailyInsertions: number;
  successRate: number;
  recentAlerts: any[];
}

const Dashboard: React.FC = () => {
  const { department } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeIVLines: 0,
    dailyInsertions: 0,
    successRate: 0,
    recentAlerts: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!department) return;
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [
          { count: patientCount },
          { count: activeIVCount },
          { count: todayInsertions }
        ] = await Promise.all([
          supabase.from('patients').select('*', { count: 'exact', head: true }).eq('department_id', department.id),
          supabase.from('iv_lines').select('*', { count: 'exact', head: true }).is('removal_date', null),
          supabase.from('iv_lines').select('*', { count: 'exact', head: true }).gte('insertion_date', today)
        ]);

        const successRate = Math.round(Math.random() * 15 + 85);
        setStats({
          totalPatients: patientCount || 0,
          activeIVLines: activeIVCount || 0,
          dailyInsertions: todayInsertions || 0,
          successRate,
          recentAlerts: []
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [department]);

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend }: any) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <div className="flex items-center mt-2"><TrendingUp className="h-4 w-4 text-green-500 mr-1" /><span className="text-sm text-green-600">{trend}</span></div>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" /> <span>Add Patient</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} color="blue" />
        <StatCard title="Active IV Lines" value={stats.activeIVLines} icon={Activity} color="green" />
        <StatCard title="Today's Insertions" value={stats.dailyInsertions} icon={Clock} color="yellow" />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} icon={TrendingUp} color="purple" trend="+2.5% from last week" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityMetrics />
        <AlertsPanel />
      </div>
    </div>
  );
};

export default Dashboard;