create table public.patients (
  id uuid not null default gen_random_uuid (),
  patient_id text not null,
  current_department_id uuid null,
  admission_date timestamp with time zone null default now(),
  status text null default 'active'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint patients_pkey primary key (id),
  constraint patients_patient_id_key unique (patient_id),
  constraint patients_current_department_id_fkey foreign KEY (current_department_id) references departments (id),
  constraint patients_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'discharged'::text,
          'transferred'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;