create table public.departments (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code text not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint departments_pkey primary key (id),
  constraint departments_code_key unique (code),
  constraint departments_name_key unique (name)
) TABLESPACE pg_default;