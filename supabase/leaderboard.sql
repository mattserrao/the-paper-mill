-- The Paper Mill: season leaderboard
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text   not null check (char_length(name) between 2 and 16 and name ~ '^[A-Za-z0-9 ._''-]+$'),
  score       bigint not null check (score between -10000000 and 60000000),   -- net profit over the season, $
  tons        integer not null check (tons between 0 and 100000),            -- tons shipped
  incidents   integer not null default 0 check (incidents between 0 and 3000),
  mill        text   check (char_length(mill) <= 40),
  version     text   check (char_length(version) <= 12),
  days        integer not null check (days = 30),
  ip_hash     text
);
create index if not exists scores_rank on public.scores (score desc, tons desc);

-- words you never want to see in a player name (add more any time: insert into public.banned_words values ('...');)
create table if not exists public.banned_words (word text primary key);
insert into public.banned_words(word) values ('fuck'),('shit'),('cunt'),('bitch'),('nazi'),('hitler')
  on conflict do nothing;

-- guard: name filter + max 3 submissions per minute from the same address
create or replace function public.scores_guard() returns trigger
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
  if (select count(*) from public.scores s
      where s.ip_hash = new.ip_hash and s.created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Too many submissions, try again in a minute';
  end if;
  return new;
end $$;

drop trigger if exists scores_guard on public.scores;
create trigger scores_guard before insert on public.scores for each row execute function public.scores_guard();

-- the public (anon) key may only read the board and add new rows; it can never edit or delete
alter table public.scores enable row level security;
drop policy if exists "anyone can read" on public.scores;
drop policy if exists "anyone can submit" on public.scores;
create policy "anyone can read"   on public.scores for select to anon using (true);
create policy "anyone can submit" on public.scores for insert to anon with check (true);

revoke all on public.scores from anon;
grant select (id, created_at, name, score, tons, incidents, mill, version, days) on public.scores to anon;
grant insert (name, score, tons, incidents, mill, version, days) on public.scores to anon;
revoke all on public.banned_words from anon;
