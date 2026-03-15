create table public.iv_monitoring_records (
  id uuid not null default gen_random_uuid (),
  iv_record_id uuid not null,
  monitoring_day integer null,
  monitoring_date date null,
  infiltration_score integer null,
  vip_score integer null,
  dressing_appearance text null,
  dressing_integrity text null,
  flushing_pvc boolean null,
  replacement_of_set boolean null,
  nurse_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint iv_monitoring_records_pkey primary key (id),
  constraint iv_monitoring_records_iv_record_id_fkey foreign KEY (iv_record_id) references iv_records (id),
  constraint iv_monitoring_records_nurse_id_fkey foreign KEY (nurse_id) references staff (id),
  constraint iv_monitoring_records_monitoring_day_check check (
    (
      (monitoring_day >= 1)
      and (monitoring_day <= 7)
    )
  )
) TABLESPACE pg_default;