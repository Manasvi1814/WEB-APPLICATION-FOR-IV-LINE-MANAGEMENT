create table public.patient_transfers (
  id uuid not null default gen_random_uuid (),
  patient_id uuid not null,
  from_department_id uuid not null,
  to_department_id uuid not null,
  transferred_by uuid not null,
  transfer_reason text null,
  transfer_date timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint patient_transfers_pkey primary key (id),
  constraint patient_transfers_from_department_id_fkey foreign KEY (from_department_id) references departments (id),
  constraint patient_transfers_to_department_id_fkey foreign KEY (to_department_id) references departments (id),
  constraint patient_transfers_transferred_by_fkey foreign KEY (transferred_by) references staff (id)
) TABLESPACE pg_default;