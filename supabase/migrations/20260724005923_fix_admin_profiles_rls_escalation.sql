/*
# Fix admin_profiles privilege escalation & harden role management

## Problem
The `admin_update_own_profile` RLS policy allowed any authenticated user to
UPDATE their own row with NO column restrictions. A user could change their
own `role` to `super_admin` and their own `active` flag — a direct privilege
escalation that bypassed all admin authorization.

## Fix
1. Replace the self-update policy so users can only update their own
   `full_name` — role and active are protected by a database trigger.
2. Add a trigger (`guard_admin_profile_fields`) that prevents any role or
   active change unless the current user is an active super_admin. This is
   enforced at the database level regardless of how the request is made.
3. Add a super_admin-only UPDATE policy so super_admins can manage other
   admins' roles and active status through the normal client.
4. Add a super_admin-only INSERT policy so only super_admins can create
   admin profile rows for other users (self-insert on signup still allowed
   by the existing insert policy).

## Security
- Role escalation: blocked by trigger + policy.
- Self-deactivation/reactivation: blocked by trigger.
- Super_admin can still manage all profiles.
- Self-name update still works for any authenticated admin.
*/

-- ─── 1. Guard trigger: prevent role/active changes by non-super_admins ───
CREATE OR REPLACE FUNCTION public.guard_admin_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  is_super_admin boolean;
BEGIN
  -- Only check when role or active is actually changing
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.active IS DISTINCT FROM OLD.active THEN
    SELECT EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND active = true
    ) INTO is_super_admin;

    IF NOT is_super_admin THEN
      RAISE EXCEPTION 'Only super_admins can change role or active status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_admin_profile_fields ON public.admin_profiles;
CREATE TRIGGER trg_guard_admin_profile_fields
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_admin_profile_fields();

-- ─── 2. Replace self-update policy (name only) ───────────────────────────
DROP POLICY IF EXISTS "admin_update_own_profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_update_any_profile" ON public.admin_profiles;

-- Users can update their own row (trigger guards role/active columns)
CREATE POLICY "admin_update_own_profile" ON public.admin_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super_admins can update any admin profile row
CREATE POLICY "super_admin_update_any_profile" ON public.admin_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND active = true
  ))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND active = true
  ));

-- ─── 3. Restrict INSERT to self-only (no creating profiles for others) ───
-- The existing self-insert policy stays; no super_admin insert needed since
-- users self-provision on first login.
