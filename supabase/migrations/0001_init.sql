-- Dental Arcade: initial schema (Phase 1)
-- Targets Supabase Postgres. Requires the auth schema that Supabase provides.
-- Principle: learners can read published content and their own records. Scores, XP, purchases,
-- subscriptions and referral rewards are written only by the server (service role), never by the browser.

create extension if not exists vector;

create type content_status as enum ('draft','in_review','approved','published','superseded','withdrawn');
create type user_role as enum ('learner','author','clinical_reviewer','admin');
create type plan_tier as enum ('free','paid','institution');

-- ───────────── Accounts ─────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'learner',
  plan plan_tier not null default 'free',
  supervisor text not null default 'mentor' check (supervisor in ('mentor','strict','roast','osce')),
  practice_mode text not null default 'guided' check (practice_mode in ('guided','unguided')),
  xp integer not null default 0 check (xp >= 0),
  streak_days integer not null default 0,
  last_active date,
  referral_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  referred_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check (referred_by is null or referred_by <> id)
);

create function has_role(variadic roles user_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = any(roles));
$$;

-- ───────────── Curriculum ─────────────
create table specialties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  cross_specialty boolean not null default false,
  sort integer not null default 0
);
create table subspecialties (
  id uuid primary key default gen_random_uuid(),
  specialty_id uuid not null references specialties(id) on delete cascade,
  slug text not null,
  name text not null,
  unique (specialty_id, slug)
);
create table procedures (
  id uuid primary key default gen_random_uuid(),
  specialty_id uuid not null references specialties(id) on delete cascade,
  subspecialty_id uuid references subspecialties(id) on delete set null,
  slug text not null unique,
  name text not null,
  -- 'planned' until a case exists; 'demo' is playable but unreviewed; 'published' is clinician-approved.
  catalogue_status text not null default 'planned' check (catalogue_status in ('planned','demo','published')),
  sort integer not null default 0
);
create table cases (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references procedures(id) on delete cascade,
  slug text not null unique,
  title text not null,
  level smallint not null check (level in (1,2)),
  synthetic boolean not null default true check (synthetic),
  created_at timestamptz not null default now()
);
create table content_versions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  version integer not null,
  status content_status not null default 'draft',
  body jsonb not null,
  ai_generated boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  withdrawn_reason text,
  unique (case_id, version)
);

-- ───────────── Clinical review ─────────────
create table clinical_references (
  id uuid primary key default gen_random_uuid(),
  citation text not null,
  url text,
  published_year integer,
  added_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create table content_references (
  version_id uuid not null references content_versions(id) on delete cascade,
  reference_id uuid not null references clinical_references(id) on delete restrict,
  primary key (version_id, reference_id)
);
create table reviewers (
  profile_id uuid primary key references profiles(id) on delete cascade,
  qualifications text not null,
  registration_no text,
  verified_by uuid references profiles(id),
  verified_at timestamptz
);
create table reviews (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references content_versions(id) on delete cascade,
  reviewer_id uuid not null references reviewers(profile_id),
  decision text not null check (decision in ('approved','changes_requested','rejected')),
  safety_critical_validated boolean not null default false,
  notes text,
  reviewed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 months')
);
create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb,
  at timestamptz not null default now()
);

-- Approval and publication need a live approval from a verified reviewer who is not the author.
-- Reviewed content is immutable: changes go into a new version, which starts again at draft.
create function guard_content_version() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.status in ('approved','published','superseded','withdrawn') and new.body is distinct from old.body then
    raise exception 'Reviewed content is immutable. Create a new version.';
  end if;
  if new.status in ('approved','published') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    if not exists (
      select 1 from reviews r join reviewers v on v.profile_id = r.reviewer_id
      where r.version_id = new.id and r.decision = 'approved' and r.safety_critical_validated
        and r.expires_at > now() and v.verified_at is not null
        and r.reviewer_id is distinct from new.created_by
    ) then
      raise exception 'A current approval from a verified clinical reviewer other than the author is required.';
    end if;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
    update content_versions set status = 'superseded' where case_id = new.case_id and status = 'published' and id <> new.id;
  end if;
  return new;
