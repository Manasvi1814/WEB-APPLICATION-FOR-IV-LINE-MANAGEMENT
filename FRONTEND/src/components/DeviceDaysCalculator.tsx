import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, TrendingUp, Activity, Clock } from 'lucide-react';

interface DeviceDaysData {
  totalDeviceDays: number;
  averageDeviceDays: number;
  activeLines: number;
  monthlyTrend: number;
}

const DeviceDaysCalculator: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DeviceDaysData>({
    totalDeviceDays: 0,
    averageDeviceDays: 0,
    activeLines: 0,
    monthlyTrend: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateDeviceDays();
  }, [selectedMonth, user]);

  const calculateDeviceDays = async () => {
    try {
      setIsLoading(true);
      
      const startDate = new Date(selectedMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      // Fetch IV lines for the selected month
      const { data: ivLines } = await supabase
        .from('iv_lines')
        .select(`
          *,
          patient:patients!inner(department_id)
        `)
        .eq('patient.department_id', user?.department_id)
        .gte('insertion_date', startDate.toISOString())
        .lte('insertion_date', endDate.toISOString());

      let totalDeviceDays = 0;
      let activeLines = 0;

      ivLines?.forEach(line => {
        const insertionDate = new Date(line.insertion_date);
        const removalDate = line.removal_date ? new Date(line.removal_date) : new Date();
        
        // Calculate days within the selected month
        const monthStart = Math.max(insertionDate.getTime(), startDate.getTime());
        const monthEnd = Math.min(removalDate.getTime(), endDate.getTime());
        
        if (monthStart <= monthEnd) {
          const days = Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;
          totalDeviceDays += days;
        }

        if (!line.removal_date) {
          activeLines++;
        }
      });

      const averageDeviceDays = ivLines?.length ? totalDeviceDays / ivLines.length : 0;

      // Calculate previous month for trend
      const prevMonth = new Date(startDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);

      const { data: prevIvLines } = await supabase
        .from('iv_lines')
        .select(`
          *,
          patient:patients!inner(department_id)
        `)
        .eq('patient.department_id', user?.department_id)
        .gte('insertion_date', prevMonthStart.toISOString())
        .lte('insertion_date', prevMonthEnd.toISOString());

      let prevTotalDeviceDays = 0;
      prevIvLines?.forEach(line => {
        const insertionDate = new Date(line.insertion_date);
        const removalDate = line.removal_date ? new Date(line.removal_date) : new Date();
        
        const monthStart = Math.max(insertionDate.getTime(), prevMonthStart.getTime());
        const monthEnd = Math.min(removalDate.getTime(), prevMonthEnd.getTime());
        
        if (monthStart <= monthEnd) {
          const days = Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;
          prevTotalDeviceDays += days;
        }
      });

      const monthlyTrend = prevTotalDeviceDays ? 
        ((totalDeviceDays - prevTotalDeviceDays) / prevTotalDeviceDays) * 100 : 0;

      setData({
        totalDeviceDays,
        averageDeviceDays: Math.round(averageDeviceDays * 10) / 10,
        activeLines,
        monthlyTrend: Math.round(monthlyTrend * 10) / 10
      });
    } catch (error) {
      console.error('Error calculating device days:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Device Days Analysis
          </h3>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{data.totalDeviceDays}</p>
            <p className="text-sm text-blue-700">Total Device Days</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{data.averageDeviceDays}</p>
            <p className="text-sm text-green-700">Average Days per Line</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{data.activeLines}</p>
            <p className="text-sm text-purple-700">Currently Active</p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${
              data.monthlyTrend >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {data.monthlyTrend >= 0 ? '+' : ''}{data.monthlyTrend}%
            </p>
            <p className="text-sm text-yellow-700">Monthly Trend</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Device Days Calculation</h4>
          <p className="text-sm text-gray-600 mb-2">
            Device days represent the total number of days that IV lines were in place during the selected period.
            This metric is crucial for:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• Infection rate calculations (infections per 1000 device days)</li>
            <li>• Quality improvement initiatives</li>
            <li>• Benchmarking against national standards</li>
            <li>• Resource planning and utilization analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeviceDaysCalculator;