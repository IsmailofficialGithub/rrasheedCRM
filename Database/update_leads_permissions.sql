-- -- Rename user_id to assigned_to (optional, but clearer for shared leads) or just relax the policies
-- -- For now, let's keep user_id as 'uploader' but allow everyone to see/edit everything.

-- -- Drop existing strict policies
-- drop policy if exists "Users can view their own leads" on public.leads;
-- drop policy if exists "Users can insert their own leads" on public.leads;
-- drop policy if exists "Users can update their own leads" on public.leads;
-- drop policy if exists "Users can delete their own leads" on public.leads;

-- -- Create permissive policies for team collaboration
-- create policy "Enable read access for all authenticated users"
-- on public.leads for select
-- to authenticated
-- using (true);

-- create policy "Enable insert access for all authenticated users"
-- on public.leads for insert
-- to authenticated
-- with check (true);

-- create policy "Enable update access for all authenticated users"
-- on public.leads for update
-- to authenticated
-- using (true);

-- create policy "Enable delete access for all authenticated users"
-- on public.leads for delete
-- to authenticated
-- using (true);

-- -- Optional: Make user_id nullable if it wasn't already (it was created with a default, but we can drop the default if we want 'unassigned' leads)
-- alter table public.leads alter column user_id drop not null;
-- alter table public.leads alter column user_id drop default;