end $$;
create trigger content_version_guard before insert or update on content_versions
  for each row execute function guard_content_version();

create function audit_content_version() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log(actor, action, entity, entity_id, detail)
  values (auth.uid(), tg_op, 'content_version', new.id, jsonb_build_object('status', new.status, 'version', new.version));
  return new;
end $$;
create trigger content_version_audit after insert or update on content_versions
  for each row execute function audit_content_version();

-- Reviewed knowledge for the Level 2 specialist (retrieval arrives in Phase 4).
create table knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references content_versions(id) on delete cascade,
  reference_id uuid references clinical_references(id),
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- ───────────── Learning records ─────────────
create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  version_id uuid references content_versions(id),
  mode text not null check (mode in ('guided','unguided')),
  supervisor text not null,
  score integer,
  max_score integer,
  grade text,
  xp integer not null default 0,
  outcome jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index attempts_user_idx on attempts(user_id, started_at desc);
create table attempt_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references attempts(id) on delete cascade,
  rule_id text not null,
  points integer not null,
  note text,
  at timestamptz not null default now()
);
-- "Patient returns": follow-ups owed to a learner because of an earlier simulated decision.
create table patient_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  attempt_id uuid not null references attempts(id) on delete cascade,
  stage text not null,
  complication text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create table user_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  code text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ───────────── Commerce and referrals ─────────────
create table pricing (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('subscription_monthly','module','institution_seat')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'MYR',
  active boolean not null default true,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null,
  provider_ref text not null unique,
  status text not null,
  current_period_end timestamptz
);
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  procedure_id uuid not null references procedures(id),
  provider_ref text not null unique,
  amount_cents integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, procedure_id)
);
create table free_picks (
  user_id uuid not null references profiles(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  picked_at timestamptz not null default now(),
  primary key (user_id, procedure_id)
);
create function guard_free_pick() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from free_picks where user_id = new.user_id) >= 3 then
    raise exception 'Free accounts can choose three Level 1 procedures.';
  end if;
  if not exists (select 1 from procedures where id = new.procedure_id and catalogue_status in ('demo','published')) then
    raise exception 'This procedure is not available yet.';
  end if;
  return new;
end $$;
create trigger free_pick_guard before insert on free_picks for each row execute function guard_free_pick();

create table referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null unique references profiles(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','qualified','rewarded','rejected')),
  qualifying_attempt_id uuid references attempts(id),
  created_at timestamptz not null default now(),
  check (inviter_id <> referred_id)
);
create table referral_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  referral_id uuid not null unique references referrals(id) on delete cascade,
  redeemed_procedure_id uuid references procedures(id),
  redeemed_at timestamptz
);
-- A credit can only be spent on published, clinician-approved content.
create function guard_credit_redeem() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.redeemed_procedure_id is not null and not exists
     (select 1 from procedures where id = new.redeemed_procedure_id and catalogue_status = 'published') then
    raise exception 'Referral credits unlock published content only.';
  end if;
  return new;
end $$;
create trigger credit_redeem_guard before insert or update on referral_credits for each row execute function guard_credit_redeem();

-- New account: create the profile and record who invited them (never themselves).
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare inviter uuid;
begin
  select id into inviter from profiles where referral_code = new.raw_user_meta_data->>'ref' and id <> new.id;
  insert into profiles(id, display_name, referred_by) values (new.id, new.raw_user_meta_data->>'display_name', inviter);
  if inviter is not null then
    insert into referrals(inviter_id, referred_id) values (inviter, new.id);
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ───────────── Row level security ─────────────
alter table profiles enable row level security;
alter table specialties enable row level security;
alter table subspecialties enable row level security;
alter table procedures enable row level security;
alter table cases enable row level security;
alter table content_versions enable row level security;
alter table clinical_references enable row level security;
alter table content_references enable row level security;
alter table reviewers enable row level security;
alter table reviews enable row level security;
alter table audit_log enable row level security;
alter table knowledge_chunks enable row level security;
alter table attempts enable row level security;
alter table attempt_events enable row level security;
alter table patient_followups enable row level security;
alter table user_achievements enable row level security;
alter table pricing enable row level security;
alter table subscriptions enable row level security;
alter table purchases enable row level security;
alter table free_picks enable row level security;
alter table referrals enable row level security;
alter table referral_credits enable row level security;

