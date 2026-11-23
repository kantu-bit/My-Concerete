-- Run this SQL in Supabase Dashboard -> SQL Editor (Project: pcurnfguwxncmmgbedmf)
-- 1) Adds notify_email_status, notify_whatsapp_status, and notified_at columns to all lead tables
-- 2) Enables pg_net and installs AFTER INSERT database triggers for bookings, quotes, enquiries, and site_visits
--    calling the "notify-lead" Supabase Edge Function.

alter table public.bookings
  add column if not exists notify_email_status text not null default 'pending',
  add column if not exists notify_whatsapp_status text not null default 'pending',
  add column if not exists notified_at timestamptz;

alter table public.quotes
  add column if not exists notify_email_status text not null default 'pending',
  add column if not exists notify_whatsapp_status text not null default 'pending',
  add column if not exists notified_at timestamptz;

alter table public.enquiries
  add column if not exists notify_email_status text not null default 'pending',
  add column if not exists notify_whatsapp_status text not null default 'pending',
  add column if not exists notified_at timestamptz;

alter table public.site_visits
  add column if not exists notify_email_status text not null default 'pending',
  add column if not exists notify_whatsapp_status text not null default 'pending',
  add column if not exists notified_at timestamptz;

-- Enable pg_net for asynchronous HTTP calls from Postgres triggers
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_notify_lead_edge_function()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  edge_url text := 'https://pcurnfguwxncmmgbedmf.supabase.co/functions/v1/notify-lead';
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW)
  );

  perform net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );

  return NEW;
end;
$$;

drop trigger if exists trg_notify_lead_bookings on public.bookings;
create trigger trg_notify_lead_bookings
  after insert on public.bookings
  for each row
  execute function public.trigger_notify_lead_edge_function();

drop trigger if exists trg_notify_lead_quotes on public.quotes;
create trigger trg_notify_lead_quotes
  after insert on public.quotes
  for each row
  execute function public.trigger_notify_lead_edge_function();

drop trigger if exists trg_notify_lead_enquiries on public.enquiries;
create trigger trg_notify_lead_enquiries
  after insert on public.enquiries
  for each row
  execute function public.trigger_notify_lead_edge_function();

drop trigger if exists trg_notify_lead_site_visits on public.site_visits;
create trigger trg_notify_lead_site_visits
  after insert on public.site_visits
  for each row
  execute function public.trigger_notify_lead_edge_function();
