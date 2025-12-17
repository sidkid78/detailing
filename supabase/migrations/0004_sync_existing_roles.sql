-- Update existing profiles to have the correct role from auth.users metadata
UPDATE public.profiles p
SET role = COALESCE((u.raw_user_meta_data->>'role')::public.user_role, 'customer')
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'role' IS NOT NULL
  AND p.role != (u.raw_user_meta_data->>'role')::public.user_role;

-- Verify the updates
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as metadata_role,
  p.role as profile_role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'role' IS NOT NULL;
