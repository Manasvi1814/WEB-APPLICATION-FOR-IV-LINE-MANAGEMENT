import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  Target, 
  Award, 
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface QualityMetrics {
  infectionRate: number;
  firstAttemptSuccess: number;
  averagePhlebitisScore: number;
  deviceUtilizationRatio: number;
  complianceScore: number;
  benchmarkComparison: {
    national: number;
    regional: number;
    hospital: number;
  };
}

const QualityMetrics: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<QualityMetrics>({
    infectionRate: 0,
    firstAttemptSuccess: 0,
    averagePhlebitisScore: 0,
    deviceUtilizationRatio: 0,
    complianceScore: 0,
    benchmarkComparison: {
      national: 85,
      regional: 88,
      hospital: 0
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateQualityMetrics();
  }, [selectedPeriod, user]);

  const calculateQualityMetrics = async () => {
    try {
      setIsLoading(true);
      
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch IV lines data
      const { data: ivLines } = await supabase
        .from('iv_lines')
        .select(`
          *,
          patient:patients!inner(department_id)
        `)
        .eq('patient.department_id', user?.department_id)
        .gte('insertion_date', startDate.toISOString());

      if (!ivLines || ivLines.length === 0) {
        setMetrics(prev => ({ ...prev, hospital: 0 }));
        return;
      }

      // Calculate first attempt success rate
      const successfulFirstAttempts = ivLines.filter(line => 
        line.cannula_count === 1 && line.time_taken_minutes <= 10
      ).length;
      const firstAttemptSuccess = (successfulFirstAttempts / ivLines.length) * 100;

      // Calculate average phlebitis score
      const totalPhlebitisScore = ivLines.reduce((sum, line) => sum + line.phlebitis_score, 0);
      const averagePhlebitisScore = totalPhlebitisScore / ivLines.length;

      // Calculate infection rate (simulated - would be based on actual infection data)
      const infectionsReported = ivLines.filter(line => 
        line.phlebitis_score >= 3 || line.notes?.toLowerCase().includes('infection')
      ).length;
      const totalDeviceDays = ivLines.reduce((sum, line) => {
        const insertionDate = new Date(line.insertion_date);
        const removalDate = line.removal_date ? new Date(line.removal_date) : new Date();
        const days = Math.ceil((removalDate.getTime() - insertionDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(1, days);
      }, 0);
      const infectionRate = (infectionsReported / totalDeviceDays) * 1000; // per 1000 device days

      // Calculate device utilization ratio
      const activeLines = ivLines.filter(line => line.status === 'active').length;
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .eq('department_id', user?.department_id)
        .eq('status', 'active');
      
      const deviceUtilizationRatio = patients ? (activeLines / patients.length) * 100 : 0;

      // Calculate compliance score (composite metric)
      const complianceFactors = [
        firstAttemptSuccess >= 85 ? 25 : (firstAttemptSuccess / 85) * 25,
        averagePhlebitisScore <= 1 ? 25 : Math.max(0, 25 - (averagePhlebitisScore - 1) * 10),
        infectionRate <= 2 ? 25 : Math.max(0, 25 - (infectionRate - 2) * 5),
        deviceUtilizationRatio <= 80 ? 25 : Math.max(0, 25 - (deviceUtilizationRatio - 80) * 2)
      ];
      const complianceScore = complianceFactors.reduce((sum, factor) => sum + factor, 0);

      setMetrics({
        infectionRate: Math.round(infectionRate * 10) / 10,
        firstAttemptSuccess: Math.round(firstAttemptSuccess * 10) / 10,
        averagePhlebitisScore: Math.round(averagePhlebitisScore * 10) / 10,
        deviceUtilizationRatio: Math.round(deviceUtilizationRatio * 10) / 10,
        complianceScore: Math.round(complianceScore * 10) / 10,
        benchmarkComparison: {
          national: 85,
          regional: 88,
          hospital: Math.round(firstAttemptSuccess * 10) / 10
        }
      });
    } catch (error) {
      console.error('Error calculating quality metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number, threshold: number, inverse = false) => {
    const isGood = inverse ? score <= threshold : score >= threshold;
    return isGood ? 'text-green-600' : score >= threshold * 0.8 ? 'text-yellow-600' : 'text-red-600';
  };

  const getScoreIcon = (score: number, threshold: number, inverse = false) => {
    const isGood = inverse ? score <= threshold : score >= threshold;
    return isGood ? CheckCircle : score >= threshold * 0.8 ? AlertTriangle : AlertTriangle;
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Quality Metrics Dashboard
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* First Attempt Success Rate */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-blue-600" />
                <span className={`text-2xl font-bold ${getScoreColor(metrics.firstAttemptSuccess, 85)}`}>
                  {metrics.firstAttemptSuccess}%
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">First Attempt Success</h4>
              <p className="text-sm text-gray-600">Target: ≥85%</p>
              <div className="mt-3 bg-white rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(metrics.firstAttemptSuccess, 100)}%` }}
                />
              </div>
            </div>

            {/* Infection Rate */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="h-8 w-8 text-green-600" />
                <span className={`text-2xl font-bold ${getScoreColor(metrics.infectionRate, 2, true)}`}>
                  {metrics.infectionRate}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Infection Rate</h4>
              <p className="text-sm text-gray-600">Per 1000 device days (Target: ≤2.0)</p>
            </div>

            {/* Average Phlebitis Score */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-purple-600" />
                <span className={`text-2xl font-bold ${getScoreColor(metrics.averagePhlebitisScore, 1, true)}`}>
                  {metrics.averagePhlebitisScore}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Avg Phlebitis Score</h4>
              <p className="text-sm text-gray-600">Scale 0-4 (Target: ≤1.0)</p>
            </div>

            {/* Device Utilization Ratio */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <span className={`text-2xl font-bold ${getScoreColor(metrics.deviceUtilizationRatio, 80, true)}`}>
                  {metrics.deviceUtilizationRatio}%
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Device Utilization</h4>
              <p className="text-sm text-gray-600">IV lines per patient (Target: ≤80%)</p>
            </div>

            {/* Overall Compliance Score */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="h-8 w-8 text-indigo-600" />
                <span className={`text-2xl font-bold ${getScoreColor(metrics.complianceScore, 80)}`}>
                  {metrics.complianceScore}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Compliance Score</h4>
              <p className="text-sm text-gray-600">Composite metric (Target: ≥80)</p>
            </div>

            {/* Benchmark Comparison */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Benchmark Comparison</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">National Average</span>
                  <span className="font-medium">{metrics.benchmarkComparison.national}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Regional Average</span>
                  <span className="font-medium">{metrics.benchmarkComparison.regional}%</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Your Department</span>
                  <span className={`font-bold ${getScoreColor(metrics.benchmarkComparison.hospital, metrics.benchmarkComparison.national)}`}>
                    {metrics.benchmarkComparison.hospital}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Improvement Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quality Improvement Recommendations</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Priority Actions</h4>
              {metrics.firstAttemptSuccess < 85 && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Improve First Attempt Success</p>
                    <p className="text-xs text-red-600">Consider additional staff training on IV insertion techniques</p>
                  </div>
                </div>
              )}
              {metrics.averagePhlebitisScore > 1 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Reduce Phlebitis Incidents</p>
                    <p className="text-xs text-yellow-600">Review IV site assessment protocols and frequency</p>
                  </div>
                </div>
              )}
              {metrics.infectionRate > 2 && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Address Infection Rate</p>
                    <p className="text-xs text-red-600">Review sterile technique and hand hygiene compliance</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Best Practices</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Daily IV site assessment and documentation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Replace peripheral IVs every 72-96 hours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Use ultrasound guidance for difficult access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Maintain sterile technique during insertion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityMetrics;