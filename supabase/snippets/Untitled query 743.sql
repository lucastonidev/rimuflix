BEGIN;

CREATE TABLE public.m3u_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  import_status text NOT NULL DEFAULT 'pending',
  imported_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  failure_count integer NOT NULL DEFAULT 0,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.m3u_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.m3u_playlists (id) ON DELETE CASCADE,
  external_key text NOT NULL,
  title text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie', 'series', 'live')),
  stream_url text NOT NULL,
  poster_url text,
  category text,
  season_number integer,
  episode_number integer,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, external_key)
);

CREATE INDEX m3u_media_type_idx ON public.m3u_media (media_type);
CREATE INDEX m3u_media_category_idx ON public.m3u_media (category);
CREATE INDEX m3u_media_playlist_idx ON public.m3u_media (playlist_id);
CREATE INDEX m3u_media_title_idx ON public.m3u_media (lower(title));

ALTER TABLE public.m3u_playlists ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.m3u_playlists TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.m3u_playlists TO service_role;
GRANT SELECT ON TABLE public.m3u_media TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.m3u_media TO service_role;

COMMIT;
