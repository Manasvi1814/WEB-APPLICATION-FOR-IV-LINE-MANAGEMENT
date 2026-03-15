import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Plus, Search } from "lucide-react";
import PatientModal, { Patient } from "./PatientModal";
import IVLineModal from "./IVLineModal";

interface IVRecord {
  id: string;
  patient_id: string;
  status?: string;
  pvc_size?: string;
  vein_site?: string;
  insertion_date?: string;
}

const PatientManagement: React.FC = () => {
  const { department } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [ivRecords, setIVRecords] = useState<Record<string, IVRecord[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showIVLineModal, setShowIVLineModal] = useState(false);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);

  // per‑patient discharge date input
  const [dischargeDates, setDischargeDates] = useState<Record<string, string>>(
    {}
  );

  // Fetch patients + IV records
  const fetchData = async () => {
    if (!department) return;

    setIsLoading(true);

    try {
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select(
          "id, patient_id, current_department_id, created_at, updated_at, admission_date, discharge_date"
        )
        .eq("current_department_id", department.id)
        .order("created_at", { ascending: false });

      if (patientsError) throw patientsError;

      const patientsList = (patientsData as Patient[]) || [];
      setPatients(patientsList);

      if (patientsList.length > 0) {
        const ids = patientsList.map((p) => p.id);

        const { data: ivData, error: ivError } = await supabase
          .from("iv_records")
          .select("id, patient_id, status, pvc_size, vein_site, insertion_date")
          .in("patient_id", ids)
          .eq("status", "active");

        if (ivError) throw ivError;

        const byPatient: Record<string, IVRecord[]> = {};

        ids.forEach((id) => {
          byPatient[id] =
            (ivData as IVRecord[])?.filter((r) => r.patient_id === id) || [];
        });

        setIVRecords(byPatient);
      } else {
        setIVRecords({});
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setPatients([]);
      setIVRecords({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [department]);

  const filteredPatients = searchTerm.trim()
    ? patients.filter((p) =>
        p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : patients;

  const handleOpenIVModal = (patient: Patient) => {
    setModalPatient(patient);
    setShowIVLineModal(true);
  };

  // discharge handler using chosen date
  const handleDischarge = async (patientId: string) => {
    const chosen = dischargeDates[patientId];
    if (!chosen) {
      alert("Please select a discharge date first.");
      return;
    }

    if (!window.confirm("Mark this patient as discharged on this date?")) return;

    const { error } = await supabase
      .from("patients")
      .update({ discharge_date: chosen })
      .eq("id", patientId);

    if (error) {
      console.error("Discharge error:", error.message);
      alert(error.message);
      return;
    }

    await fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Patient Management
        </h1>

        <button
          onClick={() => setShowPatientModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search by Patient ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Patients ({filteredPatients.length})
          </h3>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No patients found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => {
              const patientIVs = ivRecords[patient.id] || [];
              const isDischarged = !!patient.discharge_date;

              return (
                <div
                  key={patient.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Patient ID: {patient.patient_id}
                      </h4>

                      {/* Admission / discharge info */}
                      <p className="text-sm text-gray-600 mt-1">
                        Admission:{" "}
                        {patient.admission_date
                          ? new Date(
                              patient.admission_date
                            ).toLocaleDateString()
                          : "N/A"}
                        {" • "}
                        Status: {isDischarged ? "Discharged" : "Admitted"}
                      </p>
                      {isDischarged && patient.discharge_date && (
                        <p className="text-xs text-gray-500">
                          Discharged:{" "}
                          {new Date(
                            patient.discharge_date
                          ).toLocaleDateString()}
                        </p>
                      )}

                      {patientIVs.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {patientIVs.map((iv) => (
                            <div
                              key={iv.id}
                              className="flex items-center space-x-3 text-sm"
                            >
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                IV Active
                              </span>

                              <span className="text-gray-600">
                                {iv.pvc_size || "N/A"} at{" "}
                                {iv.vein_site || "N/A"}
                              </span>

                              <span className="text-gray-500">
                                Since{" "}
                                {iv.insertion_date
                                  ? new Date(
                                      iv.insertion_date
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            No Active IV
                          </span>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mt-2">
                        Added:{" "}
                        {new Date(patient.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleOpenIVModal(patient)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        {patientIVs.length > 0 ? "Manage IV" : "Insert IV"}
                      </button>

                      {/* Discharge controls */}
                      {!isDischarged && (
                        <div className="flex flex-col items-end gap-1">
                          <input
                            type="date"
                            className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                            value={dischargeDates[patient.id] || ""}
                            onChange={(e) =>
                              setDischargeDates((prev) => ({
                                ...prev,
                                [patient.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={() => handleDischarge(patient.id)}
                            className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                          >
                            Set discharge
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Modal */}
      {showPatientModal && (
        <PatientModal
          isOpen={showPatientModal}
          onClose={() => setShowPatientModal(false)}
          onSave={(createdPatient) => {
            setPatients([createdPatient, ...patients]);
            setModalPatient(createdPatient);
            setShowIVLineModal(true);
            setShowPatientModal(false);
          }}
        />
      )}

      {/* IV Modal */}
      {showIVLineModal && modalPatient && (
        <IVLineModal
          isOpen={showIVLineModal}
          onClose={() => {
            setShowIVLineModal(false);
            setModalPatient(null);
          }}
          patient={modalPatient}
          onSave={fetchData}
        />
      )}
    </div>
  );
};

export default PatientManagement;
