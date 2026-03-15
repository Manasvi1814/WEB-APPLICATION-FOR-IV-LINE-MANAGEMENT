import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  AlertTriangle, 
  Clock, 
  Activity, 
  Bell,
  X,
  CheckCircle
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'phlebitis' | 'duration' | 'review' | 'infection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  patient_id: string;
  iv_line_id?: string;
  created_at: string;
  acknowledged: boolean;
}

const AlertsPanel: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('unacknowledged');

  useEffect(() => {
    generateAlerts();
  }, [user]);

  const generateAlerts = async () => {
    try {
      // Fetch IV lines for the department
      const { data: ivLines } = await supabase
        .from('iv_lines')
        .select(`
          *,
          patient:patients(patient_id, department_id)
        `)
        .eq('status', 'active')
        .in('patient.department_id', [user?.department_id]);

      const generatedAlerts: Alert[] = [];

      ivLines?.forEach((ivLine: any) => {
        const insertionDate = new Date(ivLine.insertion_date);
        const daysSinceInsertion = Math.floor(
          (new Date().getTime() - insertionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Phlebitis alerts
        if (ivLine.phlebitis_score >= 2) {
          generatedAlerts.push({
            id: `phlebitis-${ivLine.id}`,
            type: 'phlebitis',
            priority: ivLine.phlebitis_score >= 3 ? 'critical' : 'high',
            title: 'High Phlebitis Score',
            message: `Patient ${ivLine.patient.patient_id} has phlebitis score of ${ivLine.phlebitis_score}/4. Consider IV removal.`,
            patient_id: ivLine.patient.patient_id,
            iv_line_id: ivLine.id,
            created_at: new Date().toISOString(),
            acknowledged: false
          });
        }

        // Duration alerts
        if (daysSinceInsertion >= 3 && ivLine.iv_type === 'peripheral') {
          generatedAlerts.push({
            id: `duration-${ivLine.id}`,
            type: 'duration',
            priority: daysSinceInsertion >= 5 ? 'high' : 'medium',
            title: 'IV Line Duration Alert',
            message: `Peripheral IV for Patient ${ivLine.patient.patient_id} has been in place for ${daysSinceInsertion} days. Consider replacement.`,
            patient_id: ivLine.patient.patient_id,
            iv_line_id: ivLine.id,
            created_at: new Date().toISOString(),
            acknowledged: false
          });
        }

        // Review alerts for central lines
        if (daysSinceInsertion >= 7 && ivLine.iv_type === 'central') {
          generatedAlerts.push({
            id: `review-${ivLine.id}`,
            type: 'review',
            priority: 'medium',
            title: 'Central Line Review Required',
            message: `Central line for Patient ${ivLine.patient.patient_id} requires weekly review. Assess necessity and condition.`,
            patient_id: ivLine.patient.patient_id,
            iv_line_id: ivLine.id,
            created_at: new Date().toISOString(),
            acknowledged: false
          });
        }
      });

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error generating alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'phlebitis': return AlertTriangle;
      case 'duration': return Clock;
      case 'review': return Activity;
      case 'infection': return Bell;
      default: return AlertTriangle;
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => !alert.acknowledged);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-600" />
            Alerts & Notifications
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('unacknowledged')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'unacknowledged' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unacknowledged ({alerts.filter(a => !a.acknowledged).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({alerts.length})
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">
              {filter === 'all' ? 'No alerts found' : 'No unacknowledged alerts'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const Icon = getPriorityIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)} ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span>Patient: {alert.patient_id}</span>
                          <span>Priority: {alert.priority.toUpperCase()}</span>
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Acknowledge alert"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;