-- Create search_keywords table
create table if not exists public.search_keywords (
  id uuid default gen_random_uuid() primary key,
  keyword text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean default true
);

-- Create index for faster searches
create index if not exists idx_search_keywords_keyword on public.search_keywords using btree (keyword);
create index if not exists idx_search_keywords_created_at on public.search_keywords using btree (created_at desc);
create index if not exists idx_search_keywords_is_active on public.search_keywords using btree (is_active);

-- Enable Row Level Security (RLS)
alter table public.search_keywords enable row level security;

-- Create permissive policies for team collaboration
create policy "Enable read access for all authenticated users"
on public.search_keywords for select
to authenticated
using (true);

create policy "Enable insert access for all authenticated users"
on public.search_keywords for insert
to authenticated
with check (true);

create policy "Enable update access for all authenticated users"
on public.search_keywords for update
to authenticated
using (true);

create policy "Enable delete access for all authenticated users"
on public.search_keywords for delete
to authenticated
using (true);

-- Create trigger to automatically update updated_at
create trigger handle_search_keywords_updated_at
before update on public.search_keywords
for each row
execute procedure public.handle_updated_at();

-- Add constraint to ensure keyword is not empty and has minimum length
alter table public.search_keywords add constraint search_keywords_keyword_length check (length(trim(keyword)) >= 2);
