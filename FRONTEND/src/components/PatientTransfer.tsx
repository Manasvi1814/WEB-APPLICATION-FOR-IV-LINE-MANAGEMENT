import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowRight, Building, User, Calendar, FileText, X } from 'lucide-react';

interface PatientTransferProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onTransfer: () => void;
}

const PatientTransfer: React.FC<PatientTransferProps> = ({ 
  isOpen, 
  onClose, 
  patient, 
  onTransfer 
}) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      const { data } = await supabase
        .from('departments')
        .select('*')
        .neq('id', patient?.department_id)
        .order('name');
      
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update patient department
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          department_id: selectedDepartment,
          status: 'transferred',
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;

      // Create transfer record
      const { error: transferError } = await supabase
        .from('patient_transfers')
        .insert([{
          patient_id: patient.id,
          from_department_id: patient.department_id,
          to_department_id: selectedDepartment,
          transferred_by: user?.id,
          transfer_reason: transferReason,
          transfer_date: new Date().toISOString()
        }]);

      if (transferError) throw transferError;

      onTransfer();
      onClose();
    } catch (error: any) {
      console.error('Error transferring patient:', error);
      alert('Failed to transfer patient: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transfer Patient</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Patient: {patient?.patient_id}</p>
                <p className="text-sm text-blue-700">
                  Current Department: {patient?.department?.name}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer To Department *
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Reason *
            </label>
            <textarea
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Reason for transfer..."
              required
            />
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Transfer Notes:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• All active IV lines will remain with the patient</li>
                  <li>• Transfer will be logged for audit purposes</li>
                  <li>• Receiving department will be notified</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedDepartment || !transferReason}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span>{isLoading ? 'Transferring...' : 'Transfer Patient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientTransfer;