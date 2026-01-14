-- Create contact_lists table
create table if not exists public.contact_lists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  file_name text not null,
  total_contacts integer default 0,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create contacts table
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  contact_list_id uuid references public.contact_lists(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  additional_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.contact_lists enable row level security;
alter table public.contacts enable row level security;

-- Create permissive policies for team collaboration
create policy "Enable read access for all authenticated users"
on public.contact_lists for select
to authenticated
using (true);

create policy "Enable insert access for all authenticated users"
on public.contact_lists for insert
to authenticated
with check (true);

create policy "Enable update access for all authenticated users"
on public.contact_lists for update
to authenticated
using (true);

create policy "Enable delete access for all authenticated users"
on public.contact_lists for delete
to authenticated
using (true);

create policy "Enable read access for all authenticated users"
on public.contacts for select
to authenticated
using (true);

create policy "Enable insert access for all authenticated users"
on public.contacts for insert
to authenticated
with check (true);

create policy "Enable update access for all authenticated users"
on public.contacts for update
to authenticated
using (true);

create policy "Enable delete access for all authenticated users"
on public.contacts for delete
to authenticated
using (true);

-- Create triggers to automatically update updated_at
create trigger handle_contact_lists_updated_at
before update on public.contact_lists
for each row
execute procedure public.handle_updated_at();

create trigger handle_contacts_updated_at
before update on public.contacts
for each row
execute procedure public.handle_updated_at();
