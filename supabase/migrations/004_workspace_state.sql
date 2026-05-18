-- Persist non-catalog workspace state for the real product spine.
-- This keeps project rooms, events, platform setup, and money entries off demo-only local state.

CREATE TABLE IF NOT EXISTS public.user_workspace_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  money_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  platform_connections jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_workspace_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_workspace_state_owner" ON public.user_workspace_state;
CREATE POLICY "user_workspace_state_owner" ON public.user_workspace_state
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.user_workspace_state TO service_role;
