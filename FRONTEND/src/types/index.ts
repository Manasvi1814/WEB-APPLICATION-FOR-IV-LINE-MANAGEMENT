export interface User {
  id: string;
  name: string;
  staff_id: string;
  email: string;
  role: 'nurse' | 'doctor' | 'admin';
  department_id: string;
  department?: Department;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  current_department_id: string;
  created_at: string;
  updated_at: string;

  // Add the rest of the columns from your table
  admission_date?: string;
  status?: string;
  added_by_staff_id?: string;
  added_by_role?: string;
  added_from_department_id?: string; // ✅ this fixes the TS error
  discharge_date?: string;
}
export interface IVLine {
  id: string;
  patient_id: string;
  inserted_by: string;
  removed_by?: string;
  iv_type: 'peripheral' | 'central' | 'picc';
  insertion_site: string;
  insertion_date: string;
  removal_date?: string;
  cannula_count: number;
  syringe_count: number;
  glove_count: number;
  normal_saline_ml: number;
  time_taken_minutes: number;
  phlebitis_score: number;
  site_pain: boolean;
  site_redness: boolean;
  site_swelling: boolean;
  notes?: string;
  status: 'active' | 'removed';
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  // ❌ old:
  // login: (staffId: string, password: string) => Promise<void>;
  // ✅ new: include selectedDeptId as 2nd argument
  login: (staffId: string, selectedDeptId: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}


export interface ReportData {
  totalPatients: number;
  activeIVLines: number;
  dailyInsertions: number;
  successRate: number;
  totalDeviceDays: number;
  averagePhlebitisScore: number;
  efficiencyScore: number;
}