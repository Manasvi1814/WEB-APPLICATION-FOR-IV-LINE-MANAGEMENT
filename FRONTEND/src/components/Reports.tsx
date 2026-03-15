import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { exportToPDF, exportToExcel, ExportData } from './ExportUtils';
import { 
  Calendar,
  Download,
  FileText,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ReportData {
  totalPatients: number;
  activeIVLines: number;
  dailyInsertions: number;
  successRate: number;
  totalDeviceDays: number;
  averagePhlebitisScore: number;
  efficiencyScore: number;
  infectionRate: number;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    totalPatients: 0,
    activeIVLines: 0,
    dailyInsertions: 0,
    successRate: 0,
    totalDeviceDays: 0,
    averagePhlebitisScore: 0,
    efficiencyScore: 0,
    infectionRate: 0
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [patients, setPatients] = useState([]);
  const [ivLines, setIvLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, user]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select(`
          *,
          department:departments(name)
        `)
        .eq('department_id', user?.department_id)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59');

      // Fetch IV lines
      const { data: ivLinesData } = await supabase
        .from('iv_lines')
        .select(`
          *,
          patient:patients!inner(department_id, patient_id)
        `)
        .eq('patient.department_id', user?.department_id)
        .gte('insertion_date', dateRange.start)
        .lte('insertion_date', dateRange.end + 'T23:59:59');

      setPatients(patientsData || []);
      setIvLines(ivLinesData || []);

      // Calculate metrics
      const totalPatients = patientsData?.length || 0;
      const activeIVLines = ivLinesData?.filter(line => line.status === 'active').length || 0;
      const dailyInsertions = ivLinesData?.length || 0;
      
      // Calculate success rate (first attempt success)
      const successfulAttempts = ivLinesData?.filter(line => line.cannula_count === 1).length || 0;
      const successRate = dailyInsertions > 0 ? (successfulAttempts / dailyInsertions) * 100 : 0;

      // Calculate device days
      let totalDeviceDays = 0;
      ivLinesData?.forEach(line => {
        const insertionDate = new Date(line.insertion_date);
        const removalDate = line.removal_date ? new Date(line.removal_date) : new Date();
        const days = Math.ceil((removalDate.getTime() - insertionDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDeviceDays += Math.max(1, days);
      });

      // Calculate average phlebitis score
      const totalPhlebitisScore = ivLinesData?.reduce((sum, line) => sum + (line.phlebitis_score || 0), 0) || 0;
      const averagePhlebitisScore = dailyInsertions > 0 ? totalPhlebitisScore / dailyInsertions : 0;

      // Calculate infection rate (per 1000 device days)
      const infections = ivLinesData?.filter(line => line.phlebitis_score >= 3).length || 0;
      const infectionRate = totalDeviceDays > 0 ? (infections / totalDeviceDays) * 1000 : 0;

      // Calculate efficiency score
      const avgTimePerInsertion = ivLinesData?.reduce((sum, line) => sum + (line.time_taken_minutes || 0), 0) / (dailyInsertions || 1);
      const efficiencyScore = Math.max(0, 100 - (avgTimePerInsertion - 5) * 2);

      setReportData({
        totalPatients,
        activeIVLines,
        dailyInsertions,
        successRate: Math.round(successRate * 10) / 10,
        totalDeviceDays,
        averagePhlebitisScore: Math.round(averagePhlebitisScore * 10) / 10,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
        infectionRate: Math.round(infectionRate * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    const exportData: ExportData = {
      patients: patients.map((patient: any) => ({
        patient_id: patient.patient_id,
        department: patient.department?.name || 'N/A',
        status: patient.status,
        admission_date: patient.created_at
      })),
      ivLines: ivLines.map((line: any) => ({
        patient_id: line.patient?.patient_id || 'N/A',
        iv_type: line.iv_type,
        insertion_site: line.insertion_site,
        insertion_date: line.insertion_date,
        removal_date: line.removal_date,
        phlebitis_score: line.phlebitis_score,
        status: line.status,
        time_taken: line.time_taken_minutes,
        cannulas_used: line.cannula_count
      })),
      reportData,
      dateRange
    };

    try {
      if (format === 'pdf') {
        await exportToPDF(exportData, `IV_Management_Report_${dateRange.start}_to_${dateRange.end}`);
      } else {
        await exportToExcel(exportData, `IV_Management_Report_${dateRange.start}_to_${dateRange.end}`);
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      alert(`Failed to export to ${format.toUpperCase()}. Please try again.`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Department: {user?.department?.name}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={fetchReportData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{reportData.totalPatients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active IV Lines</p>
              <p className="text-3xl font-bold text-green-600">{reportData.activeIVLines}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-purple-600">{reportData.successRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Device Days</p>
              <p className="text-3xl font-bold text-orange-600">{reportData.totalDeviceDays}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Quality Indicators */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Quality Indicators
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {reportData.averagePhlebitisScore <= 1 ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{reportData.averagePhlebitisScore}</p>
              <p className="text-sm text-gray-600">Average Phlebitis Score</p>
              <p className="text-xs text-gray-500 mt-1">Target: ≤ 1.0</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {reportData.infectionRate <= 2 ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{reportData.infectionRate}</p>
              <p className="text-sm text-gray-600">Infection Rate</p>
              <p className="text-xs text-gray-500 mt-1">Per 1000 device days (Target: ≤ 2.0)</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {reportData.efficiencyScore >= 80 ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{reportData.efficiencyScore}</p>
              <p className="text-sm text-gray-600">Efficiency Score</p>
              <p className="text-xs text-gray-500 mt-1">Target: ≥ 80</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Patients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.slice(0, 5).map((patient: any) => (
                  <tr key={patient.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {patient.patient_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent IV Lines */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent IV Lines</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ivLines.slice(0, 5).map((line: any) => (
                  <tr key={line.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {line.patient?.patient_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {line.iv_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        line.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {line.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;