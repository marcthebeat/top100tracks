-- Users table (Simplified for NextAuth, using Spotify ID as PK)
create table public.users (
  id text primary key, -- Spotify User ID
  display_name text,
  profile_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Playlists table
create table public.playlists (
  id uuid default gen_random_uuid() primary key,
  creator_user_id text references public.users(id) not null,
  spotify_playlist_id text,
  title text not null,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tracks table (Canonical source of tracks)
create table public.tracks (
  id uuid default gen_random_uuid() primary key,
  spotify_track_id text unique not null,
  name text not null,
  artist text not null,
  album_art text,
  preview_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Playlist Tracks (Join table)
create table public.playlist_tracks (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  track_id uuid references public.tracks(id) not null,
  position integer not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(playlist_id, position),
  unique(playlist_id, track_id)
);

-- Votes table
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  track_id uuid references public.tracks(id) not null,
  reviewer_id text references public.users(id), -- Nullable for anonymous/session votes
  session_id text, -- For tracking anonymous votes
  vote_type text check (vote_type in ('agree', 'disagree')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(playlist_id, track_id, reviewer_id, session_id)
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.playlists enable row level security;
alter table public.tracks enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.votes enable row level security;

-- Public read access
create policy "Public playlists are viewable by everyone" on public.playlists
  for select using (true);

create policy "Tracks are viewable by everyone" on public.tracks
  for select using (true);

create policy "Playlist tracks are viewable by everyone" on public.playlist_tracks
  for select using (true);

create policy "Votes are viewable by everyone" on public.votes
  for select using (true);

-- Allow users to insert/update their own data (Basic policy, refine as needed)
create policy "Users can insert their own profile" on public.users
  for insert with check (true);

create policy "Users can update their own profile" on public.users
  for update using (true);
