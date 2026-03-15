import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Users, Plus, CreditCard as Edit3, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  staff_id: string;
  staff_name: string;
  shift_type: 'day' | 'night' | 'evening';
  start_time: string;
  end_time: string;
  date: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'absent';
  notes?: string;
}

const StaffSchedule: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState([]);

  const [scheduleForm, setScheduleForm] = useState({
    staff_id: '',
    shift_type: 'day',
    start_time: '07:00',
    end_time: '19:00',
    notes: ''
  });

  useEffect(() => {
    fetchSchedules();
    fetchStaff();
  }, [selectedDate, user]);

  const fetchSchedules = async () => {
    try {
      // In a real implementation, this would fetch from a schedules table
      // For demo purposes, we'll generate sample schedule data
      const sampleSchedules: ScheduleEntry[] = [
        {
          id: '1',
          staff_id: 'N001',
          staff_name: 'Riya Sharma',
          shift_type: 'day',
          start_time: '07:00',
          end_time: '19:00',
          date: selectedDate,
          status: 'confirmed',
          notes: 'Primary IV specialist'
        },
        {
          id: '2',
          staff_id: 'N002',
          staff_name: 'Sam Singh',
          shift_type: 'night',
          start_time: '19:00',
          end_time: '07:00',
          date: selectedDate,
          status: 'scheduled'
        },
        {
          id: '3',
          staff_id: 'D001',
          staff_name: 'Dr. Raj Kumar',
          shift_type: 'day',
          start_time: '08:00',
          end_time: '18:00',
          date: selectedDate,
          status: 'confirmed'
        }
      ];
      
      setSchedules(sampleSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('department_id', user?.department_id)
        .eq('status', 'active');
      
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'day': return 'bg-blue-100 text-blue-800';
      case 'evening': return 'bg-orange-100 text-orange-800';
      case 'night': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'scheduled': return 'text-yellow-600';
      case 'completed': return 'text-blue-600';
      case 'absent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return CheckCircle;
      case 'absent':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedStaff = staff.find((s: any) => s.id === scheduleForm.staff_id);
      
      const newSchedule: ScheduleEntry = {
        id: Date.now().toString(),
        staff_id: scheduleForm.staff_id,
        staff_name: selectedStaff?.name || 'Unknown',
        shift_type: scheduleForm.shift_type as any,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        date: selectedDate,
        status: 'scheduled',
        notes: scheduleForm.notes
      };

      setSchedules([...schedules, newSchedule]);
      setScheduleForm({
        staff_id: '',
        shift_type: 'day',
        start_time: '07:00',
        end_time: '19:00',
        notes: ''
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  const updateScheduleStatus = (scheduleId: string, newStatus: string) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, status: newStatus as any }
        : schedule
    ));
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Staff Schedule Management
            </h3>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Schedule</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No schedules found for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const StatusIcon = getStatusIcon(schedule.status);
                return (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{schedule.staff_name}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getShiftColor(schedule.shift_type)}`}>
                              {schedule.shift_type.charAt(0).toUpperCase() + schedule.shift_type.slice(1)} Shift
                            </span>
                            <span className="text-sm text-gray-600">
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                          {schedule.notes && (
                            <p className="text-sm text-gray-600 mt-1">{schedule.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-5 w-5 ${getStatusColor(schedule.status)}`} />
                          <span className={`text-sm font-medium capitalize ${getStatusColor(schedule.status)}`}>
                            {schedule.status}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {schedule.status === 'scheduled' && (
                            <button
                              onClick={() => updateScheduleStatus(schedule.id, 'confirmed')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirm Schedule"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {schedule.status === 'confirmed' && (
                            <button
                              onClick={() => updateScheduleStatus(schedule.id, 'completed')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark Complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Schedule Entry</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Member *
                </label>
                <select
                  value={scheduleForm.staff_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, staff_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Staff Member</option>
                  {staff.map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Type *
                </label>
                <select
                  value={scheduleForm.shift_type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, shift_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="day">Day Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Additional notes or special instructions..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSchedule;