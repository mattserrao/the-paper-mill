-- The Paper Mill: survival leaderboard (v4.3; 4-day waves from v4.4.0-t3)
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It adds a second table next to public.scores (the season board, leaderboard.sql) and changes nothing there.
-- It reuses public.banned_words from leaderboard.sql, so run that one first on a new project.

create table if not exists public.survival (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text    not null check (char_length(name) between 2 and 16 and name ~ '^[A-Za-z0-9 ._''-]+$'),
  minutes     integer not null check (minutes between 0 and 5256000),      -- time survived, in sim minutes (the score)
  wave        integer not null check (wave between 1 and 1000),            -- the wave the mill went bankrupt in
  tons        integer not null check (tons between 0 and 5000000),         -- tons shipped
  incidents   integer not null default 0 check (incidents between 0 and 100000),
  mill        text    check (char_length(mill) <= 40),
  version     text    check (char_length(version) <= 12),
  env         text    check (env in ('rural','urban','desert','swamp')),   -- the site the run was played on
  ip_hash     text,
  -- a wave is 4 sim days (5,760 minutes) from v4.4.0-t3 (7 days before), so the wave and the time have to agree
  constraint survival_wave_fits check (wave <= minutes / 5760 + 2 and minutes < wave * 10080)
);
create index if not exists survival_rank on public.survival (minutes desc, tons desc);

-- guard: name filter + max 3 submissions per minute from the same address (the same rules as the season board)
create or replace function public.survival_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  hdr json := nullif(current_setting('request.headers', true), '')::json;
  ip  text := coalesce(split_part(hdr->>'x-forwarded-for', ',', 1), 'unknown');
begin
  new.ip_hash    := md5(ip);
  new.created_at := now();
  new.name       := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  if exists (select 1 from public.banned_words b where new.name ilike '%' || b.word || '%') then
    raise exception 'That name is not allowed';
  end if;
  if (select count(*) from public.survival s
      where s.ip_hash = new.ip_hash and s.created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Too many submissions, try again in a minute';
  end if;
  return new;
end $$;

drop trigger if exists survival_guard on public.survival;
create trigger survival_guard before insert on public.survival for each row execute function public.survival_guard();

-- the public (anon) key may only read the board and add new rows; it can never edit or delete
alter table public.survival enable row level security;
drop policy if exists "anyone can read" on public.survival;
drop policy if exists "anyone can submit" on public.survival;
create policy "anyone can read"   on public.survival for select to anon using (true);
create policy "anyone can submit" on public.survival for insert to anon with check (true);

revoke all on public.survival from anon;
grant select (id, created_at, name, minutes, wave, tons, incidents, mill, version, env) on public.survival to anon;
grant insert (name, minutes, wave, tons, incidents, mill, version, env) on public.survival to anon;

-- v4.4.0-t3: survival waves are 4 days. A table made by an earlier version of this file checks for 7-day waves and would
-- refuse every score past wave 3; this swaps the check (it still accepts scores from 7-day test builds).
alter table public.survival drop constraint if exists survival_wave_fits;
alter table public.survival add constraint survival_wave_fits check (wave <= minutes / 5760 + 2 and minutes < wave * 10080);
