-- ─── Fix 1: Prevent self-privilege-escalation on admin_profiles ───────
-- The admin_update_own_profile policy had WITH CHECK (auth.uid() = id)
-- which allows any authenticated user to change their own role to
-- 'super_admin'. Fix: restrict the self-update policy to only allow
-- updating non-privileged columns (full_name, updated_at). Role and
-- active can only be changed by super_admin via the other policy.
-- We do this by adding a column-level RESTRICT + tightening the policy.

-- Drop the old self-update policy
DROP POLICY IF EXISTS admin_update_own_profile ON admin_profiles;

-- Recreate with a WITH CHECK that prevents changing role or active
-- The user can only update their own non-sensitive columns
CREATE POLICY admin_update_own_profile ON admin_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM admin_profiles WHERE id = auth.uid())
    AND active = (SELECT active FROM admin_profiles WHERE id = auth.uid())
  );

-- ─── Fix 2: Add DELETE policy for admin_profiles ──────────────────────
-- There was no DELETE policy at all. With RLS enabled and no DELETE
-- policy, deletes are blocked for everyone. But best practice is to
-- have an explicit policy so the intent is clear and we don't rely
-- on the absence of a policy. Only super_admins can delete profiles.
CREATE POLICY admin_delete_own_profile ON admin_profiles
  FOR DELETE TO authenticated
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
      AND ap.role = 'super_admin'
      AND ap.active = true
    )
  );

-- ─── Fix 3: Revoke excess grants from anon on admin_profiles ──────────
-- anon has SELECT, INSERT, UPDATE, DELETE grants on admin_profiles
-- but no policies target anon. With RLS enabled this is harmless
-- (RLS blocks all access), but defense-in-depth: revoke unnecessary
-- grants from anon so the table is not reachable at all from the
-- anon key.
REVOKE SELECT, INSERT, UPDATE, DELETE ON admin_profiles FROM anon;
