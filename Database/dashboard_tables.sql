-- Create follow_ups table
create table if not exists public.follow_ups (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lead_id uuid references public.leads(id) on delete cascade,
  sequence text,
  follow_up_number text,
  days text,
  status text default 'Pending',
  last_contact timestamp with time zone
);

-- Create responses table
create table if not exists public.responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lead_id uuid references public.leads(id) on delete cascade,
  subject text,
  snippet text,
  status text default 'Pending',
  generated_at timestamp with time zone default now()
);

-- Create bookings table
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lead_id uuid references public.leads(id) on delete cascade,
  booking_date timestamp with time zone not null,
  status text default 'Pending',
  description text
);

-- Enable RLS for all
alter table public.follow_ups enable row level security;
alter table public.responses enable row level security;
alter table public.bookings enable row level security;

-- Create permissive policies
create policy "Enable read access for all authenticated users" on public.follow_ups for select to authenticated using (true);
create policy "Enable insert access for all authenticated users" on public.follow_ups for insert to authenticated with check (true);
create policy "Enable update access for all authenticated users" on public.follow_ups for update to authenticated using (true);

create policy "Enable read access for all authenticated users" on public.responses for select to authenticated using (true);
create policy "Enable insert access for all authenticated users" on public.responses for insert to authenticated with check (true);
create policy "Enable update access for all authenticated users" on public.responses for update to authenticated using (true);

create policy "Enable read access for all authenticated users" on public.bookings for select to authenticated using (true);
create policy "Enable insert access for all authenticated users" on public.bookings for insert to authenticated with check (true);
create policy "Enable update access for all authenticated users" on public.bookings for update to authenticated using (true);
