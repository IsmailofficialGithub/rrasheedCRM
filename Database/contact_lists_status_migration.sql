-- Migration to add status column to contact_lists table
-- This will track the overall status of the list (scheduled, ongoing, paused, cancelled, etc.)

-- Add status column if it doesn't exist (it already exists but we'll make sure it's properly set up)
-- The status column already exists in the schema, but we need to ensure it can track list-level status

-- Update existing lists that don't have a status set
update public.contact_lists 
set status = 'active' 
where status is null or status = '';

-- Add check constraint to ensure valid status values
alter table public.contact_lists 
drop constraint if exists contact_lists_status_check;

alter table public.contact_lists 
add constraint contact_lists_status_check 
check (status in ('active', 'scheduled', 'ongoing', 'paused', 'completed'));
