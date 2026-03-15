create table public.iv_records (
  id uuid not null default gen_random_uuid (),
  patient_id uuid not null,
  inserted_by uuid not null,
  number_of_attempts integer null default 1,
  result text null,
  unsuccessful_reason text null,
  pvc_size text null,
  vein_quality text null,
  vein_site text null,
  reason_for_insertion text null,
  insertion_pain integer null,
  insertion_date timestamp with time zone null default now(),
  removal_by uuid null,
  removal_date timestamp with time zone null,
  removal_reason text null,
  device_days integer null default 0,
  pvc_dislodgement boolean null default false,
  patient_wish boolean null default false,
  remarks text null,
  vesicant_drugs boolean null default false,
  chemical_reason boolean null default false,
  mechanical_reason boolean null default false,
  post_removal_status text null,
  employee_name text null,
  signature text null,
  status text null default 'active'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint iv_records_pkey primary key (id),
  constraint iv_records_removal_by_fkey foreign KEY (removal_by) references staff (id),
  constraint iv_records_inserted_by_fkey foreign KEY (inserted_by) references staff (id),
  constraint iv_records_vein_quality_check check (
    (
      vein_quality = any (array['good'::text, 'fair'::text, 'poor'::text])
    )
  ),
  constraint iv_records_result_check check (
    (
      result = any (array['successful'::text, 'unsuccessful'::text])
    )
  ),
  constraint iv_records_status_check check (
    (
      status = any (
        array['active'::text, 'removed'::text, 'replaced'::text]
      )
    )
  ),
  constraint iv_records_insertion_pain_check check (
    (
      (insertion_pain >= 0)
      and (insertion_pain <= 10)
    )
  )
) TABLESPACE pg_default;