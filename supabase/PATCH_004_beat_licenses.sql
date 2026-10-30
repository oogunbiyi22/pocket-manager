-- ═══════════════════════════════════════════════════════════════════════════════
-- POCKET MANAGER — PATCH 004
-- Beat Licensing persistence: per-user logged beat licenses (lease / exclusive)
-- Run after MASTER_RUNME.sql. Also folded into MASTER_RUNME.sql.
-- Safe to run multiple times: CREATE IF NOT EXISTS + DROP POLICY IF EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Beat licenses ───────────────────────────────────────────────────────────
-- Backs /beats (Beat Licensing Manager). One row per logged license.
-- Written/read via src/app/api/v1/beats (service role, scoped to the
-- authenticated user); RLS below also protects direct client access.
-- song_id is the catalog song id (songs live as JSONB in user_catalogs,
-- so there is no FK target for it — it is stored as plain text).

CREATE TABLE IF NOT EXISTS public.beat_licenses (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id      text          NOT NULL,
  buyer        text          NOT NULL,
  license_type text          NOT NULL CHECK (license_type IN ('lease', 'exclusive')),
  amount       numeric(12,2) NOT NULL DEFAULT 0,
  license_date date          NOT NULL DEFAULT CURRENT_DATE,
  expires      date,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS beat_licenses_user_id_idx ON public.beat_licenses (user_id);
ALTER TABLE public.beat_licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "beat_licenses_owner" ON public.beat_licenses;
CREATE POLICY "beat_licenses_owner" ON public.beat_licenses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.beat_licenses TO authenticated, service_role;
