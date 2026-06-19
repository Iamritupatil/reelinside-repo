-- =============================================================
--  Waitlist — Supabase only, ANON KEY ONLY (no service-role key)
--  Run in: Supabase Dashboard → SQL Editor → New query → Run
--
--  Model (safest):
--   • The anon key can do NOTHING directly to the table — no insert, select,
--     update or delete. RLS is on with zero policies and zero grants.
--   • The ONLY way to join is the SECURITY DEFINER function join_waitlist(),
--     which enforces rate limiting + format + disposable-domain + honeypot
--     INSIDE the database, so none of it can be bypassed with the public key.
--   • waitlist_count() exposes a number only — never emails.
--   • To read signups, use the Supabase Dashboard → Table Editor (your owner
--     login). The app never needs the service-role key.
-- =============================================================

-- 1) Table -----------------------------------------------------
create table if not exists public.waitlist (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_format
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 320)
);

create unique index if not exists waitlist_email_lower_idx
  on public.waitlist (lower(email));

-- 2) Total lockdown -------------------------------------------
alter table public.waitlist enable row level security;

-- Drop any policies/grants from earlier setups so the table is fully sealed.
drop policy if exists "deny_anon_delete"        on public.waitlist;
drop policy if exists "deny_anon_update"         on public.waitlist;
drop policy if exists "public count"             on public.waitlist;
drop policy if exists "allow public insert"      on public.waitlist;
drop policy if exists "public can join waitlist" on public.waitlist;
revoke all on public.waitlist from anon, authenticated;
-- (No policies + no grants => anon/authenticated cannot touch the table at all.
--  The SECURITY DEFINER functions below are the only doorway in.)

-- 3) Disposable / throwaway email domains (spam filter) --------
create table if not exists public.disposable_domains (
  domain text primary key
);
alter table public.disposable_domains enable row level security;
revoke all on public.disposable_domains from anon, authenticated;

insert into public.disposable_domains (domain) values
  ('10minutemail.com'),('20minutemail.com'),('33mail.com'),('guerrillamail.com'),
  ('guerrillamail.info'),('guerrillamail.biz'),('guerrillamail.de'),('grr.la'),
  ('sharklasers.com'),('mailinator.com'),('mailinator.net'),('mailinator2.com'),
  ('maildrop.cc'),('mailnesia.com'),('mintemail.com'),('tempmail.com'),
  ('temp-mail.org'),('tempmailo.com'),('tempmail.net'),('throwawaymail.com'),
  ('getnada.com'),('nada.email'),('dispostable.com'),('yopmail.com'),
  ('yopmail.net'),('yopmail.fr'),('fakeinbox.com'),('trashmail.com'),
  ('trashmail.net'),('trashmail.de'),('wegwerfmail.de'),('mohmal.com'),
  ('emailondeck.com'),('spam4.me'),('mytemp.email'),('moakt.com'),
  ('tmail.ws'),('tmailto.plus'),('mail.tm'),('mail7.io'),
  ('inboxkitten.com'),('luxusmail.org'),('email-temp.com'),('discard.email'),
  ('discardmail.com'),('jetable.org'),('mailcatch.com'),('spambog.com'),
  ('spambog.de'),('mailexpire.com'),('tempinbox.com'),('temporary-mail.net'),
  ('vomoto.com'),('burnermail.io'),('33mail.io'),('anonbox.net'),
  ('mail-temp.com'),('rootfest.net'),('one-time.email'),('cs.email'),
  ('byom.de'),('haribu.com'),('zetmail.com'),('emailfake.com'),
  ('fakemail.net'),('tempr.email'),('einrot.com'),('mvrht.com')
on conflict (domain) do nothing;

-- 4) Rate-limit store (private; only the function touches it) --
create table if not exists public.rate_limit_hits (
  id         bigint generated always as identity primary key,
  key        text        not null,   -- md5(ip)
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_key_time_idx
  on public.rate_limit_hits (key, created_at);
alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;

-- Old standalone limiter (replaced by join_waitlist) — drop if present.
drop function if exists public.check_rate_limit(text, int, interval);

-- 5) The ONLY way to join ------------------------------------
-- Returns a status code: 'ok' | 'invalid' | 'disposable' | 'rate_limited'.
-- Enforces everything server-side (in the DB), so the public anon key cannot
-- skip any of it.
create or replace function public.join_waitlist(p_email text, p_website text default '')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text := lower(trim(p_email));
  v_domain text;
  v_ip     text;
  v_key    text;
  v_count  int;
begin
  -- Rate limit FIRST so every attempt counts: 5 per IP per 10 minutes.
  v_ip := split_part(
            coalesce((current_setting('request.headers', true))::json ->> 'x-forwarded-for', 'unknown'),
            ',', 1);
  v_key := md5(v_ip);

  delete from public.rate_limit_hits where created_at < now() - interval '60 minutes';

  select count(*) into v_count
    from public.rate_limit_hits
    where key = v_key and created_at > now() - interval '10 minutes';

  if v_count >= 5 then
    return 'rate_limited';
  end if;

  insert into public.rate_limit_hits (key) values (v_key);

  -- Honeypot: bots fill p_website. Pretend success, insert nothing.
  if coalesce(trim(p_website), '') <> '' then
    return 'ok';
  end if;

  -- Format / length.
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 320 then
    return 'invalid';
  end if;

  -- Disposable-domain spam filter.
  v_domain := split_part(v_email, '@', 2);
  if exists (select 1 from public.disposable_domains d where d.domain = v_domain) then
    return 'disposable';
  end if;

  -- Insert. Duplicate => treat as success (no enumeration).
  begin
    insert into public.waitlist (email) values (v_email);
  exception when unique_violation then
    return 'ok';
  end;

  return 'ok';
end;
$$;

revoke all on function public.join_waitlist(text, text) from public;
grant execute on function public.join_waitlist(text, text) to anon, authenticated;

-- 6) Safe public count ----------------------------------------
create or replace function public.waitlist_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.waitlist;
$$;

revoke all on function public.waitlist_count() from public;
grant execute on function public.waitlist_count() to anon, authenticated;
