-- Create scheduled_calls table
-- Each row represents a scheduled call for a single contact
-- If the table already exists, use the migration file instead: scheduled_calls_migration.sql
create table if not exists public.scheduled_calls (
  id uuid not null default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  list_id uuid not null references public.contact_lists(id) on delete cascade,
  bot_id uuid, -- Optional, can be null if not using bots
  scheduled_at timestamp with time zone not null default now(),
  status text not null default 'scheduled',
  error_message text null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  runtime_call_status boolean null,
  tz text null,
  constraint scheduled_calls_pkey primary key (id)
);

-- Create indexes
create index if not exists idx_scheduled_calls_contact on public.scheduled_calls using btree (contact_id);
create index if not exists idx_scheduled_calls_list on public.scheduled_calls using btree (list_id);
create index if not exists idx_scheduled_calls_owner on public.scheduled_calls using btree (owner_user_id);
create index if not exists idx_scheduled_calls_scheduled_at on public.scheduled_calls using btree (scheduled_at);
create index if not exists idx_scheduled_calls_status on public.scheduled_calls using btree (status);
create index if not exists idx_scheduled_calls_created_at on public.scheduled_calls using btree (created_at desc);

-- Enable Row Level Security (RLS)
alter table public.scheduled_calls enable row level security;

-- Create permissive policies for team collaboration
create policy "Enable read access for all authenticated users"
on public.scheduled_calls for select
to authenticated
using (true);

create policy "Enable insert access for all authenticated users"
on public.scheduled_calls for insert
to authenticated
with check (true);

create policy "Enable update access for all authenticated users"
on public.scheduled_calls for update
to authenticated
using (true);

create policy "Enable delete access for all authenticated users"
on public.scheduled_calls for delete
to authenticated
using (true);

-- Create trigger to automatically update updated_at
create trigger update_scheduled_calls_updated_at
before update on public.scheduled_calls
for each row
execute procedure public.handle_updated_at();
