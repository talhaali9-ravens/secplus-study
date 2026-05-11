-- Run this entire file in the Supabase SQL Editor

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  is_paid             boolean not null default false,
  stripe_customer_id  text,
  stripe_session_id   text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (NEW.id, NEW.email);
  return NEW;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
