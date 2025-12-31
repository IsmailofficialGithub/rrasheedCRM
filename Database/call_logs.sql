create table public.calls_log (
  uuid uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  company text not null,
  phone text not null,
  duration integer, -- duration in seconds
  call_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_calls_log_lead
    foreign key (lead_id)
    references public.leads(id)
    on delete cascade
);
