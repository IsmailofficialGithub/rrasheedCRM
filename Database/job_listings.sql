-- Create job_listings table
create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),

  -- Core identifiers
  job_key text not null unique,
  source text,
  job_url text,

  -- Job details
  title text,
  description_html text,
  description_text text,
  job_type text[],
  occupation text[],
  attributes text[],

  -- Company
  company_name text,
  company_url text,
  company_logo_url text,
  company_industry text,
  company_num_employees text,
  company_description text,
  company_addresses text[],
  company_links jsonb,
  company_ceo jsonb,

  -- Location
  location jsonb,

  -- Salary
  salary jsonb,

  -- Ratings & metadata
  rating jsonb,
  benefits text[],
  requirements text[],
  contacts jsonb,
  shifts jsonb,
  social_insurance jsonb,
  working_system jsonb,
  shift_and_schedule jsonb,

  -- Hiring signals
  hiring_demand jsonb,
  num_of_candidates integer,
  posted_today boolean,
  expired boolean,
  is_remote boolean,

  -- Dates
  date_published date,
  age text,

  -- Locale & language
  locale text,
  language text,

  -- Scraping metadata
  scraping_info jsonb,

  -- Emails (future enrichment)
  emails text[],

  -- Audit
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_job_listings_job_key on public.job_listings (job_key);
create index if not exists idx_job_listings_company_name on public.job_listings (company_name);
create index if not exists idx_job_listings_location on public.job_listings using gin (location);
create index if not exists idx_job_listings_salary on public.job_listings using gin (salary);
create index if not exists idx_job_listings_attributes on public.job_listings using gin (attributes);
create index if not exists idx_job_listings_created_at on public.job_listings (created_at);

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
