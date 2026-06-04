
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "view own profile" on public.profiles for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- timestamp trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- INTERVIEWS
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  difficulty text not null,
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  per_question jsonb not null default '[]'::jsonb,
  total_score integer,
  communication_score integer,
  technical_score integer,
  strengths text[],
  weaknesses text[],
  summary text,
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.interviews enable row level security;

create policy "view own interviews" on public.interviews for select using (auth.uid() = user_id);
create policy "insert own interviews" on public.interviews for insert with check (auth.uid() = user_id);
create policy "update own interviews" on public.interviews for update using (auth.uid() = user_id);
create policy "delete own interviews" on public.interviews for delete using (auth.uid() = user_id);

create index interviews_user_created_idx on public.interviews(user_id, created_at desc);
