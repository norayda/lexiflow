-- ============================================================
-- LexiFlow – Initial Schema
-- ============================================================

-- Profiles (one per auth user)
create table profiles (
  id uuid references auth.users(id) primary key,
  username text,
  native_language text check (native_language in ('fr','en','es')),
  learning_language text check (learning_language in ('fr','en','es')),
  notification_time time default '07:30',
  scroll_speed int default 50,
  created_at timestamp with time zone default now()
);

-- Daily texts (one per day, in 3 languages)
create table daily_texts (
  id uuid default gen_random_uuid() primary key,
  text_date date unique not null,
  theme text,
  word_count int,
  content_fr text not null,
  content_en text not null,
  content_es text not null,
  created_at timestamp with time zone default now()
);

-- Reading progress (one per user per text)
create table reading_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  text_id uuid references daily_texts(id) on delete cascade,
  read_at timestamp with time zone default now(),
  completed boolean default false,
  unique(user_id, text_id)
);

-- Vocabulary box
create table vocabulary_box (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  text_id uuid references daily_texts(id) on delete cascade,
  word text not null,
  language text not null,
  context_sentence text,
  translation_fr text,
  translation_en text,
  translation_es text,
  saved_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table daily_texts enable row level security;
alter table reading_progress enable row level security;
alter table vocabulary_box enable row level security;

-- profiles: owner only
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- daily_texts: readable by any authenticated user
create policy "daily_texts_select_authenticated"
  on daily_texts for select
  using (auth.role() = 'authenticated');

-- reading_progress: owner only
create policy "reading_progress_all_own"
  on reading_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- vocabulary_box: owner only
create policy "vocabulary_box_all_own"
  on vocabulary_box for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
