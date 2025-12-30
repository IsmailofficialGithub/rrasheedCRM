create table public.leads (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  company_name text not null,
  job_posting_url text null,
  city_state text null,
  salary_range text null,
  decision_maker_name text null,
  email text null,
  phone_number text null,
  constraint leads_pkey primary key (id)
) TABLESPACE pg_default;

create trigger handle_leads_updated_at BEFORE
update on leads for EACH row
execute FUNCTION handle_updated_at ();