-- 0001_initial_schema.sql
-- Nahl Technologies web — initial schema
-- Applied to project nahltech-web (Nahl Technologies Products org).
-- This file is the source of truth. Dashboard SQL editor is verification only.

create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type lead_source as enum (
  'contact_form','audit_request','newsletter','chat_widget',
  'booking','crawlmouse_referral','outreach','other'
);

create type lead_status as enum (
  'new','contacted','qualified','proposal','won','lost','disqualified'
);

create type service_interest as enum (
  'ai_search_visibility','local_seo','web_development',
  'ai_automation','unsure','other'
);

-- ============================================================
-- TABLES
-- ============================================================
create table public.leads (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  name                text,
  email               text,
  phone               text,
  company             text,
  website             text,
  employee_count      text,
  vertical            text,
  city                text,
  currently_marketing boolean,
  source              lead_source not null,
  service_interest    service_interest,
  message             text,
  status              lead_status not null default 'new',
  landing_page        text,
  referrer            text,
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  locale              text default 'en',
  first_contacted_at  timestamptz,
  notes               text
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx     on public.leads (status);
create index leads_source_idx     on public.leads (source);
create index leads_email_idx      on public.leads (email);

create table public.lead_events (
  id         uuid primary key default uuid_generate_v4(),
  lead_id    uuid references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  detail     jsonb not null default '{}'::jsonb
);

create index lead_events_lead_idx on public.lead_events (lead_id, created_at desc);

create table public.newsletter_subscribers (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  email           text not null unique,
  locale          text default 'en',
  source_page     text,
  confirmed       boolean not null default false,
  unsubscribed_at timestamptz
);

create table public.chat_conversations (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),
  session_id   text not null,
  lead_id      uuid references public.leads(id) on delete set null,
  landing_page text,
  locale       text default 'en',
  user_agent   text,
  ended_at     timestamptz
);

create index chat_conv_session_idx on public.chat_conversations (session_id);

create table public.chat_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  role            text not null check (role in ('user','assistant')),
  content         text not null check (char_length(content) <= 8000)
);

create index chat_msg_conv_idx on public.chat_messages (conversation_id, created_at);

create table public.audit_requests (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  lead_id       uuid references public.leads(id) on delete cascade,
  domain        text not null,
  business_name text,
  service_area  text,
  qualified     boolean,
  delivered_at  timestamptz,
  report_url    text
);

create table public.notification_log (
  id         uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  lead_id    uuid references public.leads(id) on delete cascade,
  channel    text not null,
  status     text not null,
  error      text
);

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- anon may INSERT on chat tables only. anon may NEVER SELECT anything.
-- RLS cannot restrict columns, so any anon SELECT policy exposes every
-- column on that table. All reads happen server-side via service role.
-- newsletter_subscribers has NO anon grant: /api/subscribe inserts with
-- the service role, matching the /api/lead pattern.
-- ============================================================
alter table public.leads                  enable row level security;
alter table public.lead_events            enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.chat_conversations     enable row level security;
alter table public.chat_messages          enable row level security;
alter table public.audit_requests         enable row level security;
alter table public.notification_log       enable row level security;

revoke all on all tables in schema public from anon, authenticated;

grant insert on public.chat_conversations to anon;
grant insert on public.chat_messages      to anon;

create policy "anon_insert_chat_conversations"
  on public.chat_conversations for insert to anon with check (true);

create policy "anon_insert_chat_messages"
  on public.chat_messages for insert to anon with check (true);

-- NOTE: anon has no SELECT privilege, so INSERT ... RETURNING will fail
-- for the anon role. The chat client generates its own UUIDs and inserts
-- them explicitly rather than reading them back.