-- Profiles: read your own; change only your display name and preferences.
create policy profiles_read on profiles for select using (id = auth.uid() or has_role('admin'));
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on profiles from authenticated, anon;
grant update (display_name, supervisor, practice_mode) on profiles to authenticated;

-- Catalogue is public. Staff manage it.
create policy specialties_read on specialties for select using (true);
create policy subspecialties_read on subspecialties for select using (true);
create policy procedures_read on procedures for select using (true);
create policy cases_read on cases for select using (true);
create policy specialties_write on specialties for all using (has_role('admin')) with check (has_role('admin'));
create policy subspecialties_write on subspecialties for all using (has_role('admin')) with check (has_role('admin'));
create policy procedures_write on procedures for all using (has_role('admin')) with check (has_role('admin'));
create policy cases_write on cases for all using (has_role('author','admin')) with check (has_role('author','admin'));

-- Content: learners see published versions only. Authors write drafts; the trigger guards status.
create policy versions_read on content_versions for select
  using (status = 'published' or has_role('author','clinical_reviewer','admin'));
create policy versions_insert on content_versions for insert
  with check (has_role('author','admin') and created_by = auth.uid() and status = 'draft');
create policy versions_update on content_versions for update
  using (has_role('author','clinical_reviewer','admin')) with check (has_role('author','clinical_reviewer','admin'));

create policy references_read on clinical_references for select using (true);
create policy references_write on clinical_references for all using (has_role('author','clinical_reviewer','admin')) with check (has_role('author','clinical_reviewer','admin'));
create policy content_references_read on content_references for select using (true);
create policy content_references_write on content_references for all using (has_role('author','admin')) with check (has_role('author','admin'));

create policy reviewers_read on reviewers for select using (has_role('author','clinical_reviewer','admin'));
create policy reviewers_write on reviewers for all using (has_role('admin')) with check (has_role('admin'));
-- A review is written by the reviewer in their own name. No one writes reviews for someone else.
create policy reviews_read on reviews for select using (has_role('author','clinical_reviewer','admin'));
create policy reviews_insert on reviews for insert
  with check (reviewer_id = auth.uid() and has_role('clinical_reviewer')
    and exists (select 1 from reviewers where profile_id = auth.uid() and verified_at is not null));
create policy audit_read on audit_log for select using (has_role('admin'));
create policy knowledge_read on knowledge_chunks for select using (has_role('author','clinical_reviewer','admin'));

-- Learning records: read your own. Writes happen on the server.
create policy attempts_read on attempts for select using (user_id = auth.uid() or has_role('admin'));
create policy attempt_events_read on attempt_events for select
  using (exists (select 1 from attempts a where a.id = attempt_id and (a.user_id = auth.uid() or has_role('admin'))));
create policy followups_read on patient_followups for select using (user_id = auth.uid());
create policy achievements_read on user_achievements for select using (user_id = auth.uid());

-- Commerce: prices are public; everything else is read-your-own and server-written.
create policy pricing_read on pricing for select using (active or has_role('admin'));
create policy pricing_write on pricing for all using (has_role('admin')) with check (has_role('admin'));
create policy subscriptions_read on subscriptions for select using (user_id = auth.uid() or has_role('admin'));
create policy purchases_read on purchases for select using (user_id = auth.uid() or has_role('admin'));
create policy free_picks_read on free_picks for select using (user_id = auth.uid());
create policy free_picks_insert on free_picks for insert with check (user_id = auth.uid());
create policy referrals_read on referrals for select using (inviter_id = auth.uid() or referred_id = auth.uid() or has_role('admin'));
create policy credits_read on referral_credits for select using (user_id = auth.uid() or has_role('admin'));
