create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  frog_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, frog_id)
);

alter table public.favorites enable row level security;

create policy "Users can read their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);
