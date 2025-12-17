-- Add your email here to make yourself an admin
-- Replace 'your-email@example.com' with your actual email address

UPDATE public.profiles 
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'sidkid78@gmail.com'
);

-- Verify the update
SELECT 
  u.email,
  p.role,
  p.full_name
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'sidkid78@gmail.com';
