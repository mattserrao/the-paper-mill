-- The Paper Mill v5.0.6: the banned-word check now folds look-alikes on the server too, the same way the game does
-- (1/!/| -> i, 0 -> o, 3 -> e, 4/@ -> a, $/5 -> s, 7 -> t, common Greek/Cyrillic letters -> Latin, accents dropped,
-- then spaces and punctuation removed), so "Sh1t", "f u c k" and "fυck" are refused even from an old copy of the game.
-- A few real words that contain a banned word ("Scunthorpe") are allowed first.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run. Safe to run again.
-- It replaces the two guard functions from mill-name-filter.sql with the same rules (rate limit unchanged);
-- the triggers already point at these functions, so nothing else changes.

create or replace function public.name_banned(t text) returns boolean
language plpgsql immutable set search_path = public as $$
declare
  f text := lower(normalize(coalesce(t, ''), NFKD));
begin
  f := regexp_replace(f, '[\u0300-\u036f]', '', 'g');                       -- accents
  f := translate(f, 'авсϲеεёһнηіιїјкκмоοσрρѕтτυμνшωхχуγı', 'abcceeehhniiijkkmoooppsttuuvwwxxyyi');
  f := translate(f, '1!|034@$57', 'iiioeaasst');
  f := replace(replace(replace(f, 'scunthorpe', ' '), 'shiitake', ' '), 'shitake', ' ');
  f := regexp_replace(f, '[^a-z]', '', 'g');
  return exists (select 1 from public.banned_words b where position(lower(b.word) in f) > 0);
end $$;

create or replace function public.scores_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  hdr json := nullif(current_setting('request.headers', true), '')::json;
  ip  text := coalesce(split_part(hdr->>'x-forwarded-for', ',', 1), 'unknown');
begin
  new.ip_hash    := md5(ip);
  new.created_at := now();
  new.name       := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  if public.name_banned(new.name) then
    raise exception 'That name is not allowed';
  end if;
  if public.name_banned(new.mill) then
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
  if public.name_banned(new.name) then
    raise exception 'That name is not allowed';
  end if;
  if public.name_banned(new.mill) then
    raise exception 'That mill name is not allowed';
  end if;
  if (select count(*) from public.survival s
      where s.ip_hash = new.ip_hash and s.created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Too many submissions, try again in a minute';
  end if;
  return new;
end $$;

-- Rows already on the boards that the new check would refuse (review, then delete if you agree):
-- select 'survival' as board, name, mill, created_at from public.survival where public.name_banned(name) or public.name_banned(mill)
-- union all
-- select 'scores', name, mill, created_at from public.scores where public.name_banned(name) or public.name_banned(mill);
