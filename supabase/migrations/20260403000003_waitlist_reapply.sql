-- Add rejected_at for 30-day reapply window tracking
alter table waitlist add column if not exists rejected_at timestamptz;

-- Allow anon to reset a rejected entry back to pending (re-application after 30 days)
-- The check ensures only pending status can be written, and only rejected rows can be updated
create policy "anon_reapply_waitlist" on waitlist
  for update to anon
  using (status = 'rejected')
  with check (status = 'pending');
