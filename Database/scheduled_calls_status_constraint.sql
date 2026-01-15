-- Add check constraint for scheduled_calls status column
-- Allowed values: 'completed', 'in_progress', 'scheduled', 'paused'

alter table public.scheduled_calls 
drop constraint if exists scheduled_calls_status_check;

alter table public.scheduled_calls 
add constraint scheduled_calls_status_check 
check (status in ('completed', 'in_progress', 'scheduled', 'paused'));
