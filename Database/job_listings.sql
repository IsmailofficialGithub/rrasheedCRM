-- Create job_listings table (final schema)
create table if not exists public.job_listings (
  id uuid not null default gen_random_uuid(),
  job_key text null,
  job_title text null,
  company_name text null,
  job_url text null,
  salary_min integer null,
  salary_max integer null,
  salary_text text null,
  job_location text null,
  company_address text null,
  description_text text null,
  shifts text[] null,
  job_type text[] null,
  is_remote boolean null,
  status boolean null,
  date_published date null,
  created_at timestamp with time zone null default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone null default timezone('utc'::text, now()) not null,
  currency text null,
  emails text[] null,
  constraint job_listings_pkey primary key (id),
  constraint job_listings_job_key_key unique (job_key)
);

-- Create indexes
create index if not exists idx_job_listings_job_key on public.job_listings using btree (job_key);
create index if not exists idx_job_listings_company_name on public.job_listings using btree (company_name);
create index if not exists idx_job_listings_date_published on public.job_listings using btree (date_published);
create index if not exists idx_job_listings_is_remote on public.job_listings using btree (is_remote);

-- Enable Row Level Security (RLS)
alter table public.job_listings enable row level security;

-- Create permissive policies for team collaboration
create policy "Enable read access for all authenticated users"
on public.job_listings for select
to authenticated
using (true);

create policy "Enable insert access for all authenticated users"
on public.job_listings for insert
to authenticated
with check (true);

create policy "Enable update access for all authenticated users"
on public.job_listings for update
to authenticated
using (true);

create policy "Enable delete access for all authenticated users"
on public.job_listings for delete
to authenticated
using (true);

-- Create trigger to automatically update updated_at
create trigger handle_job_listings_updated_at
before update on public.job_listings
for each row
execute procedure public.handle_updated_at();
