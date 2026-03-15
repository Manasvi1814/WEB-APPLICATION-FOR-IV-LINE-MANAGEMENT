create table public.staff (
  id uuid not null default gen_random_uuid (),
  staff_id text not null,
  name text not null,
  role text not null,
  department_id uuid null,
  status text  default 'active',
  email text UNIQUE NOT NULL,
  auth_user_id uuid UNIQUE,

  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_pkey primary key (id),
  constraint staff_staff_id_key unique (staff_id),
  constraint staff_department_id_fkey foreign KEY (department_id) references departments (id),
  constraint staff_role_check check (
    (
      role = any (
        array['nurse'::text, 'doctor'::text, 'admin'::text]
      )
    )
  )
) TABLESPACE pg_default;