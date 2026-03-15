CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('nurse', 'doctor', 'admin')),
  department_id uuid REFERENCES departments(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text UNIQUE NOT NULL,
  current_department_id uuid REFERENCES departments(id),
  admission_date timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

--insertion and removal data
CREATE TABLE IF NOT EXISTS iv_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  inserted_by uuid REFERENCES staff(id) NOT NULL,
  number_of_attempts integer DEFAULT 1,
  result text CHECK (result IN ('successful', 'unsuccessful')),
  unsuccessful_reason text,
  pvc_size text, -- e.g., '18G', '20G', etc.
  vein_quality text CHECK (vein_quality IN ('good', 'fair', 'poor')),
  vein_site text,
  reason_for_insertion text,
  insertion_pain integer CHECK (insertion_pain BETWEEN 0 AND 10),
  insertion_date timestamptz DEFAULT now(),
  
  removal_by uuid REFERENCES staff(id),
  removal_date timestamptz,
  removal_reason text,  -- e.g. 'intended', 'infiltration', 'extravasation', 'occlusion'
  device_days integer DEFAULT 0,
  pvc_dislodgement boolean DEFAULT false,
  patient_wish boolean DEFAULT false,
  remarks text,
  vesicant_drugs boolean DEFAULT false,
  chemical_reason boolean DEFAULT false,
  mechanical_reason boolean DEFAULT false,
  post_removal_status text,
  employee_name text,
  signature text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'removed', 'replaced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
--for daily monitioring
CREATE TABLE IF NOT EXISTS iv_monitoring_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iv_record_id uuid REFERENCES iv_records(id) NOT NULL,
  monitoring_day integer CHECK (monitoring_day BETWEEN 1 AND 7),
  monitoring_date date,
  infiltration_score integer,
  vip_score integer,
  dressing_appearance text,
  dressing_integrity text,
  flushing_pvc boolean,
  replacement_of_set boolean,
  nurse_id uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  from_department_id uuid REFERENCES departments(id) NOT NULL,
  to_department_id uuid REFERENCES departments(id) NOT NULL,
  transferred_by uuid REFERENCES staff(id) NOT NULL,
  transfer_reason text,
  transfer_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);


ALTER TABLE iv_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_monitoring_records ENABLE ROW LEVEL SECURITY;

-- IV RECORDS: Admin full access
CREATE POLICY "Admin full access iv_records"
  ON iv_records
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM staff WHERE id::text = auth.uid()::text AND role = 'admin'));

  -- IV MONITORING: Admin full access
CREATE POLICY "Admin full access iv_monitoring"
  ON iv_monitoring_records
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM staff WHERE id::text = auth.uid()::text AND role = 'admin'));


-- IV RECORDS: Staff department-only access
CREATE POLICY "Staff access own department iv_records"
  ON iv_records
  FOR ALL
  TO authenticated
  USING (
    -- Patient in staff's department OR admin
    (patient_id IN (
        SELECT id FROM patients WHERE current_department_id = (
            SELECT department_id FROM staff WHERE id::text = auth.uid()::text
        )
     )
    )
    OR
    EXISTS (SELECT 1 FROM staff WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- IV MONITORING: Staff department-only access
CREATE POLICY "Staff access own department iv_monitoring"
  ON iv_monitoring_records
  FOR ALL
  TO authenticated
  USING (
    -- IV record (and thus patient) in staff's department OR admin
    (
      iv_record_id IN (
        SELECT ir.id
        FROM iv_records ir
        JOIN patients p ON ir.patient_id = p.id
        WHERE p.current_department_id = (
          SELECT department_id FROM staff WHERE id::text = auth.uid()::text
        )
      )
    )
    OR
    EXISTS (SELECT 1 FROM staff WHERE id::text = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admin full access patient transfers"
  ON patient_transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

  CREATE POLICY "Staff dept or own transfer access"
  ON patient_transfers
  FOR ALL
  TO authenticated
  USING (
    transferred_by = auth.uid()::uuid
    OR from_department_id = (
        SELECT department_id FROM staff WHERE id::text = auth.uid()::text
      )
    OR to_department_id = (
        SELECT department_id FROM staff WHERE id::text = auth.uid()::text
      )
    OR EXISTS (
        SELECT 1 FROM staff WHERE id::text = auth.uid()::text AND role = 'admin'
      )
  );

SELECT * FROM patient_transfers;

-- Example index to optimize queries on iv_records by patient_id