import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  User, 
  Calendar, 
  Filter,
  Search,
  Download,
  Eye,
  Activity
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  details: any;
  timestamp: string;
  ip_address?: string;
}

const AuditLog: React.FC = () => {
  const { user } = useAuth();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLog();
  }, [dateRange, user]);

  useEffect(() => {
    filterEntries();
  }, [searchTerm, actionFilter, auditEntries]);

  const fetchAuditLog = async () => {
    try {
      setIsLoading(true);
      
      // Generate sample audit log data since we don't have a real audit table
      const sampleAuditEntries: AuditEntry[] = [
        {
          id: '1',
          action: 'IV_INSERTED',
          entity_type: 'iv_line',
          entity_id: 'iv_001',
          user_id: user?.id || 'user1',
          user_name: user?.name || 'Sarah Johnson',
          details: {
            patient_id: 'P001',
            iv_type: 'peripheral',
            insertion_site: 'Right antecubital fossa',
            first_attempt: true
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100'
        },
        {
          id: '2',
          action: 'PATIENT_TRANSFERRED',
          entity_type: 'patient',
          entity_id: 'P002',
          user_id: user?.id || 'user1',
          user_name: user?.name || 'Dr. Michael Chen',
          details: {
            patient_id: 'P002',
            from_department: 'Emergency Department',
            to_department: 'ICU',
            reason: 'Requires intensive monitoring'
          },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.101'
        },
        {
          id: '3',
          action: 'IV_REMOVED',
          entity_type: 'iv_line',
          entity_id: 'iv_002',
          user_id: user?.id || 'user1',
          user_name: user?.name || 'Emily Rodriguez',
          details: {
            patient_id: 'P003',
            removal_reason: 'Phlebitis score 3',
            duration_hours: 72
          },
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.102'
        },
        {
          id: '4',
          action: 'STAFF_LOGIN',
          entity_type: 'authentication',
          entity_id: user?.id || 'user1',
          user_id: user?.id || 'user1',
          user_name: user?.name || 'Sarah Johnson',
          details: {
            login_method: 'staff_id',
            department: user?.department?.name || 'Medical Ward'
          },
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100'
        },
        {
          id: '5',
          action: 'PHLEBITIS_ASSESSMENT',
          entity_type: 'iv_line',
          entity_id: 'iv_003',
          user_id: user?.id || 'user1',
          user_name: user?.name || 'Sarah Johnson',
          details: {
            patient_id: 'P001',
            previous_score: 1,
            new_score: 2,
            symptoms: ['redness', 'swelling']
          },
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100'
        }
      ];

      setAuditEntries(sampleAuditEntries);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = auditEntries;

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(entry.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(entry => entry.action === actionFilter);
    }

    setFilteredEntries(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'IV_INSERTED':
      case 'IV_REMOVED':
        return Activity;
      case 'PATIENT_TRANSFERRED':
        return User;
      case 'STAFF_LOGIN':
        return User;
      case 'PHLEBITIS_ASSESSMENT':
        return Eye;
      default:
        return FileText;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'IV_INSERTED':
        return 'text-green-600 bg-green-50';
      case 'IV_REMOVED':
        return 'text-red-600 bg-red-50';
      case 'PATIENT_TRANSFERRED':
        return 'text-blue-600 bg-blue-50';
      case 'STAFF_LOGIN':
        return 'text-purple-600 bg-purple-50';
      case 'PHLEBITIS_ASSESSMENT':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportAuditLog = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Details', 'IP Address'].join(','),
      ...filteredEntries.map(entry => [
        new Date(entry.timestamp).toLocaleString(),
        entry.user_name,
        formatActionName(entry.action),
        entry.entity_type,
        JSON.stringify(entry.details).replace(/,/g, ';'),
        entry.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <button
          onClick={exportAuditLog}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search audit log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="IV_INSERTED">IV Inserted</option>
            <option value="IV_REMOVED">IV Removed</option>
            <option value="PATIENT_TRANSFERRED">Patient Transferred</option>
            <option value="STAFF_LOGIN">Staff Login</option>
            <option value="PHLEBITIS_ASSESSMENT">Phlebitis Assessment</option>
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Audit Entries */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Audit Entries ({filteredEntries.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit entries found</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const ActionIcon = getActionIcon(entry.action);
              return (
                <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getActionColor(entry.action)}`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {formatActionName(entry.action)}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {entry.user_name}
                        </span>
                        <span>Entity: {entry.entity_type}</span>
                        {entry.ip_address && (
                          <span>IP: {entry.ip_address}</span>
                        )}
                      </div>
                      
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;