-- The Paper Mill v4.4.0-t3: survival waves are now 4 days (they were 7).
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run. Safe to run again.
-- The survival table checks that the wave and the time survived agree. The old check assumed 7-day waves and would
-- refuse every 4-day-wave score past wave 3. This one fits 4-day waves and still accepts scores from 7-day test builds.
alter table public.survival drop constraint if exists survival_wave_fits;
alter table public.survival add constraint survival_wave_fits check (wave <= minutes / 5760 + 2 and minutes < wave * 10080);
