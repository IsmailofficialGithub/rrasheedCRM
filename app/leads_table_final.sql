-- Drop the existing table to ensure a clean slate with the correct columns
drop table if exists public.leads;

-- Create the leads table with the exact columns requested
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  company_name text not null,
  job_posting_url text,
  city_state text,
  salary_range text,
  decision_maker_name text,
  email text,
  phone_number text
);

-- Enable Row Level Security (RLS)
alter table public.leads enable row level security;

-- Create permissive policies for team collaboration (since no user_id)
create policy "Enable read access for all authenticated users"
on public.leads for select
to authenticated
using (true);

create policy "Enable insert access for all authenticated users"
on public.leads for insert
to authenticated
with check (true);

create policy "Enable update access for all authenticated users"
on public.leads for update
to authenticated
using (true);

create policy "Enable delete access for all authenticated users"
on public.leads for delete
to authenticated
using (true);

-- Create a trigger to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_leads_updated_at
before update on public.leads
for each row
execute procedure public.handle_updated_at();
