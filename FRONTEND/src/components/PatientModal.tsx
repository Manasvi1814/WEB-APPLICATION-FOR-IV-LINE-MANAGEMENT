import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { X } from "lucide-react";

export interface Patient {
  id: string;
  patient_id: string;
  current_department_id: string;
  created_at: string;
  updated_at: string;

  admission_date?: string;
  status?: string;
  added_by_staff_id?: string;
  added_by_role?: string;
  added_from_department_id?: string;
  discharge_date?: string;
}

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { department } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [admissionDate, setAdmissionDate] = useState<string>(""); // NEW
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!department) {
      setError("Please select a department first.");
      setIsLoading(false);
      return;
    }

    try {
      const { data: existingPatient, error: existingError } = await supabase
        .from("patients")
        .select("id")
        .eq("patient_id", patientId)
        .eq("current_department_id", department.id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existingPatient) {
        setError("Patient ID already exists in this department");
        setIsLoading(false);
        return;
      }

      const payload: Partial<Patient> = {
        patient_id: patientId,
        current_department_id: department.id,
        added_from_department_id: department.id,
        admission_date: admissionDate || new Date().toISOString(), // NEW
      };

      const { data, error: insertError } = await supabase
        .from("patients")
        .insert([payload])
        .select("*")
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error("No data returned");

      onSave(data as Patient);

      setPatientId("");
      setAdmissionDate("");
      onClose();
    } catch (err: any) {
      console.error("Insert failed:", err);
      setError(err.message || "Failed to add patient");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Patient
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label
              htmlFor="patientId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Patient ID *
            </label>
            <input
              type="text"
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter unique Patient ID"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: P001, MRN123456
            </p>
          </div>

          {/* NEW: Admission date */}
          <div className="mb-6">
            <label
              htmlFor="admissionDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Admission date *
            </label>
            <input
              type="date"
              id="admissionDate"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in patient‑days calculation for department reports.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !patientId.trim() || !admissionDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;
