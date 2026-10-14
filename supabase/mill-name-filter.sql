-- The Paper Mill v5.0.3: the banned-word check now covers the mill name as well as the player name, on both boards.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run. Safe to run again.
-- It replaces the two guard functions from leaderboard.sql and survival.sql with the same rules plus the mill check;
-- the triggers already point at these functions, so nothing else changes.

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
  if exists (select 1 from public.banned_words b where coalesce(new.mill, '') ilike '%' || b.word || '%') then
    raise exception 'That mill name is not allowed';
  end if;
  if (select count(*) from public.scores s
      where s.ip_hash = new.ip_hash and s.created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Too many submissions, try again in a minute';
  end if;
  return new;
end $$;

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
  if exists (select 1 from public.banned_words b where coalesce(new.mill, '') ilike '%' || b.word || '%') then
    raise exception 'That mill name is not allowed';
  end if;
  if (select count(*) from public.survival s
      where s.ip_hash = new.ip_hash and s.created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Too many submissions, try again in a minute';
  end if;
  return new;
end $$;
