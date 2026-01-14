-- Create generated_leads table to store leads fetched via API with voice and transcript data
create table if not exists public.generated_leads (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete cascade,
  niche text not null,
  voice_url text,
  transcript text,
  status text default 'Pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.generated_leads enable row level security;

-- Create permissive policies for team collaboration
create policy "Enable read access for all authenticated users"
on public.generated_leads for select
to authenticated
using (true);

create policy "Enable insert access for all authenticated users"
on public.generated_leads for insert
to authenticated
with check (true);

create policy "Enable update access for all authenticated users"
on public.generated_leads for update
to authenticated
using (true);

create policy "Enable delete access for all authenticated users"
on public.generated_leads for delete
to authenticated
using (true);

-- Create a trigger to automatically update updated_at
create trigger handle_generated_leads_updated_at
before update on public.generated_leads
for each row
execute procedure public.handle_updated_at();
