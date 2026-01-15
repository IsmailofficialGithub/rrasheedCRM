-- Migration to update scheduled_calls table structure
-- Add contact_id column
alter table public.scheduled_calls 
add column if not exists contact_id uuid references public.contacts(id) on delete cascade;

-- Remove old aggregate columns that are no longer needed
alter table public.scheduled_calls 
drop column if exists contacts_count,
drop column if exists calls_completed,
drop column if exists calls_failed;

-- Add index for contact_id
create index if not exists idx_scheduled_calls_contact on public.scheduled_calls using btree (contact_id);

-- Make contact_id NOT NULL if there are no existing rows, or update existing rows first
-- Note: If you have existing data, you'll need to populate contact_id before making it NOT NULL
-- For now, we'll keep it nullable to allow the migration to run
-- After populating contact_id for existing rows, you can run:
-- alter table public.scheduled_calls alter column contact_id set not null;
