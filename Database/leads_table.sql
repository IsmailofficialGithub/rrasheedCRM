-- Create the leads table
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  company_name text not null,
  job_posting_url text,
  location text,
  salary_range text,
  decision_maker_name text,
  email text,
  phone_number text,
  user_id uuid references auth.users(id) default auth.uid()
);

-- Enable Row Level Security (RLS)
alter table public.leads enable row level security;

-- Create a policy that allows users to view only their own leads
create policy "Users can view their own leads"
on public.leads for select
using (auth.uid() = user_id);

-- Create a policy that allows users to insert their own leads
create policy "Users can insert their own leads"
on public.leads for insert
with check (auth.uid() = user_id);

-- Create a policy that allows users to update their own leads
create policy "Users can update their own leads"
on public.leads for update
using (auth.uid() = user_id);

-- Create a policy that allows users to delete their own leads
create policy "Users can delete their own leads"
on public.leads for delete
using (auth.uid() = user_id);
